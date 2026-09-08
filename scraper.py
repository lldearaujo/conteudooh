import feedparser
import requests
import urllib3
from datetime import datetime
from typing import List, Dict
from bs4 import BeautifulSoup

# Suprimir avisos de SSL inválido (certificado expirado no servidor de origem)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class RadiocentroScraper:
    BASE_URL  = "https://radiocentrocz.com.br"
    FEED_URL  = "https://radiocentrocz.com.br/feed/gn"
    FEED_URLS = [
        "https://radiocentrocz.com.br/feed/gn",
        "https://radiocentrocz.com.br/feed/",
        "https://radiocentrocz.com.br/feed/rss2/",
        "https://radiocentrocz.com.br/?feed=rss2",
    ]

    def __init__(self):
        self._session = requests.Session()
        self._session.verify = False          # site com cert expirado/inválido
        self._session.headers.update({
            "User-Agent": "Mozilla/5.0 (compatible; ConteudoOH/2.0)"
        })

    # ------------------------------------------------------------------
    # RSS FEED
    # ------------------------------------------------------------------
    def _buscar_conteudo(self, url: str) -> bytes:
        """GET tolerante a SSL inválido."""
        try:
            r = self._session.get(url, timeout=15)
            r.raise_for_status()
            return r.content
        except Exception as e:
            print(f"[Scraper] Falha em {url}: {e}")
            return b""

    def _obter_via_rss(self, limite: int) -> List[Dict]:
        """Tenta todas as URLs de feed RSS conhecidas."""
        for feed_url in self.FEED_URLS:
            conteudo = self._buscar_conteudo(feed_url)
            if not conteudo:
                continue
            feed = feedparser.parse(conteudo)
            if not feed.entries:
                continue
            print(f"[Scraper] Feed RSS OK: {feed_url} ({len(feed.entries)} entradas)")
            return self._processar_entries(feed.entries[:limite])
        print("[Scraper] Todos os feeds RSS falharam — usando fallback HTML")
        return []

    def _processar_entries(self, entries) -> List[Dict]:
        noticias = []
        for entry in entries:
            try:
                titulo = entry.get('title', '').strip()
                url    = entry.get('link', '')
                data_publicacao = None
                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    try:
                        data_publicacao = datetime(*entry.published_parsed[:6])
                    except Exception:
                        pass

                descricao = entry.get('description', '')
                conteudo  = descricao
                if hasattr(entry, 'content') and entry.content:
                    conteudo = entry.content[0].get('value', descricao)
                elif hasattr(entry, 'summary'):
                    conteudo = entry.summary

                soup_c = BeautifulSoup(conteudo, 'html.parser')
                conteudo_texto = soup_c.get_text(separator=' ', strip=True)[:500]

                imagem_url = None
                soup_img = BeautifulSoup(conteudo, 'html.parser')
                img_tag = soup_img.find('img')
                if img_tag:
                    imagem_url = img_tag.get('src', '')
                    if imagem_url and not imagem_url.startswith('http'):
                        imagem_url = ('https:' if imagem_url.startswith('//') else self.BASE_URL) + imagem_url

                if not imagem_url and hasattr(entry, 'links'):
                    for lnk in entry.links:
                        if lnk.get('type', '').startswith('image'):
                            imagem_url = lnk.get('href', '')
                            break

                if titulo and url:
                    noticias.append({
                        'titulo': titulo, 'url': url,
                        'conteudo': conteudo_texto,
                        'imagem_url': imagem_url,
                        'data_publicacao': data_publicacao,
                    })
            except Exception as e:
                print(f"[Scraper] Erro ao processar entry: {e}")
        return noticias

    # ------------------------------------------------------------------
    # FALLBACK: scraping HTML direto
    # ------------------------------------------------------------------
    def _obter_via_html(self, limite: int) -> List[Dict]:
        """Scraping direto do HTML quando o feed RSS falha."""
        conteudo = self._buscar_conteudo(self.BASE_URL + "/")
        if not conteudo:
            return []

        soup   = BeautifulSoup(conteudo, 'html.parser')
        noticias = []

        # WordPress + Elementor: artigos ficam em <article class="elementor-post ...">
        articles = soup.find_all('article', limit=limite * 2)
        for art in articles:
            if len(noticias) >= limite:
                break
            try:
                # Título + URL
                h = art.find(['h1','h2','h3','h4'])
                if not h:
                    continue
                a_tag = h.find('a', href=True)
                if not a_tag:
                    continue
                titulo = h.get_text(strip=True)
                url    = a_tag['href']
                if not url.startswith('http'):
                    url = self.BASE_URL + url

                # Data (elemento <time datetime="...">)
                data_publicacao = None
                time_tag = art.find('time')
                if time_tag and time_tag.get('datetime'):
                    try:
                        dt_str = time_tag['datetime'].replace('Z','+00:00')
                        data_publicacao = datetime.fromisoformat(dt_str)
                    except Exception:
                        pass

                # Imagem (lazy-load e atributos alternativos)
                imagem_url = None
                img = art.find('img')
                if img:
                    imagem_url = (img.get('src') or img.get('data-src')
                                  or img.get('data-lazy-src') or '')
                    if imagem_url and not imagem_url.startswith('http'):
                        imagem_url = self.BASE_URL + imagem_url

                # Resumo (qualquer parágrafo dentro do artigo)
                p = art.find('p')
                conteudo_texto = p.get_text(strip=True)[:300] if p else ''

                if titulo and url:
                    noticias.append({
                        'titulo': titulo, 'url': url,
                        'conteudo': conteudo_texto,
                        'imagem_url': imagem_url,
                        'data_publicacao': data_publicacao,
                    })
            except Exception as e:
                print(f"[Scraper] Erro no artigo HTML: {e}")

        print(f"[Scraper] Fallback HTML: {len(noticias)} notícias encontradas")
        return noticias

    # ------------------------------------------------------------------
    # INTERFACE PÚBLICA
    # ------------------------------------------------------------------
    def obter_noticias(self, limite: int = 20) -> List[Dict]:
        """Obtém notícias: tenta RSS primeiro, usa scraping HTML como fallback."""
        noticias = self._obter_via_rss(limite)
        if not noticias:
            noticias = self._obter_via_html(limite)
        return noticias[:limite]

    # Mantido por compatibilidade com chamadas existentes
    def _rss_fallback(self, limite: int = 20) -> List[Dict]:
        """Alias interno — use obter_noticias()."""
        return self.obter_noticias(limite)

    def obter_detalhes_noticia(self, url: str) -> Dict:
        """Obtém detalhes completos de uma notícia específica."""
        try:
            conteudo_raw = self._buscar_conteudo(url)
            soup = BeautifulSoup(conteudo_raw, 'html.parser')
            conteudo_elem = soup.find(
                ['article', 'div'],
                class_=lambda x: x and any(
                    k in str(x).lower() for k in ('content', 'post-content', 'article')
                )
            ) or soup.find('main')
            paragrafos = conteudo_elem.find_all('p') if conteudo_elem else []
            conteudo_completo = '\n\n'.join(
                p.get_text(strip=True) for p in paragrafos if p.get_text(strip=True)
            )
            return {'conteudo': conteudo_completo}
        except Exception as e:
            print(f"[Scraper] Erro ao obter detalhes: {e}")
            return {'conteudo': ''}
