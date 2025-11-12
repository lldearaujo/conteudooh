@echo off
chcp 65001 > nul

echo ========================================
echo   Deploy ConteudoOH no EasyPanel
echo ========================================
echo.
echo 📋 INSTRUÇÕES RÁPIDAS:
echo.
echo 1. Acesse: https://easypanel.io
echo 2. Crie conta (pode usar GitHub)
echo 3. No dashboard, clique em "New Project" ou "+"
echo 4. Escolha "App" ou "Web Service"
echo 5. Conecte seu repositório GitHub
echo 6. Selecione o repositório 'conteudooh'
echo 7. EasyPanel detectará automaticamente o Dockerfile
echo 8. Configure:
echo    - Port: 8080
echo    - (Build e Start são automáticos via Dockerfile)
echo 9. Clique em "Deploy" ou "Create"
echo.
echo ✅ Vantagens do EasyPanel:
echo    - Interface moderna e simples
echo    - Suporte a Docker
echo    - Deploy automático via GitHub
echo    - HTTPS automático
echo.
echo 📖 Veja DEPLOY_EASYPANEL.md para instruções detalhadas
echo.
pause

