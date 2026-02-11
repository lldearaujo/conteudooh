"""
Schemas Pydantic para validação de dados do Link Tracking System
"""
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ============================================
# Schemas de Link
# ============================================

class LinkCreate(BaseModel):
    identifier: str = Field(..., min_length=1, max_length=100, description="Identificador único do link")
    destination_url: HttpUrl = Field(..., description="URL de destino para redirecionamento")
    ponto_dooh: str = Field(..., min_length=1, max_length=200, description="Ponto DOOH onde o link será exibido")
    campanha: str = Field(..., min_length=1, max_length=200, description="Nome da campanha do cliente")
    
    # Novos campos opcionais - Dados de Campanha OOH
    qr_code_id: Optional[str] = Field(None, max_length=200, description="ID único do QR Code por ponto")
    peca_criativa: Optional[str] = Field(None, max_length=200, description="Nome/ID da peça criativa")
    local_especifico: Optional[str] = Field(None, max_length=200, description="Localização detalhada (ex: BR-230, km 45)")
    tipo_midia: Optional[str] = Field(None, max_length=50, description="Tipo de mídia: Outdoor, Frontlight, LED, Backlight, Transit, etc.")
    
    # UTMs opcionais - serão auto-preenchidos se não fornecidos
    utm_source: Optional[str] = Field(None, max_length=100, description="UTM Source (padrão: ooh ou dooh)")
    utm_medium: Optional[str] = Field(None, max_length=100, description="UTM Medium (padrão: outdoor, led, frontlight, etc.)")
    utm_campaign: Optional[str] = Field(None, max_length=200, description="UTM Campaign (pode ser diferente de campanha)")
    utm_content: Optional[str] = Field(None, max_length=200, description="UTM Content (ID da peça criativa)")
    utm_term: Optional[str] = Field(None, max_length=200, description="UTM Term (termo de busca, opcional)")


class LinkResponse(BaseModel):
    id: int
    identifier: str
    destination_url: str
    ponto_dooh: str
    campanha: str
    qr_code_id: Optional[str] = None
    peca_criativa: Optional[str] = None
    local_especifico: Optional[str] = None
    tipo_midia: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    total_clicks: int = 0

    class Config:
        from_attributes = True


class LinkList(BaseModel):
    links: List[LinkResponse]
    total: int


# ============================================
# Schemas de Click
# ============================================

class ClickResponse(BaseModel):
    id: int
    link_id: int
    ip_address: Optional[str]
    user_agent: Optional[str]
    referrer: Optional[str]
    device_type: Optional[str]
    browser: Optional[str]
    operating_system: Optional[str]
    country: Optional[str]
    city: Optional[str]
    state: Optional[str] = None
    language: Optional[str] = None
    isp: Optional[str] = None
    timezone: Optional[str] = None
    clicked_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============================================
# Schemas de Analytics
# ============================================

class TopLink(BaseModel):
    link_id: int
    identifier: str
    destination_url: str
    ponto_dooh: str
    campanha: str
    total_clicks: int
    unique_ips: int


class AnalyticsResponse(BaseModel):
    total_clicks: int
    unique_ips: int
    clicks_by_ponto: Dict[str, int]
    clicks_by_campanha: Dict[str, int]
    clicks_by_device: Dict[str, int]
    clicks_by_country: Dict[str, int]
    clicks_by_day: Dict[str, int]
    top_links: List[TopLink]


class LinkAnalytics(BaseModel):
    link_id: int
    identifier: str
    destination_url: str
    ponto_dooh: str
    campanha: str
    total_clicks: int
    unique_ips: int
    clicks_by_device: Dict[str, int]
    clicks_by_country: Dict[str, int]
    clicks_by_day: Dict[str, int]


# ============================================
# Schemas de ConversionEvent
# ============================================

class ConversionEventCreate(BaseModel):
    click_id: int = Field(..., description="ID do clique associado")
    event_type: str = Field(..., min_length=1, max_length=50, description="Tipo do evento: pageview, scroll, cta_click, whatsapp, form, download, call, purchase")
    event_value: Optional[str] = Field(None, description="Dados adicionais em formato JSON string")


class ConversionEventResponse(BaseModel):
    id: int
    click_id: int
    event_type: str
    event_value: Optional[str]
    occurred_at: Optional[datetime]

    class Config:
        from_attributes = True


class ConversionMetrics(BaseModel):
    total_events: int
    events_by_type: Dict[str, int]
    average_time_on_page: float
    scroll_depth_stats: Dict[str, int]
    conversion_rate: float
    total_conversions: int
    conversions_by_type: Dict[str, int]
