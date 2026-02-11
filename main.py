from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
import os
import qrcode
import io
import logging
from datetime import datetime, timedelta
from timezone_utils import agora_brasil
from urllib.parse import urlencode, urlparse, urlunparse, parse_qs

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from database import engine, get_db, Base
from models import Noticia, Link, Click, ConversionEvent
from schemas import LinkCreate, LinkResponse, LinkList, AnalyticsResponse, LinkAnalytics, TopLink, ConversionEventCreate, ConversionEventResponse, ConversionMetrics
from tracking_service import TrackingService
from analytics_service import AnalyticsService
from scraper import RadiocentroScraper
from scheduler import iniciar_scheduler
from weather_service import criar_servico_clima, WeatherService
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

# Criar tabelas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ConteudoOH - Sistema de Mídia Indoor/DOOH")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurar templates
templates = Environment(loader=FileSystemLoader("templates"))

# Montar arquivos estáticos
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# Montar pasta de mídias
if os.path.exists("medias"):
    app.mount("/medias", StaticFiles(directory="medias"), name="medias")

# Montar pasta de ícones
if os.path.exists("icones"):
    app.mount("/icones", StaticFiles(directory="icones"), name="icones")

# Iniciar scheduler para atualização automática
iniciar_scheduler()

@app.get("/", response_class=HTMLResponse)
async def tela_exibicao(request: Request, db: Session = Depends(get_db)):
    """Tela cheia para exibição de notícias"""
    template = templates.get_template("exibicao.html")
    content = template.render()
    return HTMLResponse(content=content)

@app.get("/api/noticias/aleatoria")
async def obter_noticia_aleatoria(db: Session = Depends(get_db)):
    """Retorna uma notícia aleatória ativa dos últimos 2 dias
    
    Regra de frescor:
    - Tenta usar data_publicacao quando existir
    - Se não houver data_publicacao, usa data_criacao
    """
    import random
    limite_dias = 2
    limite_data = agora_brasil() - timedelta(days=limite_dias)

    # Notícias com data_publicacao recente
    noticias = (
        db.query(Noticia)
        .filter(
            Noticia.ativa == True,
            (
                # Usa data_publicacao quando existir
                ((Noticia.data_publicacao != None) & (Noticia.data_publicacao >= limite_data))
                |
                # Fallback: quando não há data_publicacao, considera data_criacao
                ((Noticia.data_publicacao == None) & (Noticia.data_criacao != None) & (Noticia.data_criacao >= limite_data))
            )
        )
        .all()
    )
    if not noticias:
        raise HTTPException(status_code=404, detail="Nenhuma notícia ativa encontrada")
    noticia = random.choice(noticias)
    return noticia.to_dict()

@app.get("/admin", response_class=HTMLResponse)
async def painel_admin(request: Request, db: Session = Depends(get_db)):
    """Painel administrativo"""
    noticias = db.query(Noticia).order_by(desc(Noticia.data_criacao)).all()
    noticias_dict = [n.to_dict() for n in noticias]
    noticias_ativas = [n for n in noticias_dict if n['ativa']]
    noticias_inativas = [n for n in noticias_dict if not n['ativa']]
    
    template = templates.get_template("admin.html")
    content = template.render(
        noticias=noticias_dict,
        noticias_ativas=noticias_ativas,
        noticias_inativas=noticias_inativas
    )
    return HTMLResponse(content=content)

# API REST
@app.get("/api/noticias", response_model=List[dict])
async def listar_noticias(db: Session = Depends(get_db), ativa: bool = None):
    """Lista notícias, priorizando itens recentes
    
    - Por padrão, retorna apenas notícias dos últimos 2 dias
    - Se quiser todas, use o parâmetro ?ativa=true/false explicitamente
    """
    limite_dias = 2
    limite_data = agora_brasil() - timedelta(days=limite_dias)

    query = db.query(Noticia)
    if ativa is not None:
        query = query.filter(Noticia.ativa == ativa)

    # Aplicar filtro de últimos 2 dias
    query = query.filter(
        (
            (Noticia.data_publicacao != None) & (Noticia.data_publicacao >= limite_data)
        ) | (
            (Noticia.data_publicacao == None) & (Noticia.data_criacao != None) & (Noticia.data_criacao >= limite_data)
        )
    )

    noticias = query.order_by(desc(Noticia.data_criacao)).all()
    return [n.to_dict() for n in noticias]

