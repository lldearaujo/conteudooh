# 🚀 Deploy no EasyPanel

## ✅ Sobre o EasyPanel

EasyPanel é uma plataforma moderna de hospedagem que oferece:
- ✅ Planos gratuitos disponíveis
- ✅ Deploy via GitHub
- ✅ Suporte a Docker e aplicações Python
- ✅ Interface simples e intuitiva
- ✅ HTTPS automático

---

## 📋 Passo a Passo Completo

### 1. Criar Conta no EasyPanel

1. Acesse: **https://easypanel.io** ou **https://panel.easypanel.io**
2. Clique em **"Sign Up"** ou **"Get Started"**
3. Escolha uma forma de login:
   - **GitHub** (recomendado - mais fácil para deploy)
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

### 3. Criar Novo Projeto no EasyPanel

1. No dashboard do EasyPanel, clique em **"New Project"** ou **"+"**
2. Escolha **"App"** ou **"Web Service"**
3. Selecione **"GitHub"** como fonte

---

### 4. Conectar Repositório GitHub

1. Se não conectou antes, autorize o EasyPanel a acessar seus repositórios
2. Selecione o repositório `conteudooh`
3. Escolha a branch: `main` (ou `master`)

---

### 5. Configurar o Deploy

#### Opção A: Usando Dockerfile (Recomendado)

Se você já tem um `Dockerfile` (que já criamos):

1. EasyPanel detectará automaticamente o `Dockerfile`
2. Configure:
   - **Name**: `conteudooh`
   - **Port**: `8080` (ou deixe automático)
   - **Build Command**: (deixe vazio - usa Dockerfile)
   - **Start Command**: (deixe vazio - usa Dockerfile)

#### Opção B: Configuração Manual (Python)

Se preferir configurar manualmente:

1. **Runtime**: Selecione `Python`
2. **Python Version**: `3.13` ou `3.12`
3. **Build Command**: 
   ```
   pip install -r requirements.txt
   ```
4. **Start Command**: 
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
5. **Port**: `8080` ou deixe automático

---

### 6. Variáveis de Ambiente (Opcional)

Se necessário, adicione variáveis de ambiente:

- `PORT` = `8080` (geralmente automático)
- `PYTHONUNBUFFERED` = `1` (para logs em tempo real)

---

### 7. Configurar Domínio e HTTPS

1. EasyPanel geralmente fornece um domínio automático
2. HTTPS é configurado automaticamente
3. Você pode adicionar domínio customizado depois

---

### 8. Fazer Deploy

1. Clique em **"Deploy"** ou **"Create"**
2. O EasyPanel começará a fazer build automaticamente
3. Aguarde alguns minutos (primeira vez pode demorar)
4. Quando terminar, você verá status: **"Running"** ✅

---

## 🔧 Configurações Avançadas

### Auto-Deploy

Por padrão, o EasyPanel pode fazer deploy automático quando você faz push no GitHub.

Para ativar:
1. Vá em configurações do projeto
2. Ative "Auto Deploy" ou "Webhook"
3. Configure para branch `main`

### Health Check

O EasyPanel verifica automaticamente se o app está rodando.

### Logs

- Acesse o dashboard do EasyPanel
- Clique no seu projeto
- Aba "Logs" para ver logs em tempo real

---

## 🔄 Atualizar App

Sempre que fizer mudanças:

1. Faça commit e push no GitHub:
   ```bash
   git add .
   git commit -m "Atualização"
   git push
   ```
2. Se auto-deploy estiver ativo, o EasyPanel detecta automaticamente
3. Ou clique em "Redeploy" no dashboard
4. Aguarde alguns minutos

---

## 📊 Monitoramento

- **Dashboard**: https://panel.easypanel.io
- **Logs**: Disponível no dashboard do projeto
- **Métricas**: CPU, Memória, etc. (dependendo do plano)

---

## 🆘 Problemas Comuns

### Build Falha
- Verifique se `requirements.txt` está correto
- Veja os logs no EasyPanel para detalhes
- Confirme que o Dockerfile está correto (se usando Docker)

### App não inicia
- Verifique se o `Start Command` está correto
- Confirme que a porta está configurada corretamente
- Veja os logs para erros específicos

### Porta incorreta
- Verifique se o app está usando `$PORT` ou porta `8080`
- Confirme a porta configurada no EasyPanel

---

## 📝 Arquivos Necessários

Certifique-se de ter:

- ✅ `requirements.txt` - Dependências Python
- ✅ `Dockerfile` - Para deploy via Docker (opcional mas recomendado)
- ✅ `main.py` - Aplicação principal
- ✅ Todos os arquivos do projeto (templates, static, etc.)

---

## ✅ Checklist

- [ ] Conta criada no EasyPanel
- [ ] Código no GitHub
- [ ] Repositório conectado ao EasyPanel
- [ ] Projeto criado
- [ ] Build Command configurado (se não usar Dockerfile)
- [ ] Start Command configurado (se não usar Dockerfile)
- [ ] Porta configurada
- [ ] Deploy concluído
- [ ] App funcionando

---

## 🎉 Pronto!

Seu app estará online no domínio fornecido pelo EasyPanel.

**Acessos:**
- Tela de Exibição: `https://seu-dominio.easypanel.io/`
- Painel Admin: `https://seu-dominio.easypanel.io/admin`
- API Docs: `https://seu-dominio.easypanel.io/docs`

---

## 💡 Dicas

1. **Use Dockerfile**: Mais confiável e fácil de manter
2. **Monitore logs**: Acompanhe o primeiro deploy pelos logs
3. **Teste localmente**: Certifique-se de que funciona antes de fazer deploy
4. **Backup**: Mantenha backup do código no GitHub

---

## 🔗 Links Úteis

- **EasyPanel Dashboard**: https://panel.easypanel.io
- **Documentação**: https://easypanel.io/docs
- **Suporte**: Disponível no dashboard

