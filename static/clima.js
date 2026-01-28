/**
 * Sistema de Clima - JavaScript
 * Gerencia a exibição de dados meteorológicos
 */

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

// Exibir dados meteorológicos na tela
function exibirClima(dados) {
    const display = document.getElementById('clima-display');
    const loading = document.getElementById('loading');
    const erroScreen = document.getElementById('erro-screen');
    
    // Esconder loading e erro
    loading.classList.add('hidden');
    erroScreen.classList.add('hidden');
    
    if (!dados || !dados.atual) {
        throw new Error('Dados meteorológicos inválidos');
    }
    
    // Preencher dados atuais
    const atual = dados.atual;
    
    // Atualizar nome da cidade (se disponível)
    const cidadeElement = document.querySelector('.clima-cidade');
    if (cidadeElement) {
        const urlParams = new URLSearchParams(window.location.search);
        const cidadeParam = urlParams.get('cidade');
        const estadoParam = urlParams.get('estado') || urlParams.get('uf');

        let nomeCidade = dados?.localizacao?.nome || '';

        // Se o backend não retornou nome, monta a partir dos parâmetros
        if (!nomeCidade && cidadeParam) {
            nomeCidade = cidadeParam;
            if (estadoParam) {
                nomeCidade = `${cidadeParam} - ${estadoParam}`;
            }
        }

        if (!nomeCidade) {
            nomeCidade = 'Cidade não informada';
        }

        cidadeElement.textContent = nomeCidade;
    }

    // Data no topo
    const dataElement = document.getElementById('clima-data-topo');
    dataElement.textContent = formatarDataCompleta();
    
    // Temperatura (sempre com sinal +)
    const temp = atual.temperatura !== null ? Math.round(atual.temperatura) : '--';
    document.getElementById('temperatura-atual').textContent = temp;
    
    // Ícone
    document.getElementById('icone-clima').textContent = atual.icone_clima || '🌤️';
    
    // Descrição
    document.getElementById('descricao-clima').textContent = atual.descricao_clima || 'Dados indisponíveis';
    
    // Preencher previsão 3 dias (próximos 3 dias, pulando hoje)
    preencherPrevisao3Dias(dados.previsao_diaria || []);
    
    // Mostrar display
    display.classList.remove('hidden');
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
                iconeElement.textContent = previsao.icone || '🌤️';
            }
        } else {
            // Se não houver dados suficientes, mostrar "--"
            const tempElement = card.querySelector('.previsao-temp');
            const diaElement = card.querySelector('.previsao-dia');
            const iconeElement = card.querySelector('.previsao-icone');
            
            if (tempElement) tempElement.textContent = '+--°C';
            if (diaElement) diaElement.textContent = '---';
            if (iconeElement) iconeElement.textContent = '🌤️';
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

// Carregar clima (função principal)
async function carregarClima() {
    const loading = document.getElementById('loading');
    const display = document.getElementById('clima-display');
    const erroScreen = document.getElementById('erro-screen');
    
    // Mostrar loading
    loading.classList.remove('hidden');
    display.classList.add('hidden');
    erroScreen.classList.add('hidden');
    
    try {
        const dados = await buscarDadosClima();
        exibirClima(dados);
    } catch (error) {
        console.error('Erro ao carregar clima:', error);
        exibirErro('Não foi possível carregar as condições meteorológicas. Verifique sua conexão com a internet.');
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
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
