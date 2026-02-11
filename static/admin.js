// Mostrar/ocultar loading
function mostrarLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function ocultarLoading() {
    document.getElementById('loading').classList.add('hidden');
}

// Função para mostrar notificação
function mostrarNotificacao(mensagem, tipo = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${tipo}`;
    notification.textContent = mensagem;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${tipo === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        font-weight: 500;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Atualizar notícias do site
async function atualizarNoticias() {
    mostrarLoading();
    try {
        const response = await fetch('/api/noticias/atualizar', {
            method: 'POST'
        });
        const data = await response.json();
        mostrarNotificacao(data.mensagem || 'Notícias atualizadas com sucesso!', 'success');
        setTimeout(() => location.reload(), 1500);
    } catch (error) {
        mostrarNotificacao('Erro ao atualizar notícias: ' + error.message, 'error');
    } finally {
        ocultarLoading();
    }
}

// Toggle ativar/desativar notícia
async function toggleNoticia(id) {
    mostrarLoading();
    try {
        const response = await fetch(`/api/noticias/${id}/toggle`, {
            method: 'PATCH'
        });
        const data = await response.json();
        
        // Atualizar linha da tabela
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) {
            const statusBadge = row.querySelector('.status-badge');
            const toggleBtn = row.querySelector('.toggle-btn');
            
            if (data.ativa) {
                row.classList.remove('inativa');
                statusBadge.textContent = 'Ativa';
                statusBadge.className = 'status-badge ativa';
                toggleBtn.innerHTML = '👁️';
                toggleBtn.title = 'Desativar';
            } else {
                row.classList.add('inativa');
                statusBadge.textContent = 'Inativa';
                statusBadge.className = 'status-badge inativa';
                toggleBtn.innerHTML = '🚫';
                toggleBtn.title = 'Ativar';
            }
        }
        
        // Atualizar estatísticas
        atualizarEstatisticas();
    } catch (error) {
        alert('Erro ao alterar status da notícia: ' + error.message);
    } finally {
        ocultarLoading();
    }
}

// Deletar notícia
async function deletarNoticia(id) {
    if (!confirm('Tem certeza que deseja deletar esta notícia?')) {
        return;
    }
    
    mostrarLoading();
    try {
        const response = await fetch(`/api/noticias/${id}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        
        // Remover linha da tabela
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) {
            row.remove();
        }
        
        // Atualizar estatísticas
        atualizarEstatisticas();
        
        alert('Notícia deletada com sucesso!');
    } catch (error) {
        alert('Erro ao deletar notícia: ' + error.message);
    } finally {
        ocultarLoading();
    }
}

// Atualizar estatísticas
function atualizarEstatisticas() {
    const totalNoticias = document.querySelectorAll('tbody tr').length;
    const noticiasAtivas = document.querySelectorAll('tbody tr:not(.inativa)').length;
    const noticiasInativas = document.querySelectorAll('tbody tr.inativa').length;
    
    document.getElementById('total-noticias').textContent = totalNoticias;
    document.getElementById('noticias-ativas').textContent = noticiasAtivas;
    document.getElementById('noticias-inativas').textContent = noticiasInativas;
}

// Auto-refresh a cada 2 minutos
setInterval(() => {
    location.reload();
}, 120000);

// ============================================
// SISTEMA DE ABAS
// ============================================

function mostrarAba(aba) {
    // Esconder todas as abas
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remover active de todos os botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar aba selecionada
    document.getElementById(`aba-${aba}`).classList.add('active');
    
    // Ativar botão correspondente
    event.target.classList.add('active');
    
    // Carregar dados da aba se necessário
    if (aba === 'links') {
        carregarLinks();
    } else if (aba === 'analytics') {
        carregarAnalytics();
    }
}

// ============================================
// GESTÃO DE LINKS
// ============================================

let linksCache = [];

