# 🚀 Deploy no Render.com (GRATUITO - Sem Cartão)

## ✅ Vantagens do Render.com

- ✅ **100% Gratuito** - Sem necessidade de cartão de crédito
- ✅ **Deploy Automático** - Via GitHub
- ✅ **HTTPS Automático** - SSL incluído
- ✅ **Fácil Configuração** - Interface simples
- ⚠️ **Limitação**: Pode hibernar após 15min de inatividade (acorda automaticamente)

---

## 📋 Passo a Passo Completo

### 1. Criar Conta no Render.com

1. Acesse: **https://render.com**
2. Clique em **"Get Started for Free"**
3. Escolha uma forma de login:
   - **GitHub** (recomendado - mais fácil)
   - **Google**
   - **Email**

---

### 2. Preparar Repositório GitHub

**Se você ainda não tem o código no GitHub:**

1. Crie um repositório no GitHub: https://github.com/new
2. Nome: `conteudooh` (ou outro)
3. **NÃO** marque "Initialize with README" (se já tiver código)
4. Clique em "Create repository"

**Enviar código para GitHub:**

```bash
# No terminal, dentro da pasta do projeto:
git init
git add .
git commit -m "Initial commit - ConteudoOH"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/conteudooh.git
git push -u origin main
```

**OU use GitHub Desktop** (mais fácil):
1. Baixe: https://desktop.github.com
2. File → Add Local Repository
3. Escolha a pasta do projeto
4. Publish repository

---

### 3. Criar Web Service no Render

1. No dashboard do Render, clique em **"New +"**
2. Selecione **"Web Service"**
3. Conecte seu repositório GitHub:
   - Se não conectou antes, autorize o Render
   - Selecione o repositório `conteudooh`

---

### 4. Configurar o Serviço

Preencha os campos:

- **Name**: `conteudooh` (ou outro nome)
- **Region**: `São Paulo` (ou mais próximo)
- **Branch**: `main` (ou `master`)
- **Root Directory**: `.` (deixe vazio ou coloque `.`)
- **Runtime**: `Python 3`
- **Build Command**: 
  ```
  pip install -r requirements.txt
  ```
- **Start Command**: 
  ```
  uvicorn main:app --host 0.0.0.0 --port $PORT
  ```

**Variáveis de Ambiente** (opcional):
- Clique em "Advanced"
- Adicione se necessário:
  - `PYTHON_VERSION` = `3.13.9`
  - `PORT` = `8080` (geralmente automático)

---

### 5. Criar e Fazer Deploy

1. Clique em **"Create Web Service"**
2. O Render começará a fazer build automaticamente
3. Aguarde alguns minutos (primeira vez pode demorar)
4. Quando terminar, você verá: **"Live"** ✅

---

### 6. Acessar seu App

Seu app estará disponível em:
- **URL**: `https://conteudooh.onrender.com`
- Ou o nome que você escolheu: `https://seu-nome.onrender.com`

---

## 🔧 Configurações Avançadas

### Auto-Deploy

Por padrão, o Render faz deploy automático quando você faz push no GitHub.

### Health Check

O Render verifica automaticamente se o app está rodando na rota `/`.

### Logs

- Acesse o dashboard do Render
- Clique no seu serviço
- Aba "Logs" para ver logs em tempo real

---

## ⚠️ Importante sobre Hibernação

O Render pode hibernar apps gratuitos após **15 minutos de inatividade**.

**Soluções:**
1. **Aceitar**: O app acorda automaticamente quando alguém acessa (pode levar 30-60 segundos)
2. **Upgrade**: Plano pago ($7/mês) não hiberna
3. **Ping Automático**: Use serviços como UptimeRobot para manter ativo

---

## 🔄 Atualizar App

Sempre que fizer mudanças:

1. Faça commit e push no GitHub:
   ```bash
   git add .
   git commit -m "Atualização"
   git push
   ```
2. O Render detecta automaticamente e faz novo deploy
3. Aguarde alguns minutos

---

## 📊 Monitoramento

- **Dashboard**: https://render.com/dashboard
- **Logs**: Disponível no dashboard do serviço
- **Métricas**: CPU, Memória, etc.

---

## 🆘 Problemas Comuns

### Build Falha
- Verifique se `requirements.txt` está correto
- Veja os logs no Render para detalhes

### App não inicia
- Verifique se o `Start Command` está correto
- Confirme que a porta está usando `$PORT`

### Hibernação
- Normal no plano gratuito
- Primeiro acesso após hibernação pode demorar

---

## ✅ Checklist

- [ ] Conta criada no Render.com
- [ ] Código no GitHub
- [ ] Repositório conectado ao Render
- [ ] Web Service criado
- [ ] Build Command configurado
- [ ] Start Command configurado
- [ ] Deploy concluído
- [ ] App funcionando

---

## 🎉 Pronto!

Seu app estará online em: `https://conteudooh.onrender.com`

**Acessos:**
- Tela de Exibição: `https://conteudooh.onrender.com/`
- Painel Admin: `https://conteudooh.onrender.com/admin`
- API Docs: `https://conteudooh.onrender.com/docs`

