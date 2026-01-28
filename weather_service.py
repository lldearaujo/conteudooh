"""
Serviço para consumir a API Open-Meteo
Documentação: https://open-meteo.com/en/docs
"""
import requests
from typing import Dict, Optional, Tuple
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# URL base da API Open-Meteo (gratuita, sem necessidade de API key)
API_BASE_URL = "https://api.open-meteo.com/v1/forecast"

# URL base da API de Geocoding (Nominatim / OpenStreetMap)
GEO_API_URL = "https://nominatim.openstreetmap.org/search"

# Coordenadas padrão (Cajazeiras, PB - pode ser configurável)
DEFAULT_LATITUDE = -6.8889
DEFAULT_LONGITUDE = -38.5558


class WeatherService:
    """Serviço para obter dados meteorológicos da API Open-Meteo"""
    
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
    
    def obter_clima_atual(self) -> Optional[Dict]:
        """
        Obtém as condições meteorológicas atuais e previsão para os próximos dias
        
        Returns:
            Dict com dados meteorológicos ou None em caso de erro
        """
        try:
            # Parâmetros da API Open-Meteo
            params = {
                "latitude": self.latitude,
                "longitude": self.longitude,
                "current": "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m",
                "hourly": "temperature_2m,weather_code,precipitation_probability",
                "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
                "timezone": "America/Sao_Paulo",
                "forecast_days": 7,  # Previsão para 7 dias
                "temperature_unit": "celsius",
                "wind_speed_unit": "kmh",
                "precipitation_unit": "mm"
            }
            
            response = requests.get(API_BASE_URL, params=params, timeout=self.timeout)
            response.raise_for_status()
            
            data = response.json()
            
            # Processar e estruturar os dados
            return self._processar_dados(data)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao buscar dados meteorológicos: {e}")
            return None
        except Exception as e:
            logger.error(f"Erro inesperado ao processar dados meteorológicos: {e}")
            return None
    
    def _processar_dados(self, data: Dict, nome_cidade: str = "Cajazeiras - PB") -> Dict:
        """
        Processa os dados brutos da API em um formato mais útil
        
        Args:
            data: Dados brutos da API
            
        Returns:
            Dict processado com informações meteorológicas
        """
        current = data.get("current", {})
        hourly = data.get("hourly", {})
        daily = data.get("daily", {})
        
        # Dados atuais
        clima_atual = {
            "temperatura": current.get("temperature_2m"),
            "umidade": current.get("relative_humidity_2m"),
            "codigo_clima": current.get("weather_code"),
            "velocidade_vento": current.get("wind_speed_10m"),
            "direcao_vento": current.get("wind_direction_10m"),
            "descricao_clima": self._traduzir_codigo_clima(current.get("weather_code")),
            "icone_clima": self._obter_icone_clima(current.get("weather_code")),
            "data_atualizacao": datetime.now().strftime("%d/%m/%Y %H:%M")
        }
        
        # Previsão horária (próximas 24 horas)
        previsao_horaria = []
        if hourly.get("time") and hourly.get("temperature_2m"):
            horas = hourly.get("time", [])[:24]  # Próximas 24 horas
            temperaturas = hourly.get("temperature_2m", [])[:24]
            codigos = hourly.get("weather_code", [])[:24]
            precipitacao = hourly.get("precipitation_probability", [])[:24]
            
            for i, hora in enumerate(horas):
                if i < len(temperaturas):
                    previsao_horaria.append({
                        "hora": self._formatar_hora(hora),
                        "temperatura": temperaturas[i],
                        "codigo_clima": codigos[i] if i < len(codigos) else None,
                        "precipitacao_prob": precipitacao[i] if i < len(precipitacao) else None,
                        "icone": self._obter_icone_clima(codigos[i] if i < len(codigos) else None)
                    })
        
        # Previsão diária (próximos 7 dias)
        previsao_diaria = []
        if daily.get("time") and daily.get("temperature_2m_max"):
            dias = daily.get("time", [])
            temp_max = daily.get("temperature_2m_max", [])
            temp_min = daily.get("temperature_2m_min", [])
            codigos = daily.get("weather_code", [])
            precipitacao = daily.get("precipitation_sum", [])
            vento = daily.get("wind_speed_10m_max", [])
            
            for i, dia in enumerate(dias):
                if i < len(temp_max):
                    previsao_diaria.append({
                        "dia": self._formatar_dia(dia),
                        "dia_semana": self._obter_dia_semana(dia),
                        "temp_max": temp_max[i],
                        "temp_min": temp_min[i],
                        "codigo_clima": codigos[i] if i < len(codigos) else None,
                        "precipitacao": precipitacao[i] if i < len(precipitacao) else None,
                        "vento_max": vento[i] if i < len(vento) else None,
                        "descricao": self._traduzir_codigo_clima(codigos[i] if i < len(codigos) else None),
                        "icone": self._obter_icone_clima(codigos[i] if i < len(codigos) else None)
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
        Busca latitude e longitude pelo nome da cidade usando a API de Geocoding do Open-Meteo
        
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

            return {
                "latitude": lat,
                "longitude": lon,
                "nome_formatado": nome_formatado,
                "nome_completo": nome_cidade,
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro na requisição de geocoding: {e}")
            return None
        except Exception as e:
            logger.error(f"Erro inesperado ao processar geocoding: {e}")
            return None
    
    def _traduzir_codigo_clima(self, codigo: Optional[int]) -> str:
        """
        Traduz o código WMO Weather Interpretation Codes para descrição em português
        
        Args:
            codigo: Código do clima da API
            
        Returns:
            Descrição do clima em português
        """
        if codigo is None:
            return "Dados indisponíveis"
        
        # Códigos WMO Weather Interpretation Codes
        codigos = {
            0: "Céu limpo",
            1: "Principalmente limpo",
            2: "Parcialmente nublado",
            3: "Nublado",
            45: "Nevoeiro",
            48: "Nevoeiro com geada",
            51: "Garoa leve",
            53: "Garoa moderada",
            55: "Garoa densa",
            56: "Garoa congelante leve",
            57: "Garoa congelante densa",
            61: "Chuva leve",
            63: "Chuva moderada",
            65: "Chuva forte",
            66: "Chuva congelante leve",
            67: "Chuva congelante forte",
            71: "Queda de neve leve",
            73: "Queda de neve moderada",
            75: "Queda de neve forte",
            77: "Grãos de neve",
            80: "Pancadas de chuva leve",
            81: "Pancadas de chuva moderada",
            82: "Pancadas de chuva forte",
            85: "Pancadas de neve leve",
            86: "Pancadas de neve forte",
            95: "Trovoada",
            96: "Trovoada com granizo leve",
            99: "Trovoada com granizo forte"
        }
        
        return codigos.get(codigo, "Condições desconhecidas")
    
    def _obter_icone_clima(self, codigo: Optional[int]) -> str:
        """
        Retorna o emoji/ícone correspondente ao código do clima
        
        Args:
            codigo: Código do clima
            
        Returns:
            Emoji representando o clima
        """
        if codigo is None:
            return "❓"
        
        # Mapeamento simplificado de códigos para emojis
        if codigo == 0:
            return "☀️"  # Céu limpo
        elif codigo in [1, 2]:
            return "🌤️"  # Parcialmente nublado
        elif codigo == 3:
            return "☁️"  # Nublado
        elif codigo in [45, 48]:
            return "🌫️"  # Nevoeiro
        elif codigo in [51, 53, 55, 56, 57]:
            return "🌦️"  # Garoa
        elif codigo in [61, 63, 65, 66, 67]:
            return "🌧️"  # Chuva
        elif codigo in [71, 73, 75, 77]:
            return "❄️"  # Neve
        elif codigo in [80, 81, 82]:
            return "⛈️"  # Pancadas de chuva
        elif codigo in [85, 86]:
            return "🌨️"  # Pancadas de neve
        elif codigo in [95, 96, 99]:
            return "⛈️"  # Trovoada
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
