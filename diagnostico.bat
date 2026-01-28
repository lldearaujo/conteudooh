@echo off
echo ========================================
echo   DIAGNOSTICO - ConteudoOH
echo ========================================
echo.

echo [1] Verificando Python...
py --version
if errorlevel 1 (
    echo ERRO: Python nao encontrado!
    pause
    exit /b 1
)
echo.

echo [2] Verificando dependencias...
py -m pip list | findstr fastapi
if errorlevel 1 (
    echo AVISO: FastAPI pode nao estar instalado
    echo Instalando dependencias...
    py -m pip install -r requirements.txt
)
echo.

echo [3] Testando importacao...
py -c "from main import app; print('OK - Importacao funcionou')" 2>&1
if errorlevel 1 (
    echo ERRO na importacao! Verifique os erros acima.
    pause
    exit /b 1
)
echo.

echo [4] Verificando porta 8000...
netstat -an | findstr :8000
if errorlevel 1 (
    echo Porta 8000 esta livre
) else (
    echo AVISO: Porta 8000 ja esta em uso!
)
echo.

echo [5] Iniciando servidor...
echo.
py main.py

pause






