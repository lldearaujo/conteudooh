# 📊 Plano de Melhorias - Sistema de Tracking OOH/DOOH
## Análise e Proposta de Implementação

---

## 🔍 ANÁLISE DO SISTEMA ATUAL

### ✅ O que já temos:
1. **Tracking básico funcionando:**
   - IP address
   - User-Agent (parse)
   - Device type (mobile/tablet/desktop)
   - Browser
   - Operating System
   - Country e City (via GeoIP)
   - Data/hora do scan
   - Referrer

2. **Estrutura de dados:**
   - Links com identifier único
   - Campanha e Ponto DOOH
   - Relacionamento Link → Clicks
   - Analytics básico

3. **Interface admin:**
   - Gestão de links
   - Dashboard de analytics
   - Gráficos básicos

---

## 🎯 GAPS IDENTIFICADOS vs. PADRÃO DA INDÚSTRIA

### 1. DADOS TÉCNICOS DO ACESSO (Faltando)
- ❌ Estado/Região (só temos cidade)
- ❌ Idioma do dispositivo
- ❌ Provedor de internet (ISP)
- ⚠️ Tablet não está sendo diferenciado corretamente (pode estar como mobile)

### 2. DADOS DE ORIGEM E CAMPANHA (Crítico - Faltando)
- ❌ ID único do QR Code por ponto OOH
- ❌ Peça criativa/arte (versão do criativo)
- ❌ Local específico (ex: BR-230, Centro, Painel X)
- ❌ Tipo de mídia (Outdoor, Frontlight, LED, etc.)
- ❌ **UTMs completos** (utm_source, utm_medium, utm_campaign, utm_content)
- ⚠️ Ponto DOOH é genérico, não específico

### 3. DADOS DE COMPORTAMENTO PÓS-SCAN (Não implementado)
- ❌ Tempo de permanência na landing page
- ❌ Páginas visitadas
- ❌ Scroll depth
- ❌ Cliques em CTAs
- ❌ Conversões (WhatsApp, formulário, download, chamada, compra)

---

## 📋 PLANO DE IMPLEMENTAÇÃO

### **FASE 1: Melhorias nos Dados Técnicos do Acesso** ⭐ Prioridade Alta

#### 1.1 Expandir Model Click
**Adicionar campos:**
- `state` (String) - Estado/Região
- `language` (String) - Idioma do dispositivo (Accept-Language)
- `isp` (String) - Provedor de internet
- `timezone` (String) - Timezone do usuário
- `screen_resolution` (String) - Resolução da tela (se disponível via JS)

#### 1.2 Melhorar Tracking Service
**Melhorias:**
- Expandir `get_location_info()` para incluir:
  - Estado/região (region/state)
  - ISP (org)
  - Timezone
- Adicionar `get_language()` para extrair Accept-Language
- Melhorar detecção de tablet (user-agents já faz, mas validar)

#### 1.3 Melhorar GeoIP
**Atualizar serviço:**
- ipapi.co já retorna `region` (estado) e `org` (ISP)
- Adicionar fallback para outro serviço se necessário
- Cachear resultados para evitar rate limit

---

### **FASE 2: Dados de Origem e Campanha** ⭐⭐⭐ Prioridade CRÍTICA

#### 2.1 Expandir Model Link
**Adicionar campos:**
- `qr_code_id` (String, unique) - ID único do QR Code por ponto
- `peca_criativa` (String) - Nome/ID da peça criativa
- `local_especifico` (String) - Localização detalhada (ex: "BR-230, km 45")
- `tipo_midia` (String) - Enum: "Outdoor", "Frontlight", "LED", "Backlight", "Transit", etc.
- `utm_source` (String) - Padrão: "ooh" ou "dooh"
- `utm_medium` (String) - Padrão: "outdoor", "led", "frontlight", etc.
- `utm_campaign` (String) - Já existe como "campanha", mas pode ser diferente
- `utm_content` (String) - ID da peça criativa específica
- `utm_term` (String, opcional) - Termo de busca (se aplicável)

