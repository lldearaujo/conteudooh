from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Noticia
from scraper import RadiocentroScraper
import atexit

scheduler = BackgroundScheduler()

def atualizar_noticias_automaticamente():
    """Função que será executada periodicamente para atualizar notícias"""
    db = SessionLocal()
    try:
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
        print(f"[Scheduler] {adicionadas} novas notícias adicionadas automaticamente")
    except Exception as e:
        print(f"[Scheduler] Erro ao atualizar notícias: {e}")
        db.rollback()
    finally:
        db.close()

def iniciar_scheduler():
    """Inicia o scheduler para atualização automática"""
    if not scheduler.running:
        # Executar a cada 30 minutos
        scheduler.add_job(
            atualizar_noticias_automaticamente,
            trigger=IntervalTrigger(minutes=30),
            id='atualizar_noticias',
            name='Atualizar notícias do radiocentrocz.com.br',
            replace_existing=True
        )
        scheduler.start()
        print("[Scheduler] Scheduler iniciado - atualização automática a cada 30 minutos")
        
        # Executar uma vez imediatamente
        atualizar_noticias_automaticamente()
        
        # Registrar shutdown
        atexit.register(lambda: scheduler.shutdown())

