# 🚀 Guia de Deploy no Fly.io

## Passo a Passo Completo

### 1. Instalar Fly CLI

**Windows (PowerShell):**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**Ou baixe manualmente:**
- Acesse: https://fly.io/docs/hands-on/install-flyctl/
- Baixe o instalador para Windows

**Verificar instalação:**
```bash
flyctl version
```

---

### 2. Criar Conta no Fly.io

1. Acesse: https://fly.io/app/sign-up
2. Crie sua conta (pode usar GitHub, Google ou email)
3. Confirme o email

---

### 3. Fazer Login

```bash
flyctl auth login
```

Isso abrirá o navegador para autenticação.

---

### 4. Criar e Fazer Deploy do App

**Opção A: Deploy Automático (Recomendado)**

```bash
# Criar app (escolha um nome único se "conteudooh" já existir)
flyctl launch

# Durante o processo, você será perguntado:
# - Nome do app: conteudooh (ou outro nome único)
# - Região: gru (São Paulo) ou escolha outra
# - Postgres: No (não precisamos, usamos SQLite)
# - Redis: No
```

**Opção B: Deploy Manual**

```bash
# Criar app
flyctl apps create conteudooh

# Fazer deploy
flyctl deploy
```

---

### 5. Verificar Status

```bash
# Ver status do app
flyctl status

# Ver logs
flyctl logs

# Abrir no navegador
flyctl open
```

---

### 6. Configurações Importantes

**Região (São Paulo):**
O arquivo `fly.toml` já está configurado para `gru` (São Paulo).

**Porta:**
A aplicação está configurada para usar porta 8080 (padrão Fly.io).

**Persistência:**
⚠️ **IMPORTANTE:** O SQLite salva dados localmente. No Fly.io, os dados serão perdidos quando o container reiniciar.

**Para persistência de dados, você pode:**

1. **Usar Volume Fly.io:**
```bash
flyctl volumes create conteudooh_data --size 1 --region gru
```

E ajustar o código para salvar o banco no volume.

2. **Migrar para PostgreSQL:**
```bash
flyctl postgres create --name conteudooh-db
flyctl postgres attach conteudooh-db
```

---

### 7. Comandos Úteis

```bash
# Ver informações do app
flyctl info

# Ver logs em tempo real
flyctl logs -a conteudooh

# Escalar app
flyctl scale count 1

# Reiniciar app
flyctl apps restart conteudooh

# Ver variáveis de ambiente
flyctl secrets list

# Definir variável de ambiente
flyctl secrets set KEY=value
```

---

### 8. Atualizar App

Sempre que fizer mudanças:

```bash
flyctl deploy
```

---

### 9. Monitoramento

- **Dashboard:** https://fly.io/dashboard
- **Logs:** `flyctl logs`
- **Métricas:** Disponível no dashboard

---

## ⚠️ Problemas Comuns

### Erro: "app name already taken"
Escolha outro nome único:
```bash
flyctl apps create conteudooh-seu-nome
```

### Erro de porta
Verifique se o `fly.toml` está usando porta 8080.

### Dados perdidos após restart
SQLite não persiste. Considere usar volume ou PostgreSQL.

### Erro de build
Verifique se todas as dependências estão em `requirements.txt`.

---

## ✅ Checklist de Deploy

- [ ] Fly CLI instalado
- [ ] Conta criada no Fly.io
- [ ] Login realizado (`flyctl auth login`)
- [ ] Arquivo `fly.toml` criado
- [ ] Arquivo `Dockerfile` criado
- [ ] `requirements.txt` atualizado
- [ ] Deploy executado (`flyctl deploy`)
- [ ] App funcionando (`flyctl open`)

---

## 🎉 Pronto!

Seu app estará disponível em: `https://conteudooh.fly.dev`

Ou no nome que você escolher: `https://seu-app.fly.dev`

