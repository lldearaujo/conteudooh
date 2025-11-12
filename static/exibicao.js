// Atualizar relógio e data
function atualizarRelogio() {
    const agora = new Date();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    const segundos = String(agora.getSeconds()).padStart(2, '0');
    
    document.getElementById('hora').textContent = `${horas}:${minutos}:${segundos}`;
    
    const opcoesData = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    document.getElementById('data').textContent = agora.toLocaleDateString('pt-BR', opcoesData);
}

// Atualizar a cada segundo
setInterval(atualizarRelogio, 1000);
atualizarRelogio();

// Buscar uma notícia aleatória
async function buscarNoticiaAleatoria() {
    try {
        const response = await fetch('/api/noticias/aleatoria');
        if (!response.ok) {
            throw new Error('Erro ao buscar notícia');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar notícia:', error);
        return null;
    }
}

// Exibir notícia na tela
function exibirNoticia(noticia) {
    const display = document.getElementById('noticia-display');
    const loading = document.getElementById('loading');
    const backgroundImage = document.getElementById('background-image');
    
    // Esconder loading
    loading.classList.add('hidden');
    
    // Configurar imagem de background
    if (noticia.imagem_url) {
        backgroundImage.style.backgroundImage = `url('${noticia.imagem_url}')`;
        backgroundImage.classList.add('fade-in');
    } else {
        // Se não tiver imagem, usar gradiente padrão
        backgroundImage.style.backgroundImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    
    // Preencher dados da notícia
    document.getElementById('noticia-titulo').textContent = noticia.titulo || 'Sem título';
    
    const textoElement = document.getElementById('noticia-texto');
    if (noticia.conteudo && noticia.conteudo.trim()) {
        // Limitar texto para caber na tela sem scroll
        textoElement.textContent = noticia.conteudo.length > 300 
            ? noticia.conteudo.substring(0, 300) + '...' 
            : noticia.conteudo;
    } else {
        textoElement.textContent = 'Conteúdo não disponível.';
    }
    
    // Data
    const dataElement = document.getElementById('noticia-data');
    if (noticia.data_publicacao) {
        const data = new Date(noticia.data_publicacao);
        dataElement.textContent = data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } else {
        dataElement.textContent = '';
    }
    
    // Configurar QR code
    const qrcodeImage = document.getElementById('qrcode-image');
    const qrcodeContainer = document.getElementById('qrcode-container');
    if (noticia.id && noticia.url) {
        qrcodeImage.src = `/api/noticias/${noticia.id}/qrcode`;
        qrcodeImage.style.display = 'block';
        qrcodeContainer.style.display = 'flex';
    } else {
        qrcodeImage.style.display = 'none';
        qrcodeContainer.style.display = 'none';
    }
    
    // Mostrar display com animação
    display.classList.remove('hidden');
}

// Inicializar sistema - busca apenas uma vez
async function inicializar() {
    // Buscar notícia aleatória
    const noticia = await buscarNoticiaAleatoria();
    
    if (noticia) {
        exibirNoticia(noticia);
    } else {
        document.getElementById('loading').querySelector('p').textContent = 
            'Nenhuma notícia disponível no momento. Aguarde a próxima atualização...';
    }
}

// Iniciar quando a página carregar
document.addEventListener('DOMContentLoaded', inicializar);

// Atualizar página a cada 30 minutos para buscar nova notícia aleatória
setInterval(() => {
    location.reload();
}, 1800000); // 30 minutos