#### 2.2 Atualizar Schema LinkCreate
**Adicionar campos opcionais:**
- Todos os campos acima como opcionais
- Validação de enum para `tipo_midia`
- Auto-preenchimento de UTMs se não fornecidos

#### 2.3 Modificar Endpoint de QR Code
**Melhorias:**
- Ao gerar QR code, criar link com:
  - `qr_code_id`: `qr-{ponto_dooh}-{noticia_id}` ou similar
  - `tipo_midia`: Configurável ou detectar automaticamente
  - `local_especifico`: Pode vir de configuração
  - UTMs: Gerar automaticamente baseado em ponto e campanha

#### 2.4 Adicionar UTMs à URL de Destino
**Implementar:**
- Ao redirecionar, adicionar UTMs à URL de destino
- Formato: `?utm_source=ooh&utm_medium=led&utm_campaign={campanha}&utm_content={qr_code_id}`
- Preservar query params existentes

---

### **FASE 3: Dados de Comportamento Pós-Scan** ⭐⭐ Prioridade Média-Alta

#### 3.1 Criar Model ConversionEvent
**Novo model:**
```python
class ConversionEvent(Base):
    __tablename__ = "conversion_events"
    
    id = Column(Integer, primary_key=True)
    click_id = Column(Integer, ForeignKey("clicks.id"), nullable=False)
    event_type = Column(String(50))  # "pageview", "scroll", "cta_click", "whatsapp", "form", "download", "call", "purchase"
    event_value = Column(Text)  # Dados adicionais (JSON)
    occurred_at = Column(DateTime, default=now_brasil)
```

#### 3.2 Criar Script de Tracking JavaScript
**Novo arquivo: `static/tracking-pixel.js`**
- Script leve para injetar na landing page
- Rastrear:
  - Tempo de permanência (heartbeat a cada 30s)
  - Scroll depth (25%, 50%, 75%, 100%)
  - Cliques em CTAs (via data attributes)
  - Conversões (via eventos customizados)

#### 3.3 Endpoint de Tracking de Eventos
**Novo endpoint:**
- `POST /api/tracking/event`
- Recebe: `click_id`, `event_type`, `event_value`
- Validação e armazenamento

#### 3.4 Integração com Landing Pages
**Opções:**
1. **Pixel/Beacon** (recomendado):
   - Script JavaScript leve
   - Envia eventos via POST
   - Não bloqueia carregamento da página

2. **PostMessage API**:
   - Se a landing page estiver em iframe
   - Comunicação entre frames

---

### **FASE 4: Melhorias no Analytics** ⭐ Prioridade Média

#### 4.1 Expandir Analytics Service
**Novas métricas:**
- Tempo médio de permanência
- Taxa de scroll (25%, 50%, 75%, 100%)
- Taxa de conversão por tipo
- Funnel de conversão
- Análise por tipo de mídia
- Análise por local específico

#### 4.2 Dashboard Avançado
**Novos gráficos:**
- Funnel de conversão
- Heatmap de horários de maior engajamento
- Análise por tipo de mídia
- ROI por campanha (se houver dados de investimento)

---

## 🏗️ ARQUITETURA PROPOSTA

### Estrutura de Dados Expandida

```
Link
├── Dados Básicos (já existe)
├── QR Code ID (novo)
├── Peça Criativa (novo)
├── Local Específico (novo)
├── Tipo de Mídia (novo)
└── UTMs (novo)

Click
├── Dados Técnicos (expandir)
│   ├── State/Region (novo)
│   ├── Language (novo)
│   ├── ISP (novo)
│   └── Timezone (novo)
└── Dados Existentes

ConversionEvent (novo)
├── click_id (FK)
├── event_type
├── event_value (JSON)
└── occurred_at
```

---

## 🔧 IMPLEMENTAÇÃO TÉCNICA

### Boas Práticas a Seguir:

1. **Performance:**
   - Tracking assíncrono (não bloqueia redirecionamento)
   - Cache de GeoIP (evitar rate limits)
   - Batch de eventos (agrupar múltiplos eventos)

