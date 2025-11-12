import feedparser
from datetime import datetime
from typing import List, Dict
from bs4 import BeautifulSoup

class RadiocentroScraper:
    FEED_URL = "https://radiocentrocz.com.br/feed/gn"
    
    def __init__(self):
        pass
    
    def obter_noticias(self, limite: int = 20) -> List[Dict]:
        """Obtém as últimas notícias do feed RSS do radiocentrocz.com.br"""
        try:
            # Parsear o feed RSS
            feed = feedparser.parse(self.FEED_URL)
            
            if feed.bozo and not feed.entries:
                print(f"Erro ao parsear feed RSS: {feed.bozo_exception}")
                return []
            
            # Avisar sobre problemas de parsing, mas continuar se houver entradas
            if feed.bozo:
                print(f"Aviso ao parsear feed RSS: {feed.bozo_exception}")
            
            noticias = []
            
            for entry in feed.entries[:limite]:
                try:
                    # Extrair título
                    titulo = entry.get('title', '').strip()
                    
                    # Extrair URL
                    url = entry.get('link', '')
                    
                    # Extrair data de publicação
                    data_publicacao = None
                    if hasattr(entry, 'published_parsed') and entry.published_parsed:
                        try:
                            data_publicacao = datetime(*entry.published_parsed[:6])
                        except:
                            pass
                    
                    # Extrair descrição/resumo
                    descricao = entry.get('description', '')
                    
                    # Extrair conteúdo completo (se disponível)
                    conteudo = descricao
                    if hasattr(entry, 'content') and entry.content:
                        # Pegar o primeiro conteúdo disponível
                        conteudo = entry.content[0].get('value', descricao)
                    elif hasattr(entry, 'summary'):
                        conteudo = entry.summary
                    
                    # Limpar HTML do conteúdo usando BeautifulSoup
                    soup_conteudo = BeautifulSoup(conteudo, 'html.parser')
                    conteudo_texto = soup_conteudo.get_text(separator=' ', strip=True)
                    
                    # Limitar tamanho do conteúdo
                    conteudo_texto = conteudo_texto[:500] if len(conteudo_texto) > 500 else conteudo_texto
                    
                    # Extrair imagem do conteúdo HTML
                    imagem_url = None
                    if conteudo:
                        soup_img = BeautifulSoup(conteudo, 'html.parser')
                        img_tag = soup_img.find('img')
                        if img_tag:
                            imagem_url = img_tag.get('src', '')
                            # Garantir URL completa
                            if imagem_url and not imagem_url.startswith('http'):
                                if imagem_url.startswith('//'):
                                    imagem_url = 'https:' + imagem_url
                                elif imagem_url.startswith('/'):
                                    imagem_url = 'https://radiocentrocz.com.br' + imagem_url
                    
                    # Se não encontrou imagem no conteúdo, tentar nos links
                    if not imagem_url:
                        if hasattr(entry, 'links'):
                            for link in entry.links:
                                if link.get('type', '').startswith('image'):
                                    imagem_url = link.get('href', '')
                                    break
                    
                    if titulo and url:
                        noticias.append({
                            'titulo': titulo,
                            'url': url,
                            'conteudo': conteudo_texto,
                            'imagem_url': imagem_url,
                            'data_publicacao': data_publicacao
                        })
                except Exception as e:
                    print(f"Erro ao processar entrada do feed: {e}")
                    continue
            
            return noticias
            
        except Exception as e:
            print(f"Erro ao fazer parsing do feed RSS: {e}")
            return []
    
    def obter_detalhes_noticia(self, url: str) -> Dict:
        """Obtém detalhes completos de uma notícia específica"""
        try:
            import requests
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extrair conteúdo completo
            conteudo_elem = soup.find(['article', 'div'], class_=lambda x: x and ('content' in str(x).lower() or 'post-content' in str(x).lower() or 'article' in str(x).lower()))
            if not conteudo_elem:
                conteudo_elem = soup.find('main')
            
            paragrafos = conteudo_elem.find_all('p') if conteudo_elem else []
            conteudo_completo = '\n\n'.join([p.get_text(strip=True) for p in paragrafos if p.get_text(strip=True)])
            
            return {
                'conteudo': conteudo_completo
            }
        except Exception as e:
            print(f"Erro ao obter detalhes: {e}")
            return {'conteudo': ''}
