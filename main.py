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

@app.get("/api/noticias/{noticia_id}/qrcode")
async def gerar_qrcode_noticia(noticia_id: int, db: Session = Depends(get_db), tamanho: str = "normal"):
    """Gera um QR code do link da matéria - otimizado para telas de baixa resolução
    
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
        
        print(f"[QR Code] Gerando QR code para URL: {url}")
        
        # Configurações diferentes para telas pequenas vs normais
        if tamanho == "pequeno":
            # Para telas muito pequenas: reduzir correção de erro para simplificar o QR code
            # Isso reduz a quantidade de módulos necessários
            error_correction = qrcode.constants.ERROR_CORRECT_M  # Correção média (~15%) ao invés de H (~30%)
            box_size = 10  # Módulos um pouco menores mas ainda legíveis
            border = 3  # Borda menor para maximizar espaço
            print(f"[QR Code] Usando configuração para tela pequena: error_correction=M, box_size={box_size}, border={border}")
        else:
            # Para telas maiores: máxima correção de erro e módulos maiores
            error_correction = qrcode.constants.ERROR_CORRECT_H  # Máxima correção de erro (~30%)
            box_size = 12  # Módulos maiores para facilitar escaneamento à distância
            border = 4  # Borda maior para melhor detecção
            print(f"[QR Code] Usando configuração normal: error_correction=H, box_size={box_size}, border={border}")
        
        # Criar QR code - otimizado para telas de baixa resolução e escaneamento à distância
        qr = qrcode.QRCode(
            version=None,  # Deixa a biblioteca escolher a versão mínima necessária
            error_correction=error_correction,
            box_size=box_size,
            border=border,
        )
        qr.add_data(url)
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

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