async function criarLink(event) {
    event.preventDefault();
    
    const identifier = document.getElementById('link-identifier').value.trim();
    const destination_url = document.getElementById('link-destination-url').value.trim();
    const ponto_dooh = document.getElementById('link-ponto-dooh').value.trim();
    const campanha = document.getElementById('link-campanha').value.trim();
    
    // Novos campos opcionais
    const qr_code_id = document.getElementById('link-qr-code-id').value.trim() || null;
    const tipo_midia = document.getElementById('link-tipo-midia').value.trim() || null;
    const local_especifico = document.getElementById('link-local-especifico').value.trim() || null;
    const peca_criativa = document.getElementById('link-peca-criativa').value.trim() || null;
    const utm_source = document.getElementById('link-utm-source').value.trim() || null;
    const utm_medium = document.getElementById('link-utm-medium').value.trim() || null;
    const utm_campaign = document.getElementById('link-utm-campaign').value.trim() || null;
    const utm_content = document.getElementById('link-utm-content').value.trim() || null;
    const utm_term = document.getElementById('link-utm-term').value.trim() || null;
    
    mostrarLoading();
    try {
        const body = {
            identifier,
            destination_url,
            ponto_dooh,
            campanha
        };
        
        // Adicionar campos opcionais apenas se preenchidos
        if (qr_code_id) body.qr_code_id = qr_code_id;
        if (tipo_midia) body.tipo_midia = tipo_midia;
        if (local_especifico) body.local_especifico = local_especifico;
        if (peca_criativa) body.peca_criativa = peca_criativa;
        if (utm_source) body.utm_source = utm_source;
        if (utm_medium) body.utm_medium = utm_medium;
        if (utm_campaign) body.utm_campaign = utm_campaign;
        if (utm_content) body.utm_content = utm_content;
        if (utm_term) body.utm_term = utm_term;
        
        const response = await fetch('/api/links', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao criar link');
        }
        
        const data = await response.json();
        alert('Link criado com sucesso!');
        
        // Limpar formulário
        document.getElementById('form-criar-link').reset();
        
        // Recarregar lista
        carregarLinks();
    } catch (error) {
        alert('Erro ao criar link: ' + error.message);
    } finally {
        ocultarLoading();
    }
}

async function carregarLinks() {
    mostrarLoading();
    try {
        const response = await fetch('/api/links?limit=1000');
        const data = await response.json();
        
        linksCache = data.links;
        renderizarLinks(linksCache);
    } catch (error) {
        console.error('Erro ao carregar links:', error);
        alert('Erro ao carregar links: ' + error.message);
    } finally {
        ocultarLoading();
    }
}

function renderizarLinks(links) {
    const tbody = document.getElementById('links-tbody');
    
    if (links.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Nenhum link encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = links.map(link => {
        // Formatar data - backend já envia apenas a data (YYYY-MM-DD) no timezone correto
        let createdDate = 'N/A';
        if (link.created_at) {
            try {
                // Backend envia apenas a data no formato YYYY-MM-DD (sem hora/timezone)
                // Extrair e formatar diretamente para evitar conversões de timezone
                let dateStr = link.created_at;
                
                // Se contém 'T' ou timezone, pegar apenas a parte da data
                if (dateStr.includes('T')) {
                    dateStr = dateStr.split('T')[0];
                }
                // Remover timezone offset se existir
                if (dateStr.includes('+')) {
                    dateStr = dateStr.split('+')[0];
                } else if (dateStr.includes('-') && dateStr.lastIndexOf('-') > 4) {
                    // Se tem mais de um '-', pode ter timezone (ex: -03:00)
                    const parts = dateStr.split('-');
                    if (parts.length > 3) {
                        dateStr = parts.slice(0, 3).join('-');
                    }
                }
                
                // Formatar para DD/MM/YYYY
                if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const [ano, mes, dia] = dateStr.split('-');
                    createdDate = `${dia}/${mes}/${ano}`;
                } else {
                    createdDate = 'N/A';
                }
            } catch (e) {
                console.error('Erro ao formatar data:', e, link.created_at);
                createdDate = 'N/A';
            }
        }
        const trackingUrl = `${window.location.origin}/r/${link.identifier}`;
        
        return `
            <tr data-id="${link.id}">
                <td>${link.id}</td>
                <td><code>${link.identifier}</code></td>
                <td class="url-cell">
                    <a href="${link.destination_url}" target="_blank" title="${link.destination_url}">
                        ${link.destination_url.length > 40 ? link.destination_url.substring(0, 40) + '...' : link.destination_url}
                    </a>
                </td>
                <td>${link.ponto_dooh}</td>
                <td>
                    ${link.campanha}
                    ${link.tipo_midia ? `<br><small style="color: var(--text-secondary); font-size: 0.875rem;">📺 ${link.tipo_midia}</small>` : ''}
                    ${link.local_especifico ? `<br><small style="color: var(--text-secondary); font-size: 0.875rem;">📍 ${link.local_especifico}</small>` : ''}
                </td>
                <td><strong>${link.total_clicks || 0}</strong></td>
                <td>${createdDate}</td>
                <td class="acoes-cell">
                    <button class="btn-icon copy-btn" onclick="copiarLinkRastreavel('${trackingUrl}', this)" title="Copiar link rastreável">📋</button>
                    <a href="${trackingUrl}" target="_blank" class="btn-icon" title="Abrir link rastreável">🔗</a>
                    <button class="btn-icon delete-btn" onclick="deletarLink(${link.id})" title="Deletar">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function filtrarLinks() {
    const pontoFilter = document.getElementById('filter-ponto-dooh').value.toLowerCase();
    const campanhaFilter = document.getElementById('filter-campanha').value.toLowerCase();
    
    const filtered = linksCache.filter(link => {
        const matchPonto = !pontoFilter || link.ponto_dooh.toLowerCase().includes(pontoFilter);
        const matchCampanha = !campanhaFilter || link.campanha.toLowerCase().includes(campanhaFilter);
        return matchPonto && matchCampanha;
    });
    
    renderizarLinks(filtered);
}

async function deletarLink(id) {
    if (!confirm('Tem certeza que deseja deletar este link? Todos os cliques associados também serão deletados.')) {
        return;
    }
    
    mostrarLoading();
    try {
        const response = await fetch(`/api/links/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Erro ao deletar link');
        }
        
        alert('Link deletado com sucesso!');
        carregarLinks();
    } catch (error) {
        alert('Erro ao deletar link: ' + error.message);
    } finally {
        ocultarLoading();
    }
}

