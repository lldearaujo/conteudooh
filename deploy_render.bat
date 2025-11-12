@echo off
chcp 65001 > nul

echo ========================================
echo   Deploy ConteudoOH no Render.com
echo ========================================
echo.
echo 📋 INSTRUÇÕES:
echo.
echo 1. Acesse: https://render.com
echo 2. Crie conta (pode usar GitHub)
echo 3. Clique em "New +" → "Web Service"
echo 4. Conecte seu repositório GitHub
echo 5. Configure:
echo    - Name: conteudooh
echo    - Region: São Paulo (ou mais próximo)
echo    - Branch: main (ou master)
echo    - Root Directory: . (raiz)
echo    - Runtime: Python 3
echo    - Build Command: pip install -r requirements.txt
echo    - Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
echo 6. Clique em "Create Web Service"
echo.
echo ✅ Vantagens do Render.com:
echo    - Gratuito sem cartão de crédito
echo    - Deploy automático via GitHub
echo    - HTTPS automático
echo    - URL: conteudooh.onrender.com
echo.
echo ⚠️  Limitação: Pode hibernar após 15min de inatividade
echo    (acorda automaticamente quando alguém acessa)
echo.
pause