2. **Privacidade (LGPD):**
   - Anonimização de IPs após X dias
   - Consentimento explícito (se necessário)
   - Política de retenção de dados

3. **Escalabilidade:**
   - Índices no banco para queries rápidas
   - Agregações pré-calculadas (se volume alto)
   - Arquitetura preparada para migração para PostgreSQL

4. **Padrões da Indústria:**
   - Seguir padrão UTM do Google Analytics
   - Compatibilidade com ferramentas de analytics
   - Exportação de dados (CSV/JSON)

---

## 📊 PRIORIZAÇÃO DE IMPLEMENTAÇÃO

### **Sprint 1 (Crítico - 1-2 dias):**
1. ✅ Expandir Model Link com UTMs e dados de campanha
2. ✅ Adicionar UTMs à URL de destino no redirecionamento
3. ✅ Expandir GeoIP para incluir estado e ISP
4. ✅ Adicionar language tracking

### **Sprint 2 (Importante - 2-3 dias):**
1. ✅ Criar Model ConversionEvent
2. ✅ Criar script de tracking JavaScript
3. ✅ Endpoint de tracking de eventos
4. ✅ Melhorar analytics com novas métricas

### **Sprint 3 (Melhorias - 1-2 dias):**
1. ✅ Dashboard avançado
2. ✅ Exportação de dados
3. ✅ Relatórios personalizados

---

## 🎨 INTERFACE ADMIN - MELHORIAS

### Formulário de Criação de Link
**Adicionar campos:**
- QR Code ID (auto-gerado ou manual)
- Tipo de Mídia (dropdown)
- Local Específico
- Peça Criativa
- UTMs (auto-preenchimento ou manual)

### Dashboard de Analytics
**Adicionar seções:**
- Métricas de Conversão
- Funnel de Conversão
- Análise por Tipo de Mídia
- Heatmap de Horários
- Exportação de Relatórios

---

## 🔐 CONSIDERAÇÕES DE PRIVACIDADE

1. **LGPD Compliance:**
   - Anonimização de IPs após 90 dias
   - Opção de opt-out
   - Política de privacidade clara

2. **Dados Sensíveis:**
   - Não armazenar dados pessoais sem consentimento
   - IPs podem ser considerados dados pessoais

---

## 📈 MÉTRICAS DE SUCESSO

1. **Cobertura de Dados:**
   - % de cliques com dados completos
   - % de conversões rastreadas

2. **Performance:**
   - Tempo de resposta do tracking
   - Taxa de sucesso do GeoIP

3. **Utilidade:**
   - Uso do dashboard
   - Exportações realizadas

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1 - Dados Técnicos:
- [ ] Adicionar campos state, language, isp ao Click
- [ ] Expandir get_location_info() para incluir estado e ISP
- [ ] Adicionar extração de Accept-Language
- [ ] Atualizar schemas

### Fase 2 - Dados de Campanha:
- [ ] Adicionar campos UTMs e metadados ao Link
- [ ] Modificar endpoint de redirecionamento para adicionar UTMs
- [ ] Atualizar formulário de criação de link
- [ ] Auto-gerar UTMs quando não fornecidos

### Fase 3 - Comportamento:
- [ ] Criar model ConversionEvent
- [ ] Criar script tracking-pixel.js
- [ ] Criar endpoint POST /api/tracking/event
- [ ] Integrar script na landing page (via instruções)

### Fase 4 - Analytics:
- [ ] Expandir analytics_service com novas métricas
- [ ] Adicionar gráficos de conversão no dashboard
- [ ] Implementar exportação CSV/JSON

---

## 🚀 PRÓXIMOS PASSOS

1. **Revisar e aprovar este plano**
2. **Definir prioridades específicas**
3. **Implementar em sprints**
4. **Testar cada fase antes de avançar**
5. **Documentar para usuários finais**

---

**Versão:** 1.0  
**Data:** 2024  
**Status:** Aguardando aprovação para implementação
