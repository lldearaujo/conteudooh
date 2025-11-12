@echo off
chcp 65001 > nul

echo ========================================
echo   Deploy Automatizado - ConteudoOH
echo ========================================
echo.

REM Verificar se Git está instalado
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git não está instalado!
    echo.
    echo 📥 Instale o Git: https://git-scm.com/download/win
    echo OU use GitHub Desktop: https://desktop.github.com
    pause
    exit /b 1
)

echo ✅ Git encontrado!
echo.

REM Verificar se estamos em um repositório Git
git rev-parse --git-dir >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Inicializando repositório Git...
    git init
    git branch -M main
    echo ✅ Repositório inicializado!
    echo.
)

REM Verificar se há remote configurado
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Repositório GitHub não configurado!
    echo.
    echo 📋 PRÓXIMOS PASSOS:
    echo.
    echo 1. Crie um repositório no GitHub:
    echo    https://github.com/new
    echo.
    echo 2. Depois execute:
    echo    git remote add origin https://github.com/SEU_USUARIO/conteudooh.git
    echo    git push -u origin main
    echo.
    echo OU use GitHub Desktop para fazer upload.
    echo.
    pause
    exit /b 1
)

echo ✅ Repositório GitHub configurado!
echo.

REM Mostrar status
echo 📊 Status do repositório:
git status --short
echo.

REM Perguntar se deseja fazer commit e push
set /p fazer_deploy="Deseja fazer commit e push para GitHub? (S/N): "
if /i not "%fazer_deploy%"=="S" (
    echo.
    echo ⏭️  Pulando commit/push.
    goto :easypanel
)

echo.
echo 📝 Fazendo commit...
git add .
git commit -m "Deploy: Atualização do sistema ConteudoOH - %date% %time%"
if %errorlevel% neq 0 (
    echo ⚠️  Nenhuma mudança para commitar ou erro no commit.
)

echo.
echo 🚀 Fazendo push para GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  Erro ao fazer push. Verifique:
    echo    - Se você está autenticado no GitHub
    echo    - Se o repositório existe
    echo    - Se você tem permissões
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Código enviado para GitHub com sucesso!
echo.

:easypanel
echo ========================================
echo   Próximo Passo: EasyPanel
echo ========================================
echo.
echo 🌐 Agora acesse o EasyPanel:
echo    https://easypanel.io
echo.
echo 📋 INSTRUÇÕES:
echo.
echo 1. Faça login no EasyPanel
echo 2. Clique em "New Project" ou "+"
echo 3. Escolha "App" ou "Web Service"
echo 4. Conecte seu repositório GitHub
echo 5. Selecione o repositório: conteudooh
echo 6. EasyPanel detectará o Dockerfile automaticamente
echo 7. Configure porta: 8080
echo 8. Clique em "Deploy"
echo.
echo ✅ O Dockerfile já está configurado!
echo.
echo 📖 Veja DEPLOY_EASYPANEL.md para mais detalhes
echo.
pause

