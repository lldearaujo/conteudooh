from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Noticia(Base):
    __tablename__ = "noticias"
    
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)
    conteudo = Column(Text)
    url = Column(String, unique=True, nullable=False)
    imagem_url = Column(String, nullable=True)
    data_publicacao = Column(DateTime, nullable=True)
    data_criacao = Column(DateTime, server_default=func.now())
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
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relacionamento
    clicks = relationship("Click", back_populates="link", cascade="all, delete-orphan")
    
    def to_dict(self, include_clicks_count=False, db=None):
        data = {
            "id": self.id,
            "identifier": self.identifier,
            "destination_url": self.destination_url,
            "ponto_dooh": self.ponto_dooh,
            "campanha": self.campanha,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
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
    clicked_at = Column(DateTime, server_default=func.now(), index=True)
    
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
            "clicked_at": self.clicked_at.isoformat() if self.clicked_at else None,
        }

