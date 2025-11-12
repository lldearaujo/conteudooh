
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
    
    // Preencher dados da notícia - título na imagem
    const titulo = noticia.titulo || 'Sem título';
    const tituloElement = document.getElementById('noticia-titulo');
    tituloElement.textContent = titulo;
    
    // Ajustar tamanho da fonte para caber todo o texto na imagem
    ajustarTamanhoFonte(tituloElement);
    
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
    
    // Configurar QR code no footer inferior
    const qrcodeImage = document.getElementById('qrcode-image-bottom');
    const qrcodeContainer = document.getElementById('qrcode-container-bottom');
    if (noticia.id && noticia.url) {
        // Garantir que a URL seja absoluta se necessário
        const qrcodeUrl = `/api/noticias/${noticia.id}/qrcode`;
        
        // Configurar handlers de erro e sucesso
        qrcodeImage.onerror = function() {
            console.error('Erro ao carregar QR code:', qrcodeUrl);
            qrcodeImage.style.display = 'none';
            qrcodeContainer.style.display = 'none';
        };
        
        qrcodeImage.onload = function() {
            qrcodeImage.style.display = 'block';
            qrcodeContainer.style.display = 'flex';
            qrcodeContainer.style.visibility = 'visible';
        };
        
        // Forçar exibição antes de carregar
        qrcodeContainer.style.display = 'flex';
        qrcodeContainer.style.visibility = 'visible';
        qrcodeImage.style.display = 'block';
        qrcodeImage.style.visibility = 'visible';
        
        // Definir src após configurar os handlers
        qrcodeImage.src = qrcodeUrl;
    } else {
        qrcodeImage.style.display = 'none';
        qrcodeContainer.style.display = 'none';
    }
    
    // Mostrar display com animação
    display.classList.remove('hidden');
    
    // Ajustar tamanho da fonte após o layout ser calculado
    setTimeout(() => {
        ajustarTamanhoFonte(tituloElement);
    }, 300);
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

