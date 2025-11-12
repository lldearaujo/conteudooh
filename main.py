from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
import os

from database import engine, get_db, Base
from models import Noticia
from scraper import RadiocentroScraper
from scheduler import iniciar_scheduler

# Criar tabelas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ConteudoOH - Sistema de Mídia Indoor/DOOH")

# Configurar templates
templates = Environment(loader=FileSystemLoader("templates"))

# Montar arquivos estáticos
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# Montar pasta de mídias
if os.path.exists("medias"):
    app.mount("/medias", StaticFiles(directory="medias"), name="medias")

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
    """Retorna uma notícia aleatória ativa"""
    import random
    noticias = db.query(Noticia).filter(Noticia.ativa == True).all()
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
    """Lista todas as notícias"""
    query = db.query(Noticia)
    if ativa is not None:
        query = query.filter(Noticia.ativa == ativa)
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

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

