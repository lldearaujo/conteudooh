# Documento de Implementação - Link Tracking System

## 📋 Objetivo
Implementar sistema completo de rastreamento de links para campanhas DOOH, integrado ao sistema ConteudoOH existente.

---

## 🎯 Decisões Técnicas Confirmadas

1. **Banco de Dados**: SQLite (manter atual)
2. **GeoIP**: Implementar agora (usar serviço gratuito ipapi.co)
3. **Integração**: Integrar com QR codes existentes
4. **Frontend**: Adicionar nova aba no admin.html
5. **Escopo**: Implementação completa em fases

---

## 📦 Fase 1: Dependências e Configuração

### 1.1 Atualizar requirements.txt
Adicionar:
- `user-agents==2.2.0` (parse User-Agent)
- `pydantic>=2.4.0,<3.0.0` (validação - verificar se já existe)
- `pydantic-settings>=2.0.0` (configurações)
- `requests` (já existe, usado para GeoIP)

### 1.2 Criar arquivo de configuração
- Criar `config.py` para gerenciar variáveis de ambiente
- Configurar: GeoIP API key (opcional, usar serviço gratuito)

---

## 🗄️ Fase 2: Models e Database

### 2.1 Adicionar Models em models.py

**Model: Link**
```python
class Link(Base):
    __tablename__ = "links"
    
    id = Column(Integer, primary_key=True, index=True)
    identifier = Column(String(100), unique=True, nullable=False, index=True)
    destination_url = Column(Text, nullable=False)
    ponto_dooh = Column(String(200), nullable=False)
    campanha = Column(String(200), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relacionamento
    clicks = relationship("Click", back_populates="link", cascade="all, delete-orphan")
```

**Model: Click**
```python
class Click(Base):
    __tablename__ = "clicks"
    
    id = Column(Integer, primary_key=True, index=True)
    link_id = Column(Integer, ForeignKey("links.id", ondelete="CASCADE"), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    referrer = Column(Text, nullable=True)
    device_type = Column(String(50), nullable=True)
    browser = Column(String(100), nullable=True)
    operating_system = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    clicked_at = Column(DateTime, server_default=func.now(), index=True)
    
    # Relacionamento
    link = relationship("Link", back_populates="clicks")
```

### 2.2 Atualizar database.py
- Manter SQLite como está
- Adicionar pool_pre_ping se necessário

---

## 📝 Fase 3: Schemas Pydantic

### 3.1 Criar schemas.py

**Schemas de Link:**
- `LinkCreate`: identifier, destination_url, ponto_dooh, campanha
- `LinkResponse`: todos os campos + total_clicks
- `LinkList`: lista de LinkResponse

**Schemas de Click:**
- `ClickResponse`: todos os campos do click

**Schemas de Analytics:**
- `AnalyticsResponse`: métricas agregadas
- `LinkAnalytics`: métricas de link específico

---

## 🔧 Fase 4: Serviços

### 4.1 Criar tracking_service.py

**Funções:**
- `get_client_ip(request)`: Extrai IP considerando proxies
- `parse_user_agent(user_agent)`: Parse User-Agent
- `get_location_info(ip)`: Busca GeoIP via ipapi.co
- `track_click(db, link_id, request)`: Método principal de tracking

**GeoIP:**
- Usar serviço gratuito: `https://ipapi.co/{ip}/json/`
- Campos: country_name, city
- Tratamento de erro: se falhar, continua sem localização

### 4.2 Criar analytics_service.py

**Funções:**
- `get_link_analytics(db, ponto_dooh=None, campanha=None, link_id=None, start_date=None, end_date=None)`: Métricas gerais
- `_get_top_links(db, filters)`: Top 10 links
- `get_link_specific_analytics(db, link_id, start_date=None, end_date=None)`: Métricas de link específico

**Métricas calculadas:**
- Total de cliques
- IPs únicos
- Cliques por ponto DOOH
- Cliques por campanha
- Cliques por dispositivo
- Cliques por país
- Cliques por dia
- Top 10 links

---

## 🌐 Fase 5: Endpoints API

### 5.1 Endpoints de Links (`/api/links`)

**POST /api/links**
- Criar novo link
- Validar identifier único
- Retornar LinkResponse

**GET /api/links**
- Listar links
- Query params: skip, limit, ponto_dooh, campanha
- Incluir total_clicks para cada link

**GET /api/links/{link_id}**
- Obter link específico
- Incluir total_clicks

**DELETE /api/links/{link_id}**
- Deletar link e cliques (cascade)

### 5.2 Endpoint de Tracking (`/r/{identifier}`)

**GET /r/{identifier}**
- Buscar link por identifier
- Criar registro de click
- Redirecionar 302 para destination_url
- Se link não existir, retornar 404

### 5.3 Endpoints de Analytics (`/api/analytics`)

**GET /api/analytics**
- Query params: ponto_dooh, campanha, link_id, start_date, end_date
- Retornar AnalyticsResponse

