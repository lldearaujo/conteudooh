"""
Serviço para consumir API de clima externa
Fonte principal e única: Tomorrow.io (v4 Weather Forecast API)
Documentação: https://docs.tomorrow.io/reference/weather-forecast
"""
import os
import requests
from typing import Dict, Optional, Tuple
from datetime import datetime, timedelta
import logging
import hashlib

logger = logging.getLogger(__name__)

# URL base da API Tomorrow.io (requer API key)
API_BASE_URL = "https://api.tomorrow.io/v4/weather/forecast"

# Chave padrão integrada ao sistema (pode ser sobrescrita por variável de ambiente TOMORROW_API_KEY)
DEFAULT_TOMORROW_API_KEY = "2w5HZQWL2HsVJOqVN1NYpwAf93mI8Ei9"
TOMORROW_API_KEY = os.getenv("TOMORROW_API_KEY", DEFAULT_TOMORROW_API_KEY)

# URL base da API de Geocoding (Nominatim / OpenStreetMap)
GEO_API_URL = "https://nominatim.openstreetmap.org/search"

# Coordenadas padrão (Cajazeiras, PB - pode ser configurável)
DEFAULT_LATITUDE = -6.8889
DEFAULT_LONGITUDE = -38.5558

# Cache em memória
_cache_coordenadas = {}  # Cache de geocoding (TTL: 24h)
_cache_clima = {}  # Cache de dados meteorológicos (TTL: 10min)

# TTLs (Time To Live)
TTL_COORDENADAS = timedelta(hours=24)  # Coordenadas raramente mudam
TTL_CLIMA = timedelta(minutes=10)  # Clima atualiza a cada 10 minutos


