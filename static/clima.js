/**
 * Sistema de Clima - JavaScript
 * Gerencia a exibição de dados meteorológicos
 */

// Função para obter caminho da imagem PNG baseado no código do clima
function obterIconeClima(codigoClima) {
    // Tratar valores null, undefined ou inválidos
    if (codigoClima === null || codigoClima === undefined || isNaN(codigoClima)) {
        console.warn('Código de clima inválido:', codigoClima);
        return '/icones/parcialmente%20nublado.png'; // Fallback padrão
    }
    
    // Converter para número inteiro
    const codigo = parseInt(codigoClima, 10);
    
    // Mapeamento de códigos WMO para arquivos PNG
    const icones = {
        0: 'Ensolarado.png',                    // Céu limpo
        1: 'parcialmente nublado.png',          // Principalmente limpo
        2: 'parcialmente nublado.png',           // Parcialmente nublado
        3: 'Céu Encoberto.png',                  // Nublado
        45: 'Céu Encoberto.png',                 // Nevoeiro
        48: 'Céu Encoberto.png',                 // Nevoeiro com geada
        51: 'chuva.png',                         // Garoa leve
        53: 'chuva.png',                         // Garoa moderada
        55: 'chuva.png',                         // Garoa densa
        56: 'chuva.png',                         // Garoa congelante leve
        57: 'chuva.png',                         // Garoa congelante densa
        61: 'chuva.png',                         // Chuva leve
        63: 'chuva.png',                         // Chuva moderada
        65: 'chuva.png',                         // Chuva forte
        66: 'chuva.png',                         // Chuva congelante leve
        67: 'chuva.png',                         // Chuva congelante forte
        71: 'chuva.png',                         // Queda de neve leve (fallback)
        73: 'chuva.png',                         // Queda de neve moderada (fallback)
        75: 'chuva.png',                         // Queda de neve forte (fallback)
        77: 'chuva.png',                         // Grãos de neve (fallback)
        80: 'chuva_com_trovoadas.png',           // Pancadas de chuva leve
        81: 'chuva_com_trovoadas.png',           // Pancadas de chuva moderada
        82: 'chuva_com_trovoadas.png',           // Pancadas de chuva forte
        85: 'chuva.png',                         // Pancadas de neve leve (fallback)
        86: 'chuva.png',                         // Pancadas de neve forte (fallback)
        95: 'Tempestade.png',                    // Trovoada
        96: 'chuva_com_trovoadas.png',           // Trovoada com granizo leve
        99: 'Tempestade.png'                     // Trovoada com granizo forte
    };
    
    const nomeArquivo = icones[codigo];
    if (!nomeArquivo) {
        console.warn('Código de clima não mapeado:', codigo);
        return '/icones/parcialmente%20nublado.png'; // Fallback padrão
    }
    
    // Codificar espaços e caracteres especiais na URL
    const nomeArquivoCodificado = encodeURIComponent(nomeArquivo);
    return `/icones/${nomeArquivoCodificado}`;
}

