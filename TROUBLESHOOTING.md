# 🔧 Troubleshooting - "Service is not reachable"

## ❌ Erro: "Service is not reachable"

Este erro significa que o app não está respondendo. Vamos resolver!

---

## 🔍 Passo 1: Verificar Logs no EasyPanel

**Ação mais importante:**

1. No dashboard do EasyPanel, vá na aba **"Logs"**
2. Procure por erros em **vermelho**
3. Veja as últimas linhas dos logs
4. Copie qualquer mensagem de erro

**O que procurar:**
- Erros de importação
- Erros de porta
- Erros de dependências
- Mensagens de crash

---

## 🔧 Passo 2: Verificar Configurações

### Porta Configurada?

No EasyPanel, verifique:
- **Port:** Deve ser `8080`
- **Internal Port:** Deve ser `8080`

### Variáveis de Ambiente?

Verifique se há variáveis configuradas:
- `PORT` = `8080` (opcional, mas pode ajudar)
- `PYTHONUNBUFFERED` = `1` (para logs melhores)

---

## 🐛 Passo 3: Problemas Comuns

### Problema 1: Porta Incorreta

**Sintoma:** App inicia mas não responde

**Solução:**
1. No EasyPanel, vá em configurações do app
2. Verifique a porta: deve ser `8080`
3. Salve e faça redeploy

### Problema 2: App Crasha ao Iniciar

**Sintoma:** Logs mostram erro e app para

**Solução:**
1. Veja os logs completos
2. Procure por:
   - `ModuleNotFoundError` → Dependência faltando
   - `ImportError` → Erro de importação
   - `Port already in use` → Porta ocupada
   - `Database error` → Problema com SQLite

### Problema 3: Dockerfile com Problema

**Sintoma:** Build falha ou app não inicia

**Solução:**
- Verifique se o Dockerfile está correto
- Confirme que todas as dependências estão em `requirements.txt`

---

## 🛠️ Soluções Rápidas

### Solução 1: Verificar e Ajustar Porta

No EasyPanel:
1. Vá em configurações do app
2. Porta: `8080`
3. Internal Port: `8080`
4. Salve e redeploy

### Solução 2: Adicionar Variável de Ambiente

No EasyPanel:
1. Vá em "Environment Variables"
2. Adicione:
   - `PORT` = `8080`
   - `PYTHONUNBUFFERED` = `1`
3. Salve e redeploy

### Solução 3: Verificar Health Check

O EasyPanel pode estar verificando a rota errada.

**Solução:**
1. Configure Health Check para: `/`
2. Ou desabilite temporariamente

---

## 📋 Checklist de Diagnóstico

- [ ] Verifiquei os logs no EasyPanel
- [ ] Porta está configurada como 8080
- [ ] App está com status "Running"
- [ ] Não há erros nos logs
- [ ] Health check está configurado corretamente

---

## 🔄 Próximos Passos

1. **Veja os logs** e me envie qualquer erro
2. **Verifique a porta** (deve ser 8080)
3. **Confirme variáveis de ambiente**
4. **Tente fazer redeploy**

---

## 💡 Dica Importante

**Os logs são a chave!** Sempre verifique os logs primeiro. Eles mostram exatamente o que está errado.