class WeatherService:
    """Serviço para obter dados meteorológicos da API Tomorrow.io"""
    
    def __init__(self, latitude: float = DEFAULT_LATITUDE, longitude: float = DEFAULT_LONGITUDE):
        """
        Inicializa o serviço de clima
        
        Args:
            latitude: Latitude da localização (padrão: Campina Grande, PB)
            longitude: Longitude da localização (padrão: Campina Grande, PB)
        """
        self.latitude = latitude
        self.longitude = longitude
        self.timeout = 10  # Timeout de 10 segundos
    
    def obter_clima_atual(self, nome_cidade: str = "Cajazeiras - PB") -> Optional[Dict]:
        """
        Obtém as condições meteorológicas atuais e previsão para os próximos dias
        Usa cache para acelerar respostas repetidas.
        
        Args:
            nome_cidade: Nome da cidade para cache key
        
        Returns:
            Dict com dados meteorológicos ou None em caso de erro
        """
        # Criar chave de cache baseada em lat/lon (arredondado para evitar duplicatas)
        cache_key = f"{round(self.latitude, 4)}_{round(self.longitude, 4)}"

        # Verificar cache (com fallback mesmo se estiver "vencido")
        cached_entry = _cache_clima.get(cache_key)
        if cached_entry:
            cached_data, cached_time = cached_entry
            idade_cache = datetime.now() - cached_time

            if idade_cache < TTL_CLIMA:
                # Cache fresco: usar diretamente
                logger.info(f"Retornando dados de clima do cache para {nome_cidade}")
                if "localizacao" in cached_data:
                    cached_data["localizacao"]["nome"] = nome_cidade
                return cached_data
            else:
                # Cache expirado, mas mantido como fallback em caso de erro na API
                logger.info(
                    f"Cache de clima expirado para {nome_cidade} (idade: {idade_cache}). "
                    "Tentando atualizar dados na API, mantendo cache como fallback."
                )
        
        # Verificar API key
        if not TOMORROW_API_KEY:
            logger.error("TOMORROW_API_KEY não configurada. Defina a variável de ambiente com sua chave da Tomorrow.io.")
            return None

        try:
            # Parâmetros mínimos da API Tomorrow.io
            # Referência: https://docs.tomorrow.io/reference/weather-forecast
            # Usamos apenas parâmetros que sabemos ser suportados para evitar erros 400.
            params = {
                "location": f"{self.latitude},{self.longitude}",
                "apikey": TOMORROW_API_KEY,
                # Garante unidades métricas (°C, km/h, mm)
                "units": "metric",
            }

            response = requests.get(API_BASE_URL, params=params, timeout=self.timeout)
            response.raise_for_status()

            data = response.json()

            # Processar e estruturar os dados vindos da Tomorrow.io
            resultado = self._processar_dados(data, nome_cidade)
            
            # Salvar/atualizar no cache com timestamp atual
            _cache_clima[cache_key] = (resultado, datetime.now())
            logger.info(f"Dados de clima salvos no cache para {nome_cidade}")
            
            return resultado
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao buscar dados meteorológicos na API: {e}")

            # Se tivermos cache (mesmo expirado), usar como fallback para não "apagar" o clima da tela
            cached_entry = _cache_clima.get(cache_key)
            if cached_entry:
                cached_data, cached_time = cached_entry
                logger.warning(
                    "Retornando dados meteorológicos a partir de cache expirado devido a erro na API."
                )
                # Marcar que os dados podem estar desatualizados
                try:
                    if "atual" in cached_data:
                        cached_data["atual"]["dados_desatualizados"] = True
                        cached_data["atual"]["origem_cache"] = True
                except Exception:
                    # Não bloquear retorno por falha ao marcar flags
                    pass
                if "localizacao" in cached_data:
                    cached_data["localizacao"]["nome"] = nome_cidade
                return cached_data

            return None
        except Exception as e:
            logger.error(f"Erro inesperado ao processar dados meteorológicos: {e}")
            # Mesmo tratamento de fallback em erro genérico
            cached_entry = _cache_clima.get(cache_key)
            if cached_entry:
                cached_data, cached_time = cached_entry
                logger.warning(
                    "Retornando dados meteorológicos a partir de cache expirado devido a erro inesperado."
                )
                try:
                    if "atual" in cached_data:
                        cached_data["atual"]["dados_desatualizados"] = True
                        cached_data["atual"]["origem_cache"] = True
                except Exception:
                    pass
                if "localizacao" in cached_data:
                    cached_data["localizacao"]["nome"] = nome_cidade
                return cached_data

            return None
    
    def _processar_dados(self, data: Dict, nome_cidade: str = "Cajazeiras - PB") -> Dict:
        """
        Processa os dados brutos da API Tomorrow.io em um formato mais útil
        
        Args:
            data: Dados brutos da API
            
        Returns:
            Dict processado com informações meteorológicas
        """
        timelines = data.get("timelines", {}) or {}

        # Cada timeline é uma lista de pontos { time, values }
        current_timeline = timelines.get("current") or []
        hourly_timeline = (
            timelines.get("hourly")
            or timelines.get("1h")
            or []
        )
        daily_timeline = (
            timelines.get("daily")
            or timelines.get("1d")
            or []
        )

        # Dados atuais
        current_values = {}
        if current_timeline:
            # Pega o primeiro registro de "current"
            current_values = current_timeline[0].get("values", {}) or {}
        elif hourly_timeline:
            # Fallback: usa o primeiro ponto horário como "atual"
            current_values = hourly_timeline[0].get("values", {}) or {}

        codigo_atual = current_values.get("weatherCode")

        clima_atual = {
            "temperatura": current_values.get("temperature"),
            "umidade": current_values.get("humidity"),
            "codigo_clima": codigo_atual,
            "velocidade_vento": current_values.get("windSpeed"),
            "direcao_vento": current_values.get("windDirection"),
            "descricao_clima": self._traduzir_codigo_clima(codigo_atual),
            "icone_clima": self._obter_icone_clima(codigo_atual),
            "data_atualizacao": datetime.now().strftime("%d/%m/%Y %H:%M")
        }

        # Previsão horária (próximas 24 horas)
        previsao_horaria = []
        for ponto in hourly_timeline[:24]:
            hora_iso = ponto.get("time")
            valores = ponto.get("values", {}) or {}
            codigo = valores.get("weatherCode")
            previsao_horaria.append({
                "hora": self._formatar_hora(hora_iso) if hora_iso else "",
                "temperatura": valores.get("temperature"),
                "codigo_clima": codigo,
                "precipitacao_prob": valores.get("precipitationProbability"),
                "icone": self._obter_icone_clima(codigo)
            })

        # Previsão diária (próximos dias)
        previsao_diaria = []
        for ponto in daily_timeline:
            dia_iso = ponto.get("time")
            valores = ponto.get("values", {}) or {}
            codigo = (
                valores.get("weatherCode")
                or valores.get("weatherCodeMax")
            )

            temp_max = (
                valores.get("temperatureMax")
                if valores.get("temperatureMax") is not None
                else valores.get("temperature")
            )
            temp_min = (
                valores.get("temperatureMin")
                if valores.get("temperatureMin") is not None
                else valores.get("temperature")
            )

            previsao_diaria.append({
                "dia": self._formatar_dia(dia_iso) if dia_iso else "",
                "dia_semana": self._obter_dia_semana(dia_iso) if dia_iso else "",
                "temp_max": temp_max,
                "temp_min": temp_min,
                "codigo_clima": codigo,
                "precipitacao": valores.get("precipitationAccumulation"),
                "vento_max": valores.get("windSpeedMax") or valores.get("windSpeed"),
                "descricao": self._traduzir_codigo_clima(codigo),
                "icone": self._obter_icone_clima(codigo)
            })

        return {
            "atual": clima_atual,
            "previsao_horaria": previsao_horaria,
            "previsao_diaria": previsao_diaria,
            "localizacao": {
                "nome": nome_cidade,
                "latitude": self.latitude,
                "longitude": self.longitude
            }
        }

    @staticmethod
    def buscar_coordenadas(cidade: str, estado: Optional[str] = None, pais: str = "Brasil") -> Optional[Dict]:
        """
        Busca latitude e longitude pelo nome da cidade usando a API de Geocoding.
        Usa cache para evitar requisições repetidas (TTL: 24h).
        
        Args:
            cidade: Nome da cidade (ex: "Campina Grande", "São Paulo")
            estado: UF ou nome do estado (ex: "PB", "Paraíba")
            pais: Nome do país (padrão: Brasil)
            
        Returns:
            Dict com latitude, longitude e nome formatado, ou None em caso de erro
        """
        try:
            if not cidade:
                return None

            # Criar chave de cache
            cache_key = f"{cidade.lower()}_{estado.lower() if estado else ''}_{pais.lower()}"
            cache_key = hashlib.md5(cache_key.encode()).hexdigest()
            
            # Verificar cache
            if cache_key in _cache_coordenadas:
                cached_data, cached_time = _cache_coordenadas[cache_key]
                if datetime.now() - cached_time < TTL_COORDENADAS:
                    logger.info(f"Retornando coordenadas do cache para {cidade}, {estado}")
                    return cached_data
                else:
                    # Cache expirado, remover
                    del _cache_coordenadas[cache_key]

            # Monta parâmetros para Nominatim
            params = {
                "city": cidade,
                "format": "json",
                "limit": 1,
            }

            # Adiciona filtros de estado e país quando informados
            if estado:
                params["state"] = estado
            if pais:
                params["country"] = pais

            headers = {
                "User-Agent": "ConteudoOH/1.0 (clima@conteudooh.local)"
            }

            response = requests.get(GEO_API_URL, params=params, headers=headers, timeout=10)
            response.raise_for_status()

            results = response.json()
            if not results:
                logger.warning(f"Nenhum resultado de geocoding para cidade: {cidade}, estado: {estado}")
                return None

            resultado = results[0]

            # Nominatim retorna lat/lon como string
            lat = float(resultado["lat"])
            lon = float(resultado["lon"])

            nome_cidade = resultado.get("display_name", cidade)

            # Monta nome curto "Cidade - UF" quando possível
            nome_formatado = cidade
            if estado:
                nome_formatado = f"{cidade} - {estado}"

            resultado_final = {
                "latitude": lat,
                "longitude": lon,
                "nome_formatado": nome_formatado,
                "nome_completo": nome_cidade,
            }
            
            # Salvar no cache
            _cache_coordenadas[cache_key] = (resultado_final, datetime.now())
            logger.info(f"Coordenadas salvas no cache para {cidade}, {estado}")
            
            return resultado_final
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro na requisição de geocoding: {e}")
            return None
        except Exception as e:
            logger.error(f"Erro inesperado ao processar geocoding: {e}")
            return None
    
    def _traduzir_codigo_clima(self, codigo: Optional[int]) -> str:
        """
        Traduz o código de clima da Tomorrow.io para descrição em português.
        
        Referência (Tomorrow.io weatherCode):
        1000: Clear, 1100: Mostly Clear, 1101: Partly Cloudy, 1102: Mostly Cloudy, 1001: Cloudy,
        2000: Fog, 2100: Light Fog,
        4000: Drizzle, 4001: Rain, 4200: Light Rain, 4201: Heavy Rain,
        5000: Snow, 5001: Flurries, 5100: Light Snow, 5101: Heavy Snow,
        6000: Freezing Drizzle, 6001: Freezing Rain, 6200: Light Freezing Rain, 6201: Heavy Freezing Rain,
        7000: Ice Pellets, 7101: Heavy Ice Pellets, 7102: Light Ice Pellets,
        8000: Thunderstorm
        """
        if codigo is None:
            return "Dados indisponíveis"

        # Estratégia "suavizada" para DOOH:
        # - 1000: céu limpo
        # - 1100, 1101, 1102, 1001: tratamos como "Parcialmente nublado"
        #   para ficar mais próximo da percepção visual/Google Clima.
        codigos_tomorrow = {
            1000: "Céu limpo",
            1100: "Parcialmente nublado",
            1101: "Parcialmente nublado",
            1102: "Parcialmente nublado",
            1001: "Parcialmente nublado",

            2000: "Nevoeiro",
            2100: "Nevoeiro leve",

            4000: "Garoa",
            4001: "Chuva",
            4200: "Chuva leve",
            4201: "Chuva forte",

            5000: "Neve",
            5001: "Flocos de neve esparsos",
            5100: "Neve leve",
            5101: "Neve forte",

            6000: "Garoa congelante",
            6001: "Chuva congelante",
            6200: "Chuva congelante leve",
            6201: "Chuva congelante forte",

            7000: "Granizo/neve granular",
            7101: "Granizo intenso",
            7102: "Granizo leve",

            8000: "Tempestade com trovoadas",
        }

        return codigos_tomorrow.get(int(codigo), "Condições desconhecidas")
    
    def _obter_icone_clima(self, codigo: Optional[int]) -> str:
        """
        Retorna um emoji correspondente ao código de clima da Tomorrow.io.
        """
        if codigo is None:
            return "❓"

        try:
            codigo_int = int(codigo)
        except (TypeError, ValueError):
            return "❓"

        # Simplificação: agrupa condições em categorias visuais
        if codigo_int == 1000:
            return "☀️"  # Céu limpo
        elif codigo_int in (1100, 1101):
            return "🌤️"  # Parcialmente nublado
        elif codigo_int in (1102, 1001):
            return "☁️"  # Nublado/encoberto
        elif codigo_int in (2000, 2100):
            return "🌫️"  # Nevoeiro
        elif codigo_int in (4000, 4001, 4200):
            return "🌦️"  # Garoa / chuva leve
        elif codigo_int in (4201, 6001, 6201):
            return "🌧️"  # Chuva forte
        elif codigo_int in (5000, 5001, 5100, 5101):
            return "❄️"  # Neve
        elif codigo_int in (6000, 6200):
            return "🌨️"  # Precipitação congelante leve
        elif codigo_int in (7000, 7101, 7102):
            return "🌨️"  # Granizo / gelo
        elif codigo_int == 8000:
            return "⛈️"  # Tempestade
        else:
            return "🌤️"
    
    def _formatar_hora(self, hora_str: str) -> str:
        """Formata hora ISO para formato brasileiro"""
        try:
            dt = datetime.fromisoformat(hora_str.replace('Z', '+00:00'))
            return dt.strftime("%H:%M")
        except:
            return hora_str
    
    def _formatar_dia(self, dia_str: str) -> str:
        """Formata data ISO para formato brasileiro"""
        try:
            dt = datetime.fromisoformat(dia_str)
            return dt.strftime("%d/%m")
        except:
            return dia_str
    
    def _obter_dia_semana(self, dia_str: str) -> str:
        """Retorna o dia da semana em português"""
        try:
            dt = datetime.fromisoformat(dia_str)
            dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
            return dias[dt.weekday()]
        except:
            return ""


def criar_servico_clima(latitude: float = None, longitude: float = None) -> WeatherService:
    """
    Factory function para criar instância do serviço de clima
    
    Args:
        latitude: Latitude (opcional, usa padrão se não informado)
        longitude: Longitude (opcional, usa padrão se não informado)
        
    Returns:
        Instância de WeatherService
    """
    if latitude is None:
        latitude = DEFAULT_LATITUDE
    if longitude is None:
        longitude = DEFAULT_LONGITUDE
    
    return WeatherService(latitude=latitude, longitude=longitude)