// Função para ajustar o tamanho da fonte do título para caber todo o texto
function ajustarTamanhoFonte(elemento) {
    const container = elemento.closest('.noticia-conteudo-imagem') || elemento.closest('.noticia-conteudo-container');
    if (!container) return;
    
    // Aguardar múltiplos frames para garantir que o layout está totalmente calculado
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // Resetar estilos inline para começar do CSS base
            elemento.style.fontSize = '';
            elemento.style.lineHeight = '';
            elemento.style.maxHeight = '';
            elemento.style.overflow = '';
            
            // Forçar reflow
            elemento.offsetHeight;
            
            // Obter dimensões reais do container
            const containerRect = container.getBoundingClientRect();
            const containerHeight = containerRect.height;
            const containerWidth = containerRect.width;
            
            // Verificar se está na imagem ou no container de texto
            const estaNaImagem = container.classList.contains('noticia-conteudo-imagem');
            
            // Obter dimensões dos outros elementos
            const dataContainer = container.querySelector('.noticia-data-container');
            
            const dataRect = dataContainer ? dataContainer.getBoundingClientRect() : null;
            const dataHeight = dataRect ? dataRect.height : 0;
            
            // Calcular altura disponível
            const estiloContainer = window.getComputedStyle(container);
            const paddingTop = parseFloat(estiloContainer.paddingTop) || (estaNaImagem ? 12 : 16);
            const paddingBottom = parseFloat(estiloContainer.paddingBottom) || (estaNaImagem ? 12 : 16);
            
            // Margem de segurança
            const margemSeguranca = 4;
            let alturaDisponivel;
            
            if (estaNaImagem) {
                // Se está na imagem, usar altura do container menos data e padding
                alturaDisponivel = containerHeight - dataHeight - paddingTop - paddingBottom - margemSeguranca;
            } else {
                // Se está no container de texto, considerar footer
                const footerContainer = document.querySelector('.footer-integrado');
                const footerHeight = footerContainer ? footerContainer.getBoundingClientRect().height : 0;
                const paddingTopFooter = footerContainer ? parseFloat(window.getComputedStyle(footerContainer).paddingTop) || 8 : 0;
                alturaDisponivel = containerHeight - dataHeight - footerHeight - paddingTop - paddingBottom - paddingTopFooter - margemSeguranca;
            }
            
            // Largura disponível
            const paddingLeft = parseFloat(estiloContainer.paddingLeft) || 16;
            const paddingRight = parseFloat(estiloContainer.paddingRight) || 16;
            const larguraDisponivel = containerWidth - paddingLeft - paddingRight;
            
            // Tamanhos mínimo e máximo baseados no tamanho da tela e CSS
            const larguraTela = window.innerWidth;
            const alturaTela = window.innerHeight;
            
            // Obter tamanho inicial do CSS (que já tem clamp responsivo)
            const estiloInicial = window.getComputedStyle(elemento);
            let tamanhoFonte = parseFloat(estiloInicial.fontSize) || 16;
            let lineHeight = parseFloat(estiloInicial.lineHeight) || 1.2;
            
            // Para telas muito pequenas (128x192px), usar limites mais restritivos
            const telaMuitoPequena = larguraTela <= 140 && alturaTela <= 200;
            
            if (telaMuitoPequena) {
                // Limites proporcionais para telas 128x192px (mantendo proporção das outras telas)
                const tamanhoMinimo = 7; // Mínimo proporcional
                const tamanhoMaximo = 12; // Máximo proporcional
                
                // Forçar tamanho menor para telas muito pequenas
                if (tamanhoFonte > tamanhoMaximo) {
                    tamanhoFonte = tamanhoMaximo;
                }
                tamanhoFonte = Math.max(tamanhoMinimo, Math.min(tamanhoFonte, tamanhoMaximo));
                lineHeight = 1.05; // Line-height mais compacto
            } else {
                // Usar valores do CSS como base para telas maiores
                const tamanhoMinimo = Math.max(12, tamanhoFonte * 0.5); // Mínimo razoável (50% do CSS)
                const tamanhoMaximo = 42; // Máximo do CSS
                
                // Não reduzir o tamanho se o CSS já definiu um valor bom
                if (tamanhoFonte > tamanhoMaximo) {
                    tamanhoFonte = tamanhoMaximo;
                }
                
                // Começar com o tamanho do CSS, não reduzir prematuramente
                tamanhoFonte = Math.max(tamanhoMinimo, Math.min(tamanhoFonte, tamanhoMaximo));
            }
            
            // Testar diferentes tamanhos até encontrar o que cabe
            let tentativas = 0;
            const maxTentativas = 200;
            let melhorTamanho = tamanhoMinimo;
            let encontrouTamanho = false;
            
            // Primeiro, tentar encontrar um tamanho que caiba
            while (tentativas < maxTentativas && tamanhoFonte >= tamanhoMinimo) {
                elemento.style.fontSize = `${tamanhoFonte}px`;
                elemento.style.lineHeight = `${lineHeight}`;
                elemento.style.maxHeight = `${alturaDisponivel}px`;
                elemento.style.overflow = 'visible';
                
                // Forçar reflow múltiplas vezes
                elemento.offsetHeight;
                elemento.scrollHeight;
                elemento.offsetHeight;
                
                // Obter dimensões reais do texto
                const alturaReal = elemento.scrollHeight;
                const larguraReal = elemento.scrollWidth;
                
                // Verificar se cabe com margem de segurança
                if (alturaReal <= alturaDisponivel && larguraReal <= larguraDisponivel) {
                    melhorTamanho = tamanhoFonte;
                    encontrouTamanho = true;
                    
                    // Tentar aumentar um pouco mais
                    const incremento = telaMuitoPequena ? 0.2 : 0.5;
                    let tamanhoTeste = tamanhoFonte + incremento;
                    if (tamanhoTeste <= tamanhoMaximo) {
                        elemento.style.fontSize = `${tamanhoTeste}px`;
                        elemento.offsetHeight;
                        elemento.scrollHeight;
                        elemento.offsetHeight;
                        
                        if (elemento.scrollHeight <= alturaDisponivel && elemento.scrollWidth <= larguraDisponivel) {
                            melhorTamanho = tamanhoTeste;
                            tamanhoFonte = tamanhoTeste;
                        }
                    }
                    break;
                }
                
                // Reduzir tamanho gradualmente, mas respeitando o mínimo
                const reducao = telaMuitoPequena ? 0.2 : 0.5;
                tamanhoFonte -= reducao;
                lineHeight = telaMuitoPequena ? Math.max(1.0, lineHeight - 0.005) : Math.max(1.1, lineHeight - 0.01);
                tentativas++;
                
                // Se chegou no mínimo, parar
                if (tamanhoFonte < tamanhoMinimo) {
                    break;
                }
            }
            
            // Aplicar o melhor tamanho encontrado
            if (encontrouTamanho) {
                elemento.style.fontSize = `${melhorTamanho}px`;
                elemento.style.lineHeight = `${lineHeight}`;
            } else {
                // Se não encontrou, usar tamanho mínimo mas respeitar o CSS
                const tamanhoFinal = telaMuitoPequena ? Math.max(tamanhoMinimo, 7) : Math.max(tamanhoMinimo, 12);
                elemento.style.fontSize = `${tamanhoFinal}px`;
                elemento.style.lineHeight = telaMuitoPequena ? '1.05' : '1.1';
            }
            
            elemento.style.maxHeight = `${alturaDisponivel}px`;
            elemento.style.overflow = 'hidden';
            
            // Verificação final - garantir que não há texto cortado
            setTimeout(() => {
                const alturaFinal = elemento.scrollHeight;
                const larguraFinal = elemento.scrollWidth;
                const alturaAtual = elemento.clientHeight;
                const larguraAtual = elemento.clientWidth;
                
                // Se ainda está cortando, reduzir mais, mas respeitando o mínimo
                if (alturaFinal > alturaAtual || larguraFinal > larguraAtual) {
                    let tamanhoAtual = parseFloat(elemento.style.fontSize) || tamanhoMinimo;
                    const minimoFinal = telaMuitoPequena ? Math.max(tamanhoMinimo, 7) : Math.max(tamanhoMinimo, 12);
                    const reducaoFinal = telaMuitoPequena ? 0.2 : 0.3;
                    while (tamanhoAtual > minimoFinal && (alturaFinal > alturaAtual || larguraFinal > larguraAtual)) {
                        tamanhoAtual -= reducaoFinal;
                        elemento.style.fontSize = `${Math.max(tamanhoAtual, minimoFinal)}px`;
                        elemento.offsetHeight;
                    }
                }
            }, 50);
        });
    });
}

// Ajustar tamanho quando a janela redimensionar
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const tituloElement = document.getElementById('noticia-titulo');
        if (tituloElement && tituloElement.textContent) {
            ajustarTamanhoFonte(tituloElement);
        }
    }, 250);
});

// Iniciar quando a página carregar
document.addEventListener('DOMContentLoaded', inicializar);

// Atualizar página a cada 30 minutos para buscar nova notícia aleatória
setInterval(() => {
    location.reload();
}, 1800000); // 30 minutos
