"""
Utilitários para gerenciar timezone do sistema
Configurado para UTC-03:00 (Recife/Salvador)
"""
from datetime import datetime, timezone, timedelta
from typing import Optional

# Timezone UTC-03:00 (Recife/Salvador)
BRASIL_TIMEZONE = timezone(timedelta(hours=-3))

def agora_brasil() -> datetime:
    """
    Retorna o datetime atual no timezone UTC-03:00 (Recife/Salvador)
    
    Returns:
        datetime: Data e hora atual no timezone do Brasil (UTC-03:00)
    """
    return datetime.now(BRASIL_TIMEZONE)

def datetime_brasil(ano: int, mes: int, dia: int, hora: int = 0, minuto: int = 0, segundo: int = 0) -> datetime:
    """
    Cria um datetime no timezone UTC-03:00
    
    Args:
        ano: Ano
        mes: Mês (1-12)
        dia: Dia (1-31)
        hora: Hora (0-23)
        minuto: Minuto (0-59)
        segundo: Segundo (0-59)
    
    Returns:
        datetime: Datetime no timezone do Brasil
    """
    return datetime(ano, mes, dia, hora, minuto, segundo, tzinfo=BRASIL_TIMEZONE)

def converter_para_brasil(dt: datetime) -> datetime:
    """
    Converte um datetime (com ou sem timezone) para UTC-03:00
    
    Args:
        dt: Datetime a ser convertido
    
    Returns:
        datetime: Datetime no timezone do Brasil
    """
    if dt.tzinfo is None:
        # Se não tem timezone, assume UTC
        dt = dt.replace(tzinfo=timezone.utc)
    
    return dt.astimezone(BRASIL_TIMEZONE)

def strftime_brasil(dt: Optional[datetime], formato: str = "%Y-%m-%d %H:%M:%S") -> str:
    """
    Formata um datetime no timezone do Brasil
    
    Args:
        dt: Datetime a ser formatado (None retorna string vazia)
        formato: Formato de saída (padrão: "%Y-%m-%d %H:%M:%S")
    
    Returns:
        str: String formatada ou vazia se dt for None
    """
    if dt is None:
        return ""
    
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    dt_brasil = dt.astimezone(BRASIL_TIMEZONE)
    return dt_brasil.strftime(formato)
