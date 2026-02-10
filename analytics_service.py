"""
Serviço de analytics para cálculo de métricas de cliques
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from models import Link, Click
import logging

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Serviço para cálculo de métricas de analytics"""
    
    @staticmethod
    def get_link_analytics(
        db: Session,
        ponto_dooh: Optional[str] = None,
        campanha: Optional[str] = None,
        link_id: Optional[int] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> dict:
        """
        Calcula métricas agregadas de cliques com filtros opcionais
        
        Retorna:
        - total_clicks: Total de cliques
        - unique_ips: IPs únicos
        - clicks_by_ponto: Dict {ponto: count}
        - clicks_by_campanha: Dict {campanha: count}
        - clicks_by_device: Dict {device: count}
        - clicks_by_country: Dict {country: count}
        - clicks_by_day: Dict {YYYY-MM-DD: count}
        - top_links: Lista dos top 10 links
        """
        # Construir query base
        query = db.query(Click)
        
        # Aplicar filtros de data
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date)
                query = query.filter(Click.clicked_at >= start_dt)
            except ValueError:
                logger.warning(f"Data inicial inválida: {start_date}")
        
        if end_date:
            try:
                # Ajustar para fim do dia
                end_dt = datetime.fromisoformat(end_date)
                end_dt = end_dt.replace(hour=23, minute=59, second=59)
                query = query.filter(Click.clicked_at <= end_dt)
            except ValueError:
                logger.warning(f"Data final inválida: {end_date}")
        
        # Aplicar filtros de link (ponto, campanha, link_id)
        link_filters = []
        if ponto_dooh:
            link_filters.append(Link.ponto_dooh == ponto_dooh)
        if campanha:
            link_filters.append(Link.campanha == campanha)
        if link_id:
            link_filters.append(Link.id == link_id)
        
        if link_filters:
            query = query.join(Link).filter(and_(*link_filters))
        else:
            query = query.join(Link)
        
        # Obter todos os cliques filtrados com eager loading do link
        clicks = query.options(joinedload(Click.link)).all()
        
        # Calcular métricas
        total_clicks = len(clicks)
        
        # IPs únicos
        unique_ips = len(set(click.ip_address for click in clicks if click.ip_address))
        
        # Agrupamentos
        clicks_by_ponto = {}
        clicks_by_campanha = {}
        clicks_by_device = {}
        clicks_by_country = {}
        clicks_by_day = {}
        
        for click in clicks:
            # Por ponto DOOH
            if hasattr(click, 'link') and click.link and click.link.ponto_dooh:
                ponto = click.link.ponto_dooh
                clicks_by_ponto[ponto] = clicks_by_ponto.get(ponto, 0) + 1
            
            # Por campanha
            if hasattr(click, 'link') and click.link and click.link.campanha:
                camp = click.link.campanha
                clicks_by_campanha[camp] = clicks_by_campanha.get(camp, 0) + 1
            
            # Por dispositivo
            device = click.device_type or "unknown"
            clicks_by_device[device] = clicks_by_device.get(device, 0) + 1
            
            # Por país
            country = click.country or "unknown"
            clicks_by_country[country] = clicks_by_country.get(country, 0) + 1
            
            # Por dia
            if click.clicked_at:
                day_str = click.clicked_at.strftime("%Y-%m-%d")
                clicks_by_day[day_str] = clicks_by_day.get(day_str, 0) + 1
        
        # Top 10 links
        top_links = AnalyticsService._get_top_links(
            db, ponto_dooh, campanha, link_id, start_date, end_date
        )
        
        return {
            "total_clicks": total_clicks,
            "unique_ips": unique_ips,
            "clicks_by_ponto": clicks_by_ponto,
            "clicks_by_campanha": clicks_by_campanha,
            "clicks_by_device": clicks_by_device,
            "clicks_by_country": clicks_by_country,
            "clicks_by_day": clicks_by_day,
            "top_links": top_links
        }
    
    @staticmethod
    def _get_top_links(
        db: Session,
        ponto_dooh: Optional[str] = None,
        campanha: Optional[str] = None,
        link_id: Optional[int] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[dict]:
        """
        Calcula top 10 links por total de cliques
        
        Retorna lista de dicts com:
        - link_id, identifier, destination_url, ponto_dooh, campanha
        - total_clicks, unique_ips
        """
        # Query base para links
        query = db.query(Link)
        
        # Aplicar filtros de link
        if ponto_dooh:
            query = query.filter(Link.ponto_dooh == ponto_dooh)
        if campanha:
            query = query.filter(Link.campanha == campanha)
        if link_id:
            query = query.filter(Link.id == link_id)
        
        links = query.all()
        
        # Calcular métricas para cada link
        link_metrics = []
        
        for link in links:
            # Query de cliques para este link
            clicks_query = db.query(Click).filter(Click.link_id == link.id)
            
            # Aplicar filtros de data
            if start_date:
                try:
                    start_dt = datetime.fromisoformat(start_date)
                    clicks_query = clicks_query.filter(Click.clicked_at >= start_dt)
                except ValueError:
                    pass
            
            if end_date:
                try:
                    end_dt = datetime.fromisoformat(end_date)
                    end_dt = end_dt.replace(hour=23, minute=59, second=59)
                    clicks_query = clicks_query.filter(Click.clicked_at <= end_dt)
                except ValueError:
                    pass
            
            clicks = clicks_query.all()
            total_clicks = len(clicks)
            
            # Só incluir links com pelo menos 1 clique
            if total_clicks > 0:
                unique_ips = len(set(c.ip_address for c in clicks if c.ip_address))
                
                link_metrics.append({
                    "link_id": link.id,
                    "identifier": link.identifier,
                    "destination_url": link.destination_url,
                    "ponto_dooh": link.ponto_dooh,
                    "campanha": link.campanha,
                    "total_clicks": total_clicks,
                    "unique_ips": unique_ips
                })
        
        # Ordenar por total_clicks (decrescente) e limitar a 10
        link_metrics.sort(key=lambda x: x["total_clicks"], reverse=True)
        return link_metrics[:10]
    
    @staticmethod
    def get_link_specific_analytics(
        db: Session,
        link_id: int,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> dict:
        """
        Calcula métricas específicas de um link
        
        Retorna:
        - link_id, identifier, destination_url, ponto_dooh, campanha
        - total_clicks, unique_ips
        - clicks_by_device, clicks_by_country, clicks_by_day
        """
        # Buscar link
        link = db.query(Link).filter(Link.id == link_id).first()
        if not link:
            return None
        
        # Query de cliques
        query = db.query(Click).filter(Click.link_id == link_id)
        
        # Aplicar filtros de data
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date)
                query = query.filter(Click.clicked_at >= start_dt)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date)
                end_dt = end_dt.replace(hour=23, minute=59, second=59)
                query = query.filter(Click.clicked_at <= end_dt)
            except ValueError:
                pass
        
        clicks = query.all()
        
        # Calcular métricas
        total_clicks = len(clicks)
        unique_ips = len(set(c.ip_address for c in clicks if c.ip_address))
        
        # Agrupamentos
        clicks_by_device = {}
        clicks_by_country = {}
        clicks_by_day = {}
        
        for click in clicks:
            device = click.device_type or "unknown"
            clicks_by_device[device] = clicks_by_device.get(device, 0) + 1
            
            country = click.country or "unknown"
            clicks_by_country[country] = clicks_by_country.get(country, 0) + 1
            
            if click.clicked_at:
                day_str = click.clicked_at.strftime("%Y-%m-%d")
                clicks_by_day[day_str] = clicks_by_day.get(day_str, 0) + 1
        
        return {
            "link_id": link.id,
            "identifier": link.identifier,
            "destination_url": link.destination_url,
            "ponto_dooh": link.ponto_dooh,
            "campanha": link.campanha,
            "total_clicks": total_clicks,
            "unique_ips": unique_ips,
            "clicks_by_device": clicks_by_device,
            "clicks_by_country": clicks_by_country,
            "clicks_by_day": clicks_by_day
        }
