from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from timezone_utils import agora_brasil

# Função para usar no server_default que retorna datetime com timezone
def now_brasil():
    return agora_brasil()

class Noticia(Base):
    __tablename__ = "noticias"
    
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)
    conteudo = Column(Text)
    url = Column(String, unique=True, nullable=False)
    imagem_url = Column(String, nullable=True)
    data_publicacao = Column(DateTime, nullable=True)
    data_criacao = Column(DateTime, default=now_brasil)
    ativa = Column(Boolean, default=True)
    ordem = Column(Integer, default=0)
    
    def to_dict(self):
        return {
            "id": self.id,
            "titulo": self.titulo,
            "conteudo": self.conteudo,
            "url": self.url,
            "imagem_url": self.imagem_url,
            "data_publicacao": self.data_publicacao.isoformat() if self.data_publicacao else None,
            "data_criacao": self.data_criacao.isoformat() if self.data_criacao else None,
            "ativa": self.ativa,
            "ordem": self.ordem
        }


class Link(Base):
    __tablename__ = "links"
    
    id = Column(Integer, primary_key=True, index=True)
    identifier = Column(String(100), unique=True, nullable=False, index=True)
    destination_url = Column(Text, nullable=False)
    ponto_dooh = Column(String(200), nullable=False)
    campanha = Column(String(200), nullable=False)
    
    # Novos campos - Dados de Campanha OOH
    qr_code_id = Column(String(200), nullable=True, index=True)  # ID único do QR Code por ponto (unique removido para permitir NULL)
    peca_criativa = Column(String(200), nullable=True)  # Nome/ID da peça criativa
    local_especifico = Column(String(200), nullable=True)  # Localização detalhada (ex: "BR-230, km 45")
    tipo_midia = Column(String(50), nullable=True)  # "Outdoor", "Frontlight", "LED", "Backlight", "Transit", etc.
    
    # UTMs - Padrão da indústria
    utm_source = Column(String(100), nullable=True)  # Padrão: "ooh" ou "dooh"
    utm_medium = Column(String(100), nullable=True)  # Padrão: "outdoor", "led", "frontlight", etc.
    utm_campaign = Column(String(200), nullable=True)  # Pode ser diferente de "campanha"
    utm_content = Column(String(200), nullable=True)  # ID da peça criativa específica
    utm_term = Column(String(200), nullable=True)  # Termo de busca (opcional)
    
    created_at = Column(DateTime, default=now_brasil)
    updated_at = Column(DateTime, default=now_brasil, onupdate=now_brasil)
    
    # Relacionamento
    clicks = relationship("Click", back_populates="link", cascade="all, delete-orphan")
    
    def to_dict(self, include_clicks_count=False, db=None):
        from timezone_utils import converter_para_brasil, strftime_brasil
        
        # Converter para timezone do Brasil antes de serializar
        created_at_brasil = converter_para_brasil(self.created_at) if self.created_at else None
        updated_at_brasil = converter_para_brasil(self.updated_at) if self.updated_at else None
        
        data = {
            "id": self.id,
            "identifier": self.identifier,
            "destination_url": self.destination_url,
            "ponto_dooh": self.ponto_dooh,
            "campanha": self.campanha,
            # Novos campos
            "qr_code_id": self.qr_code_id,
            "peca_criativa": self.peca_criativa,
            "local_especifico": self.local_especifico,
            "tipo_midia": self.tipo_midia,
            "utm_source": self.utm_source,
            "utm_medium": self.utm_medium,
            "utm_campaign": self.utm_campaign,
            "utm_content": self.utm_content,
            "utm_term": self.utm_term,
            # Enviar apenas a data (sem hora) para evitar problemas de timezone no frontend
            "created_at": strftime_brasil(created_at_brasil, "%Y-%m-%d") if created_at_brasil else None,
            "updated_at": strftime_brasil(updated_at_brasil, "%Y-%m-%d") if updated_at_brasil else None,
        }
        
        if include_clicks_count and db:
            from sqlalchemy import func
            total_clicks = db.query(func.count(Click.id)).filter(Click.link_id == self.id).scalar()
            data["total_clicks"] = total_clicks or 0
        elif include_clicks_count:
            data["total_clicks"] = len(self.clicks) if hasattr(self, 'clicks') else 0
        
        return data


class Click(Base):
    __tablename__ = "clicks"
    
    id = Column(Integer, primary_key=True, index=True)
    link_id = Column(Integer, ForeignKey("links.id", ondelete="CASCADE"), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    referrer = Column(Text, nullable=True)
    device_type = Column(String(50), nullable=True)
    browser = Column(String(100), nullable=True)
    operating_system = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    
    # Novos campos - Dados Técnicos Expandidos
    state = Column(String(100), nullable=True)  # Estado/Região
    language = Column(String(50), nullable=True)  # Idioma do dispositivo (Accept-Language)
    isp = Column(String(200), nullable=True)  # Provedor de internet
    timezone = Column(String(50), nullable=True)  # Timezone do usuário
    
    clicked_at = Column(DateTime, default=now_brasil, index=True)
    
    # Relacionamento
    link = relationship("Link", back_populates="clicks")
    
    def to_dict(self):
        return {
            "id": self.id,
            "link_id": self.link_id,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "referrer": self.referrer,
            "device_type": self.device_type,
            "browser": self.browser,
            "operating_system": self.operating_system,
            "country": self.country,
            "city": self.city,
            "state": self.state,
            "language": self.language,
            "isp": self.isp,
            "timezone": self.timezone,
            "clicked_at": self.clicked_at.isoformat() if self.clicked_at else None,
        }


class ConversionEvent(Base):
    __tablename__ = "conversion_events"
    
    id = Column(Integer, primary_key=True, index=True)
    click_id = Column(Integer, ForeignKey("clicks.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True)  # "pageview", "scroll", "cta_click", "whatsapp", "form", "download", "call", "purchase"
    event_value = Column(Text, nullable=True)  # Dados adicionais (JSON string)
    occurred_at = Column(DateTime, default=now_brasil, index=True)
    
    # Relacionamento
    click = relationship("Click", backref="conversion_events")
    
    def to_dict(self):
        return {
            "id": self.id,
            "click_id": self.click_id,
            "event_type": self.event_type,
            "event_value": self.event_value,
            "occurred_at": self.occurred_at.isoformat() if self.occurred_at else None,
        }