// ============================================
// ANALYTICS
// ============================================

let charts = {};

async function carregarAnalytics() {
    mostrarLoading();
    try {
        const startDate = document.getElementById('filter-start-date')?.value || '';
        const endDate = document.getElementById('filter-end-date')?.value || '';
        const pontoDooh = document.getElementById('filter-analytics-ponto')?.value || '';
        const campanha = document.getElementById('filter-analytics-campanha')?.value || '';
        
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (pontoDooh) params.append('ponto_dooh', pontoDooh);
        if (campanha) params.append('campanha', campanha);
        
        const response = await fetch(`/api/analytics?${params.toString()}`);
        const data = await response.json();
        
        // Atualizar métricas
        document.getElementById('metric-total-clicks').textContent = data.total_clicks || 0;
        document.getElementById('metric-unique-ips').textContent = data.unique_ips || 0;
        
        // Cliques hoje
        const hoje = new Date().toISOString().split('T')[0];
        const clicksHoje = data.clicks_by_day[hoje] || 0;
        document.getElementById('metric-clicks-hoje').textContent = clicksHoje;
        
        // Renderizar gráficos
        renderizarGraficos(data);
        
        // Renderizar top links
        renderizarTopLinks(data.top_links);
        
        // Carregar métricas de conversão
        carregarMetricasConversao();
    } catch (error) {
        console.error('Erro ao carregar analytics:', error);
        alert('Erro ao carregar analytics: ' + error.message);
    } finally {
        ocultarLoading();
    }
}