// Buscar dados meteorológicos da API
async function buscarDadosClima() {
    try {
        // Ler os parâmetros da URL da página (ex: /clima?cidade=Sousa&estado=PB)
        const urlParams = new URLSearchParams(window.location.search);
        const cidade = urlParams.get('cidade');
        const estado = urlParams.get('estado') || urlParams.get('uf');

        let url = '/api/clima';
        const query = [];
        if (cidade) {
            query.push(`cidade=${encodeURIComponent(cidade)}`);
        }
        if (estado) {
            query.push(`estado=${encodeURIComponent(estado)}`);
        }
        if (query.length > 0) {
            url += `?${query.join('&')}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar dados climáticos:', error);
        throw error;
    }
}

// Formatar dia da semana abreviado (3 letras)
function formatarDiaSemana(diaCompleto) {
    const dias = {
        'Segunda': 'SEG',
        'Terça': 'TER',
        'Quarta': 'QUA',
        'Quinta': 'QUI',
        'Sexta': 'SEX',
        'Sábado': 'SAB',
        'Domingo': 'DOM'
    };
    return dias[diaCompleto] || (diaCompleto ? diaCompleto.substring(0, 3).toUpperCase() : '---');
}

// Formatar data completa em português
function formatarDataCompleta() {
    const hoje = new Date();
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const diaSemana = diasSemana[hoje.getDay()];
    const dia = hoje.getDate();
    const mes = meses[hoje.getMonth()];
    return `${diaSemana}, ${dia} de ${mes}`;
}

// Exibir dados meteorológicos na tela (atualiza sem esconder)
function exibirClima(dados) {
    const loading = document.getElementById('loading');
    const erroScreen = document.getElementById('erro-screen');
    
    // Esconder loading e erro (se ainda estiverem visíveis)
    if (loading) loading.classList.add('hidden');
    if (erroScreen) erroScreen.classList.add('hidden');
    
    if (!dados || !dados.atual) {
        console.warn('Dados meteorológicos inválidos - mantendo UI atual');
        return; // Não quebrar a UI se dados estiverem inválidos
    }
    
    // Preencher dados atuais
    const atual = dados.atual;
    
    // Atualizar nome da cidade (priorizar backend, mas manter URL se não vier)
    const cidadeElement = document.getElementById('clima-cidade');
    if (cidadeElement && dados.localizacao && dados.localizacao.nome) {
        cidadeElement.textContent = dados.localizacao.nome.toUpperCase();
    }

    // Temperatura (sempre com sinal +)
    const tempEl = document.getElementById('temperatura-atual');
    if (tempEl) {
        const temp = atual.temperatura !== null ? Math.round(atual.temperatura) : '--';
        tempEl.textContent = temp;
    }
    
    // Ícone (usar imagem PNG)
    const iconeEl = document.getElementById('icone-clima');
    if (iconeEl) {
        // Tentar obter código do clima
        let codigo = atual.codigo_clima;
        
        // Se não houver código, usar fallback
        if (codigo === null || codigo === undefined || isNaN(codigo)) {
            codigo = 2; // Fallback para parcialmente nublado
        }
        
        const caminhoIcone = obterIconeClima(codigo);
        
        // Verificar se já existe uma imagem, se não, criar
        let imgEl = iconeEl.querySelector('img');
        if (!imgEl) {
            imgEl = document.createElement('img');
            imgEl.alt = 'Ícone do clima';
            imgEl.className = 'icone-clima-img';
            iconeEl.innerHTML = ''; // Limpar conteúdo anterior (emoji)
            iconeEl.appendChild(imgEl);
        }
        
        imgEl.src = caminhoIcone;
        imgEl.onerror = function() {
            // Se a imagem não carregar, usar fallback
            this.src = '/icones/parcialmente%20nublado.png';
        };
        
        // Forçar renderização e visibilidade
        iconeEl.style.display = 'flex';
        iconeEl.style.visibility = 'visible';
        iconeEl.style.opacity = '0.95';
    }
    
    // Descrição
    const descEl = document.getElementById('descricao-clima');
    if (descEl) {
        descEl.textContent = atual.descricao_clima || 'Dados indisponíveis';
    }
    
    // Preencher previsão 3 dias (próximos 3 dias, pulando hoje)
    preencherPrevisao3Dias(dados.previsao_diaria || []);
}

// Preencher previsão de 3 dias
function preencherPrevisao3Dias(previsoes) {
    // Pegar os próximos 3 dias (pular hoje que é índice 0)
    const proximos3Dias = previsoes.slice(1, 4);
    
    // Preencher os 3 cards
    for (let i = 0; i < 3; i++) {
        const card = document.getElementById(`previsao-${i + 1}`);
        if (!card) continue;
        
        if (i < proximos3Dias.length) {
            const previsao = proximos3Dias[i];
            const tempElement = card.querySelector('.previsao-temp');
            const diaElement = card.querySelector('.previsao-dia');
            const iconeElement = card.querySelector('.previsao-icone');
            
            if (tempElement) {
                const tempMax = previsao.temp_max !== null ? Math.round(previsao.temp_max) : '--';
                tempElement.textContent = `+${tempMax}°C`;
            }
            if (diaElement) {
                diaElement.textContent = formatarDiaSemana(previsao.dia_semana || '--');
            }
            if (iconeElement) {
                // Tentar obter código do clima de várias fontes
                let codigo = previsao.codigo_clima;
                if (codigo === null || codigo === undefined) {
                    codigo = 2; // Fallback para parcialmente nublado
                }
                
                const caminhoIcone = obterIconeClima(codigo);
                
                // Verificar se já existe uma imagem, se não, criar
                let imgEl = iconeElement.querySelector('img');
                if (!imgEl) {
                    imgEl = document.createElement('img');
                    imgEl.alt = 'Ícone do clima';
                    imgEl.className = 'previsao-icone-img';
                    iconeElement.innerHTML = ''; // Limpar conteúdo anterior (emoji)
                    iconeElement.appendChild(imgEl);
                }
                
                imgEl.src = caminhoIcone;
                imgEl.onerror = function() {
                    // Se a imagem não carregar, usar fallback
                    this.src = '/icones/parcialmente nublado.png';
                };
                
                // Forçar renderização
                iconeElement.style.display = 'block';
                iconeElement.style.visibility = 'visible';
            }
        } else {
            // Se não houver dados suficientes, mostrar valores padrão
            const tempElement = card.querySelector('.previsao-temp');
            const diaElement = card.querySelector('.previsao-dia');
            const iconeElement = card.querySelector('.previsao-icone');
            
            if (tempElement) tempElement.textContent = '+--°C';
            if (diaElement) diaElement.textContent = '---';
            if (iconeElement) {
                const caminhoIcone = obterIconeClima(2); // Código padrão: parcialmente nublado
                
                // Verificar se já existe uma imagem, se não, criar
                let imgEl = iconeElement.querySelector('img');
                if (!imgEl) {
                    imgEl = document.createElement('img');
                    imgEl.alt = 'Ícone do clima';
                    imgEl.className = 'previsao-icone-img';
                    iconeElement.innerHTML = ''; // Limpar conteúdo anterior (emoji)
                    iconeElement.appendChild(imgEl);
                }
                
                imgEl.src = caminhoIcone;
                imgEl.onerror = function() {
                    // Se a imagem não carregar, usar fallback
                    this.src = '/icones/parcialmente nublado.png';
                };
                
                iconeElement.style.display = 'block';
                iconeElement.style.visibility = 'visible';
            }
        }
    }
}

// Exibir erro
function exibirErro(mensagem) {
    const loading = document.getElementById('loading');
    const display = document.getElementById('clima-display');
    const erroScreen = document.getElementById('erro-screen');
    const erroMensagem = document.getElementById('erro-mensagem');
    
    loading.classList.add('hidden');
    display.classList.add('hidden');
    erroMensagem.textContent = mensagem || 'Erro ao carregar dados meteorológicos';
    erroScreen.classList.remove('hidden');
}

// Carregar clima (função principal) - não bloqueia UI
async function carregarClima() {
    const loading = document.getElementById('loading');
    const display = document.getElementById('clima-display');
    const erroScreen = document.getElementById('erro-screen');
    
    // Não esconder display (já está visível)
    if (erroScreen) {
        erroScreen.classList.add('hidden');
    }
    
    try {
        // Timeout de 8 segundos para não travar em telas lentas
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 8000);
        });
        
        const dadosPromise = buscarDadosClima();
        const dados = await Promise.race([dadosPromise, timeoutPromise]);
        
        // Atualizar dados sem esconder a tela
        exibirClima(dados);
    } catch (error) {
        console.error('Erro ao carregar clima:', error);
        // Não mostrar erro imediatamente - manter dados visíveis
        // Só mostrar erro se for crítico e após várias tentativas
        if (error.message === 'Timeout') {
            console.warn('Timeout na busca de dados - mantendo dados atuais ou padrão');
        }
    }
}

// Mostrar cidade e data imediatamente (sem esperar API)
function inicializarUI() {
    // Mostrar data imediatamente
    const dataElement = document.getElementById('clima-data-topo');
    if (dataElement) {
        dataElement.textContent = formatarDataCompleta();
    }
    
    // Mostrar cidade da URL imediatamente
    const cidadeElement = document.getElementById('clima-cidade');
    if (cidadeElement) {
        const urlParams = new URLSearchParams(window.location.search);
        const cidadeParam = urlParams.get('cidade');
        const estadoParam = urlParams.get('estado') || urlParams.get('uf');
        
        if (cidadeParam) {
            let nomeCidade = cidadeParam;
            if (estadoParam) {
                nomeCidade = `${cidadeParam} - ${estadoParam}`;
            }
            cidadeElement.textContent = nomeCidade.toUpperCase();
        } else {
            cidadeElement.textContent = 'CAJAZEIRAS - PB';
        }
    }
    
    // Mostrar display imediatamente (não esconder)
    const display = document.getElementById('clima-display');
    const loading = document.getElementById('loading');
    if (display && loading) {
        display.classList.remove('hidden');
        // Esconder loading após um breve delay para mostrar estrutura
        setTimeout(() => {
            loading.classList.add('hidden');
        }, 300);
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar UI imediatamente (sem esperar API)
    inicializarUI();
    
    // Carregar dados em background (não bloqueia UI)
    carregarClima();
    
    // Atualizar a cada 30 minutos
    setInterval(() => {
        carregarClima();
    }, 1800000); // 30 minutos
});

// Atualizar quando a janela ganhar foco (útil para telas de exibição)
window.addEventListener('focus', () => {
    carregarClima();
});
