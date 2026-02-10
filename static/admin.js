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
    
    mostrarLoading();
    try {
        const response = await fetch('/api/links', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                identifier,
                destination_url,
                ponto_dooh,
                campanha
            })
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
        const createdDate = link.created_at ? new Date(link.created_at).toLocaleDateString('pt-BR') : 'N/A';
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
                <td>${link.campanha}</td>
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
                maintainAspectRatio: false
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
                maintainAspectRatio: false
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
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
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
