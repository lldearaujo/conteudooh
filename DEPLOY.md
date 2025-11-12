# Guia de Deploy - ConteudoOH

## Opções de Hospedagem

### 🆓 Opções Gratuitas Recomendadas

#### 1. Render.com (Recomendado)
**Vantagens:**
- Plano gratuito disponível
- Deploy automático via GitHub
- HTTPS automático
- Fácil configuração

**Passos:**
1. Crie conta em https://render.com
2. Conecte seu repositório GitHub
3. Crie um novo "Web Service"
4. Configure:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Environment: Python 3
5. Deploy automático!

**Limitação:** Pode hibernar após 15 minutos de inatividade (acorda automaticamente)

---

#### 2. Railway.app
**Vantagens:**
- $5 créditos grátis/mês
- Deploy muito simples
- Sem hibernação

**Passos:**
1. Crie conta em https://railway.app
2. Conecte GitHub
3. Clique em "New Project" → "Deploy from GitHub repo"
4. Railway detecta automaticamente Python
5. Configure variável de ambiente `PORT` (se necessário)

---

#### 3. Fly.io
**Vantagens:**
- Plano gratuito generoso
- Performance global
- Sem hibernação

**Passos:**
1. Instale Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Crie app: `fly launch`
4. Deploy: `fly deploy`

---

### 💰 Opções Pagas

#### DigitalOcean App Platform
- **Preço:** A partir de $5/mês
- **Vantagens:** Escalável, confiável, bom suporte

#### Heroku
- **Preço:** A partir de $7/mês
- **Vantagens:** Muito fácil de usar, boa documentação

#### AWS / Google Cloud
- **Preço:** Pay-as-you-go
- **Vantagens:** Máxima escalabilidade, recursos avançados

---

## Preparação para Deploy

### Arquivos Necessários

1. **requirements.txt** ✅ (já existe)
2. **runtime.txt** (opcional - especificar versão Python)
3. **Procfile** ou **startup command** (comando de inicialização)

### Criar runtime.txt (opcional)
```
python-3.13.9
```

### Comando de Start Recomendado
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## Variáveis de Ambiente (se necessário)

Algumas plataformas podem precisar:
- `PORT` - Porta do servidor (geralmente definida automaticamente)
- `PYTHONUNBUFFERED=1` - Para logs em tempo real

---

## Recomendação

Para começar rápido e grátis: **Render.com**
- Mais simples de configurar
- Deploy automático
- HTTPS incluído
- Boa documentação

Para produção profissional: **DigitalOcean** ou **Railway**
- Mais estável
- Sem hibernação
- Melhor performance