@app.get("/api/noticias/{noticia_id}")
async def obter_noticia(noticia_id: int, db: Session = Depends(get_db)):
    """Obtém uma notícia específica"""
    noticia = db.query(Noticia).filter(Noticia.id == noticia_id).first()
    if not noticia:
        raise HTTPException(status_code=404, detail="Notícia não encontrada")
    return noticia.to_dict()

@app.post("/api/noticias/atualizar")
async def atualizar_noticias(db: Session = Depends(get_db)):
    """Força atualização das notícias do site"""
    scraper = RadiocentroScraper()
    novas_noticias = scraper.obter_noticias(limite=30)
    
    adicionadas = 0
    for noticia_data in novas_noticias:
        # Verificar se já existe
        existente = db.query(Noticia).filter(Noticia.url == noticia_data['url']).first()
        if not existente:
            nova_noticia = Noticia(
                titulo=noticia_data['titulo'],
                conteudo=noticia_data['conteudo'],
                url=noticia_data['url'],
                imagem_url=noticia_data['imagem_url'],
                data_publicacao=noticia_data['data_publicacao']
            )
            db.add(nova_noticia)
            adicionadas += 1
    
    db.commit()
    return {"mensagem": f"{adicionadas} novas notícias adicionadas", "total": len(novas_noticias)}

@app.put("/api/noticias/{noticia_id}")
async def atualizar_noticia(noticia_id: int, dados: dict, db: Session = Depends(get_db)):
    """Atualiza uma notícia"""
    noticia = db.query(Noticia).filter(Noticia.id == noticia_id).first()
    if not noticia:
        raise HTTPException(status_code=404, detail="Notícia não encontrada")
    
    for key, value in dados.items():
        if hasattr(noticia, key):
            setattr(noticia, key, value)
    
    db.commit()
    db.refresh(noticia)
    return noticia.to_dict()

@app.delete("/api/noticias/{noticia_id}")
async def deletar_noticia(noticia_id: int, db: Session = Depends(get_db)):
    """Deleta uma notícia"""
    noticia = db.query(Noticia).filter(Noticia.id == noticia_id).first()
    if not noticia:
        raise HTTPException(status_code=404, detail="Notícia não encontrada")
    
    db.delete(noticia)
    db.commit()
    return {"mensagem": "Notícia deletada com sucesso"}

@app.patch("/api/noticias/{noticia_id}/toggle")
async def toggle_noticia(noticia_id: int, db: Session = Depends(get_db)):
    """Ativa/desativa uma notícia"""
    noticia = db.query(Noticia).filter(Noticia.id == noticia_id).first()
    if not noticia:
        raise HTTPException(status_code=404, detail="Notícia não encontrada")
    
    noticia.ativa = not noticia.ativa
    db.commit()
    db.refresh(noticia)
    return noticia.to_dict()

