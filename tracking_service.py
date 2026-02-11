"""
Serviço de rastreamento de cliques
Extrai dados do visitante e cria registros de clique
"""
from fastapi import Request
from sqlalchemy.orm import Session
from user_agents import parse as parse_user_agent
from timezone_utils import agora_brasil
import requests
import logging

logger = logging.getLogger(__name__)


class TrackingService:
    """Serviço para rastreamento de cliques"""
    
    @staticmethod
    def get_client_ip(request: Request) -> str:
        """
        Extrai o endereço IP do cliente considerando proxies e load balancers
        
        Ordem de prioridade:
        1. X-Forwarded-For (primeiro IP da lista)
        2. X-Real-IP
        3. request.client.host
        4. "unknown" se nenhum disponível
        """
        # X-Forwarded-For pode conter múltiplos IPs separados por vírgula
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Pegar o primeiro IP (cliente original)
            ip = forwarded_for.split(",")[0].strip()
            if ip:
                return ip
        
        # X-Real-IP
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        
        # request.client.host
        if request.client and request.client.host:
            return request.client.host
        
        return "unknown"
    
    @staticmethod
    def parse_user_agent(user_agent_str: str) -> dict:
        """
        Faz parse do User-Agent e extrai informações
        
        Retorna:
        - device_type: "mobile", "tablet", "desktop", ou "unknown"
        - browser: "Chrome 120.0" ou "unknown"
        - operating_system: "Windows 10" ou "unknown"
        """
        if not user_agent_str:
            return {
                "device_type": "unknown",
                "browser": "unknown",
                "operating_system": "unknown"
            }
        
        try:
            ua = parse_user_agent(user_agent_str)
            
            # Device type
            if ua.is_mobile:
                device_type = "mobile"
            elif ua.is_tablet:
                device_type = "tablet"
            else:
                device_type = "desktop"
            
            # Browser
            browser_family = ua.browser.family if ua.browser.family else "unknown"
            browser_version = ua.browser.version_string if ua.browser.version_string else ""
            browser = f"{browser_family} {browser_version}".strip() if browser_version else browser_family
            
            # Operating System
            os_family = ua.os.family if ua.os.family else "unknown"
            os_version = ua.os.version_string if ua.os.version_string else ""
            operating_system = f"{os_family} {os_version}".strip() if os_version else os_family
            
            return {
                "device_type": device_type,
                "browser": browser,
                "operating_system": operating_system
            }
        except Exception as e:
            logger.warning(f"Erro ao fazer parse do User-Agent: {e}")
            return {
                "device_type": "unknown",
                "browser": "unknown",
                "operating_system": "unknown"
            }
    
    @staticmethod
    def get_location_info(ip: str) -> dict:
        """
        Busca informações de geolocalização usando ipapi.co (serviço gratuito)
        
        Retorna:
        - country: Nome do país ou None
        - city: Nome da cidade ou None
        - state: Estado/Região ou None
        - isp: Provedor de internet ou None
        - timezone: Timezone do usuário ou None
        
        Se falhar, retorna dict com valores None
        """
        if not ip or ip == "unknown" or ip.startswith("127.") or ip.startswith("192.168.") or ip.startswith("10."):
            return {"country": None, "city": None, "state": None, "isp": None, "timezone": None}
        
        try:
            # Usar serviço gratuito ipapi.co
            # Limite: 1000 requisições/dia (suficiente para começar)
            url = f"https://ipapi.co/{ip}/json/"
            response = requests.get(url, timeout=3)
            
            if response.status_code == 200:
                data = response.json()
                country = data.get("country_name")
                city = data.get("city")
                state = data.get("region")  # Estado/Região
                isp = data.get("org")  # Provedor de internet
                timezone = data.get("timezone")  # Timezone
                
                return {
                    "country": country if country else None,
                    "city": city if city else None,
                    "state": state if state else None,
                    "isp": isp if isp else None,
                    "timezone": timezone if timezone else None
                }
            else:
                logger.warning(f"GeoIP retornou status {response.status_code} para IP {ip}")
                return {"country": None, "city": None, "state": None, "isp": None, "timezone": None}
        except requests.exceptions.Timeout:
            logger.warning(f"Timeout ao buscar GeoIP para IP {ip}")
            return {"country": None, "city": None, "state": None, "isp": None, "timezone": None}
        except Exception as e:
            logger.warning(f"Erro ao buscar GeoIP para IP {ip}: {e}")
            return {"country": None, "city": None, "state": None, "isp": None, "timezone": None}
    
    @staticmethod
    def get_language(request: Request) -> str:
        """
        Extrai o idioma principal do header Accept-Language
        
        Retorna:
        - Idioma principal (ex: "pt-BR", "en-US") ou "unknown"
        """
        accept_language = request.headers.get("Accept-Language", "")
        if not accept_language:
            return "unknown"
        
        try:
            # Accept-Language pode ser: "pt-BR,pt;q=0.9,en-US;q=0.8"
            # Pegar o primeiro idioma (mais preferido)
            first_lang = accept_language.split(",")[0].strip()
            # Remover quality values (q=0.9)
            if ";" in first_lang:
                first_lang = first_lang.split(";")[0].strip()
            return first_lang if first_lang else "unknown"
        except Exception as e:
            logger.warning(f"Erro ao extrair idioma: {e}")
            return "unknown"
    
    @staticmethod
    def track_click(db: Session, link_id: int, request: Request):
        """
        Método principal que orquestra todo o rastreamento
        
        Processo:
        1. Extrai IP do cliente
        2. Extrai User-Agent e faz parse
        3. Extrai Referrer
        4. Busca geolocalização (opcional, não bloqueia se falhar)
        5. Cria registro de clique
        """
        from models import Click
        
        # Extrair dados básicos
        ip_address = TrackingService.get_client_ip(request)
        user_agent_str = request.headers.get("User-Agent", "")
        referrer = request.headers.get("Referer")
        
        # Parse User-Agent
        ua_data = TrackingService.parse_user_agent(user_agent_str)
        
        # Buscar geolocalização (não bloqueia se falhar)
        location_data = TrackingService.get_location_info(ip_address)
        
        # Extrair idioma do dispositivo
        language = TrackingService.get_language(request)
        
        # Criar registro de clique (com timezone UTC-03:00)
        click = Click(
            link_id=link_id,
            ip_address=ip_address if ip_address != "unknown" else None,
            user_agent=user_agent_str if user_agent_str else None,
            referrer=referrer if referrer else None,
            device_type=ua_data["device_type"],
            browser=ua_data["browser"],
            operating_system=ua_data["operating_system"],
            country=location_data["country"],
            city=location_data["city"],
            state=location_data["state"],
            isp=location_data["isp"],
            timezone=location_data["timezone"],
            language=language if language != "unknown" else None,
            clicked_at=agora_brasil()  # Garantir timezone correto
        )
        
        db.add(click)
        db.commit()
        db.refresh(click)
        
        logger.info(f"Clique rastreado: link_id={link_id}, ip={ip_address}, device={ua_data['device_type']}, click_id={click.id}")
        
        return click
