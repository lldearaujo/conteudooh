from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
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