@app.get("/api/noticias/{noticia_id}/qrcode")
async def gerar_qrcode_noticia(noticia_id: int, request: Request, db: Session = Depends(get_db), tamanho: str = "normal"):
    """Gera um QR code do link da matéria - otimizado para telas de baixa resolução
    Integrado com sistema de tracking: QR code aponta para link rastreável
    
    Parâmetros:
    - tamanho: "pequeno" para telas muito pequenas (128x192, 160x240) ou "normal" para outras
    """
    try:
        print(f"[QR Code] Requisição recebida para notícia ID: {noticia_id}, tamanho: {tamanho}")
        noticia = db.query(Noticia).filter(Noticia.id == noticia_id).first()
        if not noticia:
            print(f"[QR Code] Notícia {noticia_id} não encontrada")
            raise HTTPException(status_code=404, detail="Notícia não encontrada")
        
        if not noticia.url:
            print(f"[QR Code] Notícia {noticia_id} não tem URL")
            raise HTTPException(status_code=400, detail="URL da notícia não disponível")
        
        # Garantir que a URL seja válida e completa
        url = noticia.url.strip()
        if not url.startswith(('http://', 'https://')):
            # Se não começar com http/https, adicionar https://
            if url.startswith('//'):
                url = 'https:' + url
            elif url.startswith('/'):
                url = 'https://radiocentrocz.com.br' + url
            else:
                url = 'https://' + url
        
        # Criar ou buscar link rastreável para esta notícia
        identifier = f"noticia-{noticia_id}"
        qr_code_id = f"qr-noticias-{noticia_id}"
        link = db.query(Link).filter(Link.identifier == identifier).first()
        
        # Truncar título se necessário para campanha (máx 200 chars)
        # Definir campanha antes do if/else para uso em ambos os blocos
        campanha = noticia.titulo[:200] if noticia.titulo and len(noticia.titulo) > 200 else (noticia.titulo or "Notícia")
        
        if not link:
            # Criar novo link rastreável
            
            # Auto-gerar UTMs para notícias
            link = Link(
                identifier=identifier,
                destination_url=url,
                ponto_dooh="Notícias",
                campanha=campanha,
                qr_code_id=qr_code_id,
                tipo_midia="DOOH",  # Padrão para notícias
                utm_source="dooh",
                utm_medium="digital",
                utm_campaign=campanha[:200] if len(campanha) > 200 else campanha,
                utm_content=qr_code_id
            )
            db.add(link)
            db.commit()
            db.refresh(link)
            print(f"[QR Code] Link rastreável criado: {identifier}")
        else:
            # Atualizar URL de destino se mudou
            if link.destination_url != url:
                link.destination_url = url
                db.commit()
                print(f"[QR Code] Link rastreável atualizado: {identifier}")
            
            # Garantir que tem qr_code_id e UTMs (para links antigos)
            if not link.qr_code_id:
                link.qr_code_id = qr_code_id
            if not link.utm_source:
                link.utm_source = "dooh"
            if not link.utm_medium:
                link.utm_medium = "digital"
            if not link.utm_campaign:
                link.utm_campaign = campanha[:200] if len(campanha) > 200 else campanha
            if not link.utm_content:
                link.utm_content = qr_code_id
            if not link.tipo_midia:
                link.tipo_midia = "DOOH"
            db.commit()
        
        # Gerar URL do link rastreável
        base_url = str(request.base_url).rstrip('/')
        tracking_url = f"{base_url}/r/{identifier}"
        
        print(f"[QR Code] Gerando QR code para URL rastreável: {tracking_url}")
        
        # Configurações diferentes para telas pequenas vs normais
        if tamanho == "pequeno":
            # Para telas muito pequenas: correção de erro baixa para simplificar o QR code
            error_correction = qrcode.constants.ERROR_CORRECT_L  # Correção baixa (~7%) para menos detalhamento
            box_size = 8  # Módulos menores
            border = 2  # Borda mínima
            print(f"[QR Code] Usando configuração para tela pequena: error_correction=L, box_size={box_size}, border={border}")
        else:
            # Para telas maiores: correção de erro média e módulos menores
            error_correction = qrcode.constants.ERROR_CORRECT_M  # Correção média (~15%) ao invés de H (~30%)
            box_size = 10  # Módulos menores para menos detalhamento
            border = 3  # Borda menor
            print(f"[QR Code] Usando configuração normal: error_correction=M, box_size={box_size}, border={border}")
        
        # Criar QR code - otimizado para telas de baixa resolução e escaneamento à distância
        qr = qrcode.QRCode(
            version=None,  # Deixa a biblioteca escolher a versão mínima necessária
            error_correction=error_correction,
            box_size=box_size,
            border=border,
        )
        qr.add_data(tracking_url)
        qr.make(fit=True)
        
        # Criar imagem com alto contraste
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Converter para bytes com qualidade máxima
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG', optimize=False)
        img_bytes.seek(0)
        
        tamanho_bytes = len(img_bytes.getvalue())
        print(f"[QR Code] QR code gerado com sucesso. Tamanho: {tamanho_bytes} bytes, versão: {qr.version}")
        
        # Adicionar headers para evitar cache e garantir que a imagem seja servida corretamente
        headers = {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
        
        return Response(content=img_bytes.getvalue(), media_type="image/png", headers=headers)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = f"Erro ao gerar QR code: {e}"
        print(f"[QR Code] ERRO: {error_msg}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_msg)

@app.get("/clima", response_class=HTMLResponse)
async def tela_clima(request: Request):
    """Tela cheia para exibição de condições meteorológicas"""
    template = templates.get_template("clima.html")
    content = template.render()
    return HTMLResponse(content=content)

@app.get("/api/clima")
async def obter_dados_clima(cidade: str = None, estado: str = None):
    """Retorna dados meteorológicos atuais e previsão.
    
    - Se nenhum parâmetro for passado, usa as coordenadas padrão (Cajazeiras - PB)
    - Se ?cidade=NomeDaCidade for informado, tenta buscar as coordenadas via geocoding
    """
    try:
        latitude = None
        longitude = None
        nome_exibicao = "Cajazeiras - PB"

        if cidade:
            # Usa geocoding por cidade + estado (quando disponível)
            coords = WeatherService.buscar_coordenadas(cidade=cidade, estado=estado)
            if coords:
                latitude = coords["latitude"]
                longitude = coords["longitude"]
                nome_exibicao = coords.get("nome_formatado") or nome_exibicao
            else:
                logger.warning(f"Não foi possível obter coordenadas para a cidade: {cidade}. Usando padrão.")

        servico = criar_servico_clima(latitude=latitude, longitude=longitude)
        # Passa nome_exibicao para o método que agora suporta cache
        dados = servico.obter_clima_atual(nome_cidade=nome_exibicao)
        
        if dados is None:
            raise HTTPException(status_code=503, detail="Serviço meteorológico temporariamente indisponível")

        # Garante que o nome exibido corresponda ao que foi resolvido pelo backend
        if "localizacao" not in dados:
            dados["localizacao"] = {}
        dados["localizacao"]["nome"] = nome_exibicao
        
        return dados
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter dados climáticos: {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar dados meteorológicos")

# ============================================
# LINK TRACKING SYSTEM - Endpoints
# ============================================

# Gestão de Links
@app.post("/api/links", response_model=LinkResponse, status_code=201)
async def criar_link(link_data: LinkCreate, db: Session = Depends(get_db)):
    """Cria um novo link rastreável"""
    # Verificar se identifier já existe
    link_existente = db.query(Link).filter(Link.identifier == link_data.identifier).first()
    if link_existente:
        raise HTTPException(status_code=400, detail=f"Link com identifier '{link_data.identifier}' já existe")
    
    # Auto-gerar UTMs se não fornecidos
    utm_source = link_data.utm_source or "ooh"
    utm_medium = link_data.utm_medium or link_data.tipo_midia or "outdoor"
    utm_campaign = link_data.utm_campaign or link_data.campanha
    utm_content = link_data.utm_content or link_data.qr_code_id or link_data.peca_criativa
    
    # Criar novo link
    novo_link = Link(
        identifier=link_data.identifier,
        destination_url=str(link_data.destination_url),
        ponto_dooh=link_data.ponto_dooh,
        campanha=link_data.campanha,
        qr_code_id=link_data.qr_code_id,
        peca_criativa=link_data.peca_criativa,
        local_especifico=link_data.local_especifico,
        tipo_midia=link_data.tipo_midia,
        utm_source=utm_source,
        utm_medium=utm_medium,
        utm_campaign=utm_campaign,
        utm_content=utm_content,
        utm_term=link_data.utm_term
    )
    
    db.add(novo_link)
    db.commit()
    db.refresh(novo_link)
    
    # Retornar com total_clicks = 0
    link_dict = novo_link.to_dict(include_clicks_count=True, db=db)
    return LinkResponse(**link_dict)

@app.get("/api/links", response_model=LinkList)
async def listar_links(
    skip: int = 0,
    limit: int = 100,
    ponto_dooh: str = None,
    campanha: str = None,
    db: Session = Depends(get_db)
):
    """Lista links com filtros opcionais"""
    query = db.query(Link)
    
    if ponto_dooh:
        query = query.filter(Link.ponto_dooh == ponto_dooh)
    if campanha:
        query = query.filter(Link.campanha == campanha)
    
    total = query.count()
    links = query.order_by(desc(Link.created_at)).offset(skip).limit(limit).all()
    
    links_response = [
        LinkResponse(**link.to_dict(include_clicks_count=True, db=db))
        for link in links
    ]
    
    return LinkList(links=links_response, total=total)

@app.get("/api/links/{link_id}", response_model=LinkResponse)
async def obter_link(link_id: int, db: Session = Depends(get_db)):
    """Obtém um link específico"""
    link = db.query(Link).filter(Link.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link não encontrado")
    
    link_dict = link.to_dict(include_clicks_count=True, db=db)
    return LinkResponse(**link_dict)

@app.delete("/api/links/{link_id}", status_code=204)
async def deletar_link(link_id: int, db: Session = Depends(get_db)):
    """Deleta um link e todos os seus cliques (cascade)"""
    link = db.query(Link).filter(Link.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link não encontrado")
    
    db.delete(link)
    db.commit()
    return Response(status_code=204)

# Rastreamento
@app.get("/r/{identifier}")
async def rastrear_e_redirecionar(identifier: str, request: Request, db: Session = Depends(get_db)):
    """Rastreia um clique e redireciona para a URL de destino com UTMs"""
    # Buscar link
    link = db.query(Link).filter(Link.identifier == identifier).first()
    if not link:
        raise HTTPException(status_code=404, detail=f"Link com identifier '{identifier}' não encontrado")
    
    # Rastrear clique (não bloqueia se falhar)
    click_id = None
    try:
        click = TrackingService.track_click(db, link.id, request)
        if click:
            click_id = click.id
    except Exception as e:
        logger.error(f"Erro ao rastrear clique para link {link.id}: {e}")
        # Continua mesmo se tracking falhar
    
    # Construir URL de destino com UTMs
    destination_url = link.destination_url
    
    # Se o link tem UTMs configurados, adicionar à URL
    utm_params = {}
    if link.utm_source:
        utm_params["utm_source"] = link.utm_source
    if link.utm_medium:
        utm_params["utm_medium"] = link.utm_medium
    if link.utm_campaign:
        utm_params["utm_campaign"] = link.utm_campaign
    if link.utm_content:
        utm_params["utm_content"] = link.utm_content
    if link.utm_term:
        utm_params["utm_term"] = link.utm_term
    
    if utm_params:
        # Parse da URL para adicionar query params
        parsed = urlparse(destination_url)
        existing_params = parse_qs(parsed.query)
        
        # Adicionar UTMs (não sobrescrever se já existirem)
        for key, value in utm_params.items():
            if key not in existing_params:
                existing_params[key] = [value]
        
        # Reconstruir URL com novos params
        new_query = urlencode(existing_params, doseq=True)
        destination_url = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment
        ))
    
    # Adicionar click_id à URL para tracking pós-scan
    if click_id:
        parsed = urlparse(destination_url)
        existing_params = parse_qs(parsed.query)
        if 'click_id' not in existing_params:
            existing_params['click_id'] = [str(click_id)]
            new_query = urlencode(existing_params, doseq=True)
            destination_url = urlunparse((
                parsed.scheme,
                parsed.netloc,
                parsed.path,
                parsed.params,
                new_query,
                parsed.fragment
            ))
    
    # Redirecionar
    return RedirectResponse(url=destination_url, status_code=302)

# Tracking de Eventos de Conversão
@app.post("/api/tracking/event", response_model=ConversionEventResponse, status_code=201)
async def registrar_evento_conversao(event_data: ConversionEventCreate, db: Session = Depends(get_db)):
    """
    Registra um evento de conversão/comportamento pós-scan
    
    Tipos de eventos suportados:
    - pageview: Visualização de página
    - scroll: Scroll depth (25%, 50%, 75%, 100%)
    - cta_click: Clique em CTA
    - whatsapp: Conversão via WhatsApp
    - form: Preenchimento de formulário
    - download: Download de arquivo
    - call: Chamada telefônica
    - purchase: Compra/Conversão final
    """
    # Verificar se o click existe
    click = db.query(Click).filter(Click.id == event_data.click_id).first()
    if not click:
        raise HTTPException(status_code=404, detail=f"Click com ID {event_data.click_id} não encontrado")
    
    # Validar tipo de evento
    tipos_validos = ["pageview", "scroll", "cta_click", "whatsapp", "form", "download", "call", "purchase"]
    if event_data.event_type not in tipos_validos:
        raise HTTPException(
            status_code=400, 
            detail=f"Tipo de evento inválido. Tipos válidos: {', '.join(tipos_validos)}"
        )
    
    # Criar evento
    evento = ConversionEvent(
        click_id=event_data.click_id,
        event_type=event_data.event_type,
        event_value=event_data.event_value,
        occurred_at=agora_brasil()
    )
    
    db.add(evento)
    db.commit()
    db.refresh(evento)
    
    logger.info(f"Evento de conversão registrado: click_id={event_data.click_id}, type={event_data.event_type}")
    
    return ConversionEventResponse(**evento.to_dict())

# Analytics
@app.get("/api/analytics", response_model=AnalyticsResponse)
async def obter_analytics(
    ponto_dooh: str = None,
    campanha: str = None,
    link_id: int = None,
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db)
):
    """Obtém métricas agregadas de analytics com filtros opcionais"""
    metrics = AnalyticsService.get_link_analytics(
        db, ponto_dooh, campanha, link_id, start_date, end_date
    )
    
    # Converter top_links para TopLink
    top_links = [TopLink(**link) for link in metrics["top_links"]]
    
    return AnalyticsResponse(
        total_clicks=metrics["total_clicks"],
        unique_ips=metrics["unique_ips"],
        clicks_by_ponto=metrics["clicks_by_ponto"],
        clicks_by_campanha=metrics["clicks_by_campanha"],
        clicks_by_device=metrics["clicks_by_device"],
        clicks_by_country=metrics["clicks_by_country"],
        clicks_by_day=metrics["clicks_by_day"],
        top_links=top_links
    )

@app.get("/api/analytics/link/{link_id}", response_model=LinkAnalytics)
async def obter_analytics_link(link_id: int, start_date: str = None, end_date: str = None, db: Session = Depends(get_db)):
    """Obtém métricas específicas de um link"""
    analytics = AnalyticsService.get_link_specific_analytics(db, link_id, start_date, end_date)
    
    if not analytics:
        raise HTTPException(status_code=404, detail="Link não encontrado")
    
    return LinkAnalytics(**analytics)


@app.get("/api/analytics/conversions", response_model=ConversionMetrics)
async def obter_metricas_conversao(
    link_id: int = None,
    click_id: int = None,
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db)
):
    """Obtém métricas de conversão/comportamento pós-scan"""
    metrics = AnalyticsService.get_conversion_metrics(db, link_id, click_id, start_date, end_date)
    return ConversionMetrics(**metrics)

if __name__ == "__main__":
    import uvicorn
    import os
    import logging
    
    # Configurar logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

