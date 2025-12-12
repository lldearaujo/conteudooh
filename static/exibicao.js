
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
    // Limpar conteúdo anterior e usar textContent para evitar problemas com HTML
    tituloElement.textContent = '';
    tituloElement.textContent = titulo;
    // Garantir que não há estilos inline problemáticos que possam causar renderização incorreta
    tituloElement.style.color = '#fff';
    tituloElement.style.background = 'transparent';
    tituloElement.style.backgroundColor = 'transparent';
    tituloElement.style.textShadow = '2px 2px 8px rgba(0, 0, 0, 1)';
    // Limpar qualquer estilo problemático
    tituloElement.style.fontSize = '';
    tituloElement.style.lineHeight = '';
    tituloElement.style.outline = 'none';
    tituloElement.style.border = 'none';
    
    // Ajustar tamanho da fonte para caber todo o texto na imagem
    ajustarTamanhoFonte(tituloElement);
    
    // Data
    const dataElement = document.getElementById('noticia-data');
    if (noticia.data_publicacao) {
        const data = new Date(noticia.data_publicacao);
        const dataFormatada = data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        // Limpar qualquer conteúdo anterior e garantir renderização correta
        dataElement.textContent = '';
        dataElement.textContent = dataFormatada;
        // Garantir estilos corretos
        dataElement.style.color = 'rgba(255, 255, 255, 0.9)';
        dataElement.style.background = 'transparent';
        dataElement.style.textShadow = '1px 1px 3px rgba(0, 0, 0, 1)';
    } else {
        dataElement.textContent = '';
    }
    
    // Configurar logo da Rádio Centro
    const footerLogo = document.querySelector('.footer-logo');
    if (footerLogo) {
        footerLogo.onerror = function() {
            console.error('Erro ao carregar logo da Rádio Centro');
            this.style.display = 'none';
        };
        footerLogo.onload = function() {
            this.style.display = 'block';
        };
    }
    
    // Configurar QR code no footer inferior
    const qrcodeImage = document.getElementById('qrcode-image-bottom');
    const qrcodeContainer = document.getElementById('qrcode-container-bottom');
    if (noticia.id && noticia.url) {
        // Detectar se é uma tela muito pequena para usar QR code simplificado
        const larguraTela = window.innerWidth || document.documentElement.clientWidth || screen.width;
        const alturaTela = window.innerHeight || document.documentElement.clientHeight || screen.height;
        const telaMuitoPequena = (larguraTela <= 180) || (larguraTela <= 160 && alturaTela <= 240) || (larguraTela <= 140 && alturaTela <= 200);
        
        // Garantir que a URL seja absoluta - usar caminho relativo que funciona em qualquer ambiente
        const tamanhoParam = telaMuitoPequena ? 'pequeno' : 'normal';
        const qrcodeUrl = `/api/noticias/${noticia.id}/qrcode?tamanho=${tamanhoParam}`;
        
        console.log('Tentando carregar QR code:', qrcodeUrl, 'Notícia ID:', noticia.id, 'Tela pequena:', telaMuitoPequena);
        
        // Limpar handlers anteriores
        qrcodeImage.onerror = null;
        qrcodeImage.onload = null;
        
        // Configurar handlers de erro e sucesso
        qrcodeImage.onerror = function(e) {
            console.error('Erro ao carregar QR code:', qrcodeUrl);
            console.error('Detalhes do erro:', e);
            console.error('Status da imagem:', this.complete, this.naturalWidth, this.naturalHeight);
            this.style.display = 'none';
            if (qrcodeContainer) {
                qrcodeContainer.style.display = 'none';
            }
            // Tentar carregar novamente após 2 segundos
            setTimeout(() => {
                console.log('Tentando recarregar QR code...');
                this.src = qrcodeUrl + '&t=' + Date.now();
            }, 2000);
        };
        
        qrcodeImage.onload = function() {
            console.log('QR code carregado com sucesso:', qrcodeUrl);
            this.style.display = 'block';
            if (qrcodeContainer) {
                qrcodeContainer.style.display = 'flex';
                qrcodeContainer.style.visibility = 'visible';
            }
        };
        
        // Forçar exibição antes de carregar
        if (qrcodeContainer) {
            qrcodeContainer.style.display = 'flex';
            qrcodeContainer.style.visibility = 'visible';
        }
        qrcodeImage.style.display = 'block';
        qrcodeImage.style.visibility = 'visible';
        
        // Adicionar timestamp para evitar cache
        qrcodeImage.src = qrcodeUrl + '&t=' + Date.now();
    } else {
        console.warn('QR code não pode ser gerado - ID ou URL ausente:', { id: noticia.id, url: noticia.url });
        if (qrcodeImage) qrcodeImage.style.display = 'none';
        if (qrcodeContainer) qrcodeContainer.style.display = 'none';
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
            
            // Para telas muito pequenas (128x192px, 160x240px), usar limites mais restritivos
            const telaMuitoPequena = larguraTela <= 180 || (larguraTela <= 160 && alturaTela <= 240) || (larguraTela <= 140 && alturaTela <= 200);
            
            // Declarar tamanhoMinimo e tamanhoMaximo no escopo correto
            let tamanhoMinimo;
            let tamanhoMaximo;
            
            if (telaMuitoPequena) {
                // Limites proporcionais para telas 128x192px (mantendo proporção das outras telas)
                tamanhoMinimo = 7; // Mínimo proporcional
                tamanhoMaximo = 12; // Máximo proporcional
                
                // Forçar tamanho menor para telas muito pequenas
                if (tamanhoFonte > tamanhoMaximo) {
                    tamanhoFonte = tamanhoMaximo;
                }
                tamanhoFonte = Math.max(tamanhoMinimo, Math.min(tamanhoFonte, tamanhoMaximo));
                lineHeight = 1.05; // Line-height mais compacto
            } else {
                // Usar valores do CSS como base para telas maiores
                tamanhoMinimo = Math.max(12, tamanhoFonte * 0.5); // Mínimo razoável (50% do CSS)
                tamanhoMaximo = 42; // Máximo do CSS
                
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
