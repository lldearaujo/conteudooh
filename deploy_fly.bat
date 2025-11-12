@echo off
chcp 65001 > nul

echo ========================================
echo   Deploy ConteudoOH no Fly.io
echo ========================================
echo.

REM Adicionar Fly CLI ao PATH
set PATH=%PATH%;%USERPROFILE%\.fly\bin

echo Verificando login...
flyctl auth whoami
if %errorlevel% neq 0 (
    echo.
    echo ❌ Você não está logado. Execute: flyctl auth login
    pause
    exit /b 1
)

echo.
echo ✅ Login verificado!
echo.

REM Verificar se o app já existe
echo Verificando se o app já existe...
flyctl apps list | findstr "conteudooh" > nul
if %errorlevel% equ 0 (
    echo.
    echo ✅ App 'conteudooh' encontrado!
    echo.
    echo Fazendo deploy...
    flyctl deploy
) else (
    echo.
    echo ⚠️  App 'conteudooh' não encontrado.
    echo.
    echo Criando app e fazendo deploy...
    echo.
    flyctl launch --copy-config --name conteudooh --region gru
)

echo.
echo ========================================
echo   Deploy concluído!
echo ========================================
echo.
echo 🌐 Seu app estará disponível em:
echo    https://conteudooh.fly.dev
echo.
echo 📋 Comandos úteis:
echo    flyctl logs          - Ver logs
echo    flyctl open          - Abrir no navegador
echo    flyctl status        - Ver status
echo.
pause