function renderizarGraficos(data) {
    // Gráfico: Cliques por Dia
    const ctxDay = document.getElementById('chart-clicks-by-day');
    if (ctxDay) {
        if (charts.clicksByDay) {
            charts.clicksByDay.destroy();
        }
        
        const days = Object.keys(data.clicks_by_day || {}).sort();
        const clicks = days.map(day => data.clicks_by_day[day]);
        
        charts.clicksByDay = new Chart(ctxDay, {
            type: 'line',
            data: {
                labels: days,
                datasets: [{
                    label: 'Cliques',
                    data: clicks,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10,
                        left: 10,
                        right: 10
                    }
                }
            }
        });
    }
    
    // Gráfico: Cliques por Dispositivo
    const ctxDevice = document.getElementById('chart-clicks-by-device');
    if (ctxDevice) {
        if (charts.clicksByDevice) {
            charts.clicksByDevice.destroy();
        }
        
        const devices = Object.keys(data.clicks_by_device || {});
        const deviceClicks = devices.map(device => data.clicks_by_device[device]);
        
        charts.clicksByDevice = new Chart(ctxDevice, {
            type: 'doughnut',
            data: {
                labels: devices,
                datasets: [{
                    data: deviceClicks,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.5,
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10,
                        left: 10,
                        right: 10
                    }
                }
            }
        });
    }
    
    // Gráfico: Cliques por País
    const ctxCountry = document.getElementById('chart-clicks-by-country');
    if (ctxCountry) {
        if (charts.clicksByCountry) {
            charts.clicksByCountry.destroy();
        }
        
        const countries = Object.keys(data.clicks_by_country || {}).slice(0, 10); // Top 10
        const countryClicks = countries.map(country => data.clicks_by_country[country]);
        
        charts.clicksByCountry = new Chart(ctxCountry, {
            type: 'bar',
            data: {
                labels: countries,
                datasets: [{
                    label: 'Cliques',
                    data: countryClicks,
                    backgroundColor: 'rgba(54, 162, 235, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10,
                        left: 10,
                        right: 10
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

async function carregarMetricasConversao() {
    try {
        const startDate = document.getElementById('filter-start-date')?.value || '';
        const endDate = document.getElementById('filter-end-date')?.value || '';
        
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        const response = await fetch(`/api/analytics/conversions?${params.toString()}`);
        const data = await response.json();
        
        // Atualizar métricas de conversão
        document.getElementById('metric-conversion-rate').textContent = `${data.conversion_rate || 0}%`;
        document.getElementById('metric-total-conversions').textContent = data.total_conversions || 0;
        document.getElementById('metric-avg-time-on-page').textContent = `${Math.round(data.average_time_on_page || 0)}s`;
        
        // Renderizar gráficos de conversão
        renderizarGraficosConversao(data);
    } catch (error) {
        console.error('Erro ao carregar métricas de conversão:', error);
    }
}

function renderizarGraficosConversao(data) {
    // Gráfico: Eventos de Conversão por Tipo
    const ctxEvents = document.getElementById('chart-conversion-events');
    if (ctxEvents) {
        if (charts['conversion-events']) {
            charts['conversion-events'].destroy();
        }
        
        const eventTypes = Object.keys(data.events_by_type || {});
        const eventCounts = Object.values(data.events_by_type || {});
        
        charts['conversion-events'] = new Chart(ctxEvents, {
            type: 'bar',
            data: {
                labels: eventTypes,
                datasets: [{
                    label: 'Eventos',
                    data: eventCounts,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10,
                        left: 10,
                        right: 10
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Gráfico: Scroll Depth
    const ctxScroll = document.getElementById('chart-scroll-depth');
    if (ctxScroll) {
        if (charts['scroll-depth']) {
            charts['scroll-depth'].destroy();
        }
        
        const scrollStats = data.scroll_depth_stats || {};
        const depths = ['25', '50', '75', '100'];
        const counts = depths.map(d => scrollStats[d] || 0);
        
        charts['scroll-depth'] = new Chart(ctxScroll, {
            type: 'doughnut',
            data: {
                labels: depths.map(d => `${d}%`),
                datasets: [{
                    label: 'Scroll Depth',
                    data: counts,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.5,
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10,
                        left: 10,
                        right: 10
                    }
                }
            }
        });
    }
}

function renderizarTopLinks(topLinks) {
    const tbody = document.getElementById('top-links-tbody');
    
    if (!topLinks || topLinks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum dado disponível</td></tr>';
        return;
    }
    
    tbody.innerHTML = topLinks.map((link, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><code>${link.identifier}</code></td>
            <td>${link.ponto_dooh}</td>
            <td>${link.campanha}</td>
            <td><strong>${link.total_clicks}</strong></td>
            <td>${link.unique_ips}</td>
        </tr>
    `).join('');
}


// Copiar link rastreável para área de transferência
async function copiarLinkRastreavel(url, button) {
    try {
        // Usar Clipboard API moderna
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(url);
        } else {
            // Fallback para navegadores mais antigos
            const textArea = document.createElement('textarea');
            textArea.value = url;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            textArea.remove();
        }
        
        // Feedback visual
        const originalHTML = button.innerHTML;
        button.innerHTML = '✓';
        button.style.color = 'var(--success-color)';
        button.title = 'Link copiado!';
        
        mostrarNotificacao('Link rastreável copiado para a área de transferência!', 'success');
        
        // Restaurar após 2 segundos
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.color = '';
            button.title = 'Copiar link rastreável';
        }, 2000);
    } catch (error) {
        console.error('Erro ao copiar link:', error);
        mostrarNotificacao('Erro ao copiar link: ' + error.message, 'error');
    }
}

// Carregar links ao carregar página (se estiver na aba links)
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se estamos na aba links
    const abaLinks = document.getElementById('aba-links');
    if (abaLinks && abaLinks.classList.contains('active')) {
        carregarLinks();
    }
    
    // Verificar se estamos na aba analytics
    const abaAnalytics = document.getElementById('aba-analytics');
    if (abaAnalytics && abaAnalytics.classList.contains('active')) {
        carregarAnalytics();
    }
});
