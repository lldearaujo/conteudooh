@echo off
chcp 65001 > nul

echo ========================================
echo   Configurar GitHub para Deploy
echo ========================================
echo.

REM Verificar se Git está instalado
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git não está instalado!
    echo.
    echo 📥 Baixe e instale:
    echo    https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo ✅ Git encontrado!
echo.

REM Verificar se já é um repositório Git
if not exist .git (
    echo 📦 Inicializando repositório Git...
    git init
    git branch -M main
    echo ✅ Repositório inicializado!
    echo.
)

REM Verificar remote
git remote get-url origin >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Repositório remoto já configurado:
    git remote get-url origin
    echo.
    set /p continuar="Deseja continuar mesmo assim? (S/N): "
    if /i not "!continuar!"=="S" exit /b 0
    echo.
) else (
    echo ⚠️  Repositório remoto não configurado.
    echo.
)

echo 📋 CONFIGURAÇÃO DO GITHUB:
echo.
echo 1. Crie um repositório no GitHub:
echo    https://github.com/new
echo    Nome: conteudooh (ou outro)
echo    NÃO marque "Initialize with README"
echo.
set /p repo_url="2. Cole a URL do repositório (ex: https://github.com/usuario/conteudooh.git): "

if "%repo_url%"=="" (
    echo.
    echo ❌ URL não fornecida. Cancelando...
    pause
    exit /b 1
)

echo.
echo 🔗 Configurando remote...
git remote remove origin 2>nul
git remote add origin %repo_url%
echo ✅ Remote configurado: %repo_url%
echo.

echo 📝 Adicionando arquivos...
git add .
echo.

echo 💾 Fazendo commit inicial...
git commit -m "Initial commit - ConteudoOH Sistema de Mídia Indoor/DOOH"
echo.

echo 🚀 Enviando para GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCESSO! Código enviado para GitHub!
    echo.
    echo 🌐 Seu repositório: %repo_url%
    echo.
    echo 📋 PRÓXIMO PASSO:
    echo    Execute: deploy_automated.bat
    echo    OU configure o EasyPanel manualmente
    echo.
) else (
    echo.
    echo ⚠️  Erro ao fazer push. Possíveis causas:
    echo    - Repositório não existe ou URL incorreta
    echo    - Não está autenticado no GitHub
    echo    - Não tem permissão para escrever
    echo.
    echo 💡 Dica: Use GitHub Desktop para facilitar:
    echo    https://desktop.github.com
    echo.
)

pause

