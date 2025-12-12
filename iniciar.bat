@echo off
echo ========================================
echo   ConteudoOH - Sistema de Mídia DOOH
echo ========================================
echo.

echo [1] Verificando Python...
py --version
if errorlevel 1 (
    echo ERRO: Python nao encontrado!
    echo Por favor, instale o Python primeiro.
    pause
    exit /b 1
)
echo.

echo [2] Verificando dependencias...
py -m pip show fastapi >nul 2>&1
if errorlevel 1 (
    echo FastAPI nao encontrado. Instalando dependencias...
    py -m pip install -r requirements.txt
    if errorlevel 1 (
        echo ERRO ao instalar dependencias!
        pause
        exit /b 1
    )
) else (
    echo Dependencias OK!
)
echo.

echo [3] Verificando porta 8000...
netstat -an | findstr :8000 >nul
if not errorlevel 1 (
    echo AVISO: Porta 8000 ja esta em uso!
    echo Tente fechar outros programas que possam estar usando esta porta.
    echo.
)
echo.

echo [4] Iniciando servidor...
echo.
echo O servidor estara disponivel em:
echo   - http://localhost:8000/
echo   - http://localhost:8000/admin
echo   - http://localhost:8000/docs
echo.
echo Pressione Ctrl+C para parar o servidor.
echo ========================================
echo.

py main.py

pause

