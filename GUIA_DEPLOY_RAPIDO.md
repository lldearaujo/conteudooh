# 🚀 Guia Rápido de Deploy - EasyPanel

## ⚡ Deploy Automatizado (Recomendado)

### Primeira Vez - Configurar GitHub

1. **Execute o script de configuração:**
   ```bash
   setup_github.bat
   ```

2. **Siga as instruções:**
   - Crie um repositório no GitHub: https://github.com/new
   - Cole a URL quando solicitado
   - O script fará tudo automaticamente!

### Deploy Contínuo

**Sempre que quiser fazer deploy:**

```bash
deploy_automated.bat
```

O script irá:
- ✅ Verificar se há mudanças
- ✅ Fazer commit automático
- ✅ Fazer push para GitHub
- ✅ Mostrar instruções para EasyPanel

---

## 📋 Passo a Passo Completo

### 1. Preparar Código no GitHub

**Opção A - Script Automatizado (Mais Fácil):**
```bash
setup_github.bat        # Primeira vez
deploy_automated.bat    # Deploy contínuo
```

**Opção B - Manual:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/SEU_USUARIO/conteudooh.git
git push -u origin main
```

---

### 2. Configurar no EasyPanel

1. **Acesse:** https://easypanel.io
2. **Login:** Use GitHub (mais fácil)
3. **Criar Projeto:**
   - Clique em "New Project" ou "+"
   - Escolha "App" ou "Web Service"
4. **Conectar GitHub:**
   - Selecione "GitHub" como fonte
   - Autorize o EasyPanel (se necessário)
   - Escolha o repositório: `conteudooh`
   - Escolha branch: `main`

---

### 3. Configurar Deploy

**EasyPanel detectará automaticamente:**
- ✅ Dockerfile (será usado automaticamente)
- ✅ Porta: 8080 (configure manualmente se necessário)

**Configurações:**
- **Name:** `conteudooh`
- **Port:** `8080`
- **Build Command:** (deixe vazio - usa Dockerfile)
- **Start Command:** (deixe vazio - usa Dockerfile)

---

### 4. Deploy!

1. Clique em **"Deploy"** ou **"Create"**
2. Aguarde alguns minutos
3. Seu app estará online! 🎉

---

## 🔄 Atualizar App (Após Mudanças)

### Método Automatizado:
```bash
deploy_automated.bat
```

### Método Manual:
```bash
git add .
git commit -m "Atualização"
git push origin main
```

**EasyPanel fará deploy automático** (se configurado) ou clique em "Redeploy" no dashboard.

---

## 📊 Verificar Status

- **Dashboard:** https://easypanel.io/dashboard
- **Logs:** Disponível no dashboard do projeto
- **URL:** Fornecida pelo EasyPanel após deploy

---

## 🆘 Problemas Comuns

### Git não encontrado
- Instale: https://git-scm.com/download/win
- OU use GitHub Desktop: https://desktop.github.com

### Erro ao fazer push
- Verifique se está autenticado no GitHub
- Confirme que o repositório existe
- Verifique permissões

### Build falha no EasyPanel
- Verifique os logs no dashboard
- Confirme que o Dockerfile está correto
- Verifique se todas as dependências estão em `requirements.txt`

---

## ✅ Checklist

- [ ] Git instalado
- [ ] Repositório criado no GitHub
- [ ] Código enviado para GitHub (`setup_github.bat` ou manual)
- [ ] Conta criada no EasyPanel
- [ ] Projeto criado no EasyPanel
- [ ] Repositório conectado
- [ ] Porta configurada (8080)
- [ ] Deploy executado
- [ ] App funcionando

---

## 🎯 Comandos Rápidos

```bash
# Configurar GitHub (primeira vez)
setup_github.bat

# Deploy automático
deploy_automated.bat

# Deploy manual
git add .
git commit -m "Mudanças"
git push origin main
```

---

## 💡 Dicas

1. **Use os scripts:** Eles automatizam tudo!
2. **Monitore logs:** Acompanhe o primeiro deploy
3. **Teste localmente:** Certifique-se de que funciona antes
4. **Backup:** Mantenha código no GitHub

---

## 📖 Documentação Completa

- **EasyPanel:** Veja `DEPLOY_EASYPANEL.md`
- **Render.com:** Veja `DEPLOY_RENDER.md`
- **Fly.io:** Veja `DEPLOY_FLY.md`

