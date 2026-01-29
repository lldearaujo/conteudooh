/**
 * Sistema de Clima - JavaScript
 * Gerencia a exibição de dados meteorológicos
 */

// Função para obter emoji compatível com qualquer display
function obterEmojiClima(codigoClima) {
    // Mapeamento de códigos WMO para emojis universais
    const emojis = {
        0: '☀️',   // Céu limpo
        1: '🌤️',   // Principalmente limpo
        2: '🌤️',   // Parcialmente nublado
        3: '☁️',   // Nublado
        45: '🌫️',  // Nevoeiro
        48: '🌫️',  // Nevoeiro com geada
        51: '🌦️',  // Garoa leve
        53: '🌦️',  // Garoa moderada
        55: '🌦️',  // Garoa densa
        56: '🌦️',  // Garoa congelante leve
        57: '🌦️',  // Garoa congelante densa
        61: '🌧️',  // Chuva leve
        63: '🌧️',  // Chuva moderada
        65: '🌧️',  // Chuva forte
        66: '🌧️',  // Chuva congelante leve
        67: '🌧️',  // Chuva congelante forte
        71: '❄️',  // Queda de neve leve
        73: '❄️',  // Queda de neve moderada
        75: '❄️',  // Queda de neve forte
        77: '❄️',  // Grãos de neve
        80: '⛈️',  // Pancadas de chuva leve
        81: '⛈️',  // Pancadas de chuva moderada
        82: '⛈️',  // Pancadas de chuva forte
        85: '🌨️',  // Pancadas de neve leve
        86: '🌨️',  // Pancadas de neve forte
        95: '⛈️',  // Trovoada
        96: '⛈️',  // Trovoada com granizo leve
        99: '⛈️'   // Trovoada com granizo forte
    };
    
    return emojis[codigoClima] || '🌤️';
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
    
    // Ícone (usar emoji compatível)
    const iconeEl = document.getElementById('icone-clima');
    if (iconeEl) {
        iconeEl.textContent = obterEmojiClima(atual.codigo_clima);
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
                iconeElement.textContent = obterEmojiClima(previsao.codigo_clima);
            }
        } else {
            // Se não houver dados suficientes, mostrar "--"
            const tempElement = card.querySelector('.previsao-temp');
            const diaElement = card.querySelector('.previsao-dia');
            const iconeElement = card.querySelector('.previsao-icone');
            
            if (tempElement) tempElement.textContent = '+--°C';
            if (diaElement) diaElement.textContent = '---';
            if (iconeElement) iconeElement.textContent = obterEmojiClima(2); // Código padrão: parcialmente nublado
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
