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


class LinkResponse(BaseModel):
    id: int
    identifier: str
    destination_url: str
    ponto_dooh: str
    campanha: str
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