**GET /api/analytics/link/{link_id}**
- Query params: start_date, end_date
- Retornar LinkAnalytics

---

## 🔗 Fase 6: Integração com QR Codes

### 6.1 Modificar endpoint de QR Code

**Endpoint atual:** `/api/noticias/{noticia_id}/qrcode`

**Modificações:**
- Ao gerar QR code, criar link rastreável automaticamente
- Identifier gerado: `noticia-{noticia_id}`
- URL do QR code: `{base_url}/r/noticia-{noticia_id}`
- Se link já existir, usar o existente
- Ponto DOOH: "Notícias"
- Campanha: título da notícia (truncado se necessário)

**Fluxo:**
1. Verificar se link com identifier `noticia-{noticia_id}` existe
2. Se não existir, criar link:
   - identifier: `noticia-{noticia_id}`
   - destination_url: URL da notícia
   - ponto_dooh: "Notícias"
   - campanha: título da notícia (máx 200 chars)
3. Gerar QR code apontando para `/r/noticia-{noticia_id}`
4. Retornar QR code

---

## 🎨 Fase 7: Frontend - Admin

### 7.1 Modificar admin.html

**Adicionar nova aba:**
- Aba "Links" ao lado de "Notícias"
- Aba "Analytics" para dashboard

**Estrutura da aba Links:**
- Formulário de criação de link
- Tabela listando links existentes
- Botão deletar para cada link
- Filtros: ponto DOOH, campanha

**Estrutura da aba Analytics:**
- Filtros: data, ponto DOOH, campanha, link
- Cards com métricas principais:
  - Total de cliques
  - IPs únicos
  - Cliques hoje
- Gráficos:
  - Cliques por dia (linha)
  - Cliques por dispositivo (pizza)
  - Cliques por país (barra)
  - Top 10 links (tabela)

### 7.2 Criar/Modificar admin.js

**Funções para Links:**
- `criarLink()`: POST /api/links
- `listarLinks()`: GET /api/links
- `deletarLink(id)`: DELETE /api/links/{id}
- `renderizarLinks()`: Renderizar tabela

**Funções para Analytics:**
- `carregarAnalytics()`: GET /api/analytics
- `aplicarFiltros()`: Aplicar filtros e recarregar
- `renderizarGraficos()`: Usar biblioteca de gráficos (Chart.js ou similar)
- `renderizarMetricas()`: Renderizar cards de métricas

**Biblioteca de gráficos:**
- Usar Chart.js (leve, fácil de integrar)
- Ou usar Recharts (se preferir React, mas não temos React no projeto)
- **Recomendado**: Chart.js via CDN

---

## 🔐 Fase 8: Configurações e Segurança

### 8.1 Configurar CORS
- Adicionar middleware CORS no FastAPI
- Permitir origins do frontend
- Configurar via variável de ambiente (opcional)

### 8.2 Validações
- Validar URLs com Pydantic HttpUrl
- Validar identifier único
- Validar datas nos filtros

---

## 📊 Fase 9: Testes e Validação

### 9.1 Testes Manuais
- Criar link via API
- Acessar /r/{identifier} e verificar tracking
- Verificar analytics
- Testar integração com QR codes

### 9.2 Validações
- Verificar criação de tabelas
- Verificar relacionamentos (cascade delete)
- Verificar índices
- Verificar parse de User-Agent
- Verificar GeoIP (com e sem falha)

---

## 🚀 Ordem de Implementação

1. ✅ Fase 1: Dependências
2. ✅ Fase 2: Models
3. ✅ Fase 3: Schemas
4. ✅ Fase 4: Serviços
5. ✅ Fase 5: Endpoints API
6. ✅ Fase 6: Integração QR Codes
7. ✅ Fase 7: Frontend Admin
8. ✅ Fase 8: Configurações
9. ✅ Fase 9: Testes

---

## 📝 Notas de Implementação

### GeoIP - Serviço Gratuito
- **ipapi.co**: 1000 requisições/dia grátis
- Endpoint: `https://ipapi.co/{ip}/json/`
- Campos: country_name, city
- Rate limit: 1000/dia (suficiente para começar)

### Performance
- SQLite suporta bem até ~100k cliques
- Índices em link_id e clicked_at são essenciais
- Analytics calculados em memória (adequado para volumes médios)

### Privacidade
- IPs são armazenados (considerar LGPD)
- GeoIP é opcional (pode falhar silenciosamente)
- Considerar política de retenção de dados

---

## ✅ Checklist Final

- [ ] Dependências instaladas
- [ ] Models criados e migrados
- [ ] Schemas criados
- [ ] Serviços implementados
- [ ] Endpoints API funcionando
- [ ] Integração QR codes funcionando
- [ ] Frontend admin com abas
- [ ] Analytics funcionando
- [ ] Testes realizados
- [ ] Documentação atualizada

---

**Versão**: 1.0  
**Data**: 2024  
**Status**: Aguardando implementação
