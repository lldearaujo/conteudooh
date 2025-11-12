// Mostrar/ocultar loading
function mostrarLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function ocultarLoading() {
    document.getElementById('loading').classList.add('hidden');
}

// Atualizar notícias do site
async function atualizarNoticias() {
    mostrarLoading();
    try {
        const response = await fetch('/api/noticias/atualizar', {
            method: 'POST'
        });
        const data = await response.json();
        alert(`Sucesso: ${data.mensagem}`);
        location.reload();
    } catch (error) {
        alert('Erro ao atualizar notícias: ' + error.message);
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

