/**
 * Sistema de Clima - JavaScript
 * Gerencia a exibição de dados meteorológicos
 */

// Função auxiliar para verificar se é dia ou noite
// Dia: 06:00 - 17:59, Noite: 18:00 - 05:59
function isDia(hora) {
    if (hora === null || hora === undefined) {
        // Se não for informado, usar hora atual
        hora = new Date().getHours();
    }
    return hora >= 6 && hora < 18;
}

// Função para obter caminho da imagem PNG baseado no código do clima (Tomorrow.io) e horário
function obterIconeClima(codigoClima, horaAtual) {
    // Tratar valores null, undefined ou inválidos
    if (codigoClima === null || codigoClima === undefined || isNaN(codigoClima)) {
        console.warn('Código de clima inválido:', codigoClima);
        const fallback = isDia(horaAtual) ? 'parcialmente ensolarado_dia.png' : 'parcialmente_nubaldo_noite.png';
        return `/icones/${encodeURIComponent(fallback)}`;
    }
    
    // Converter para número inteiro
    const codigo = parseInt(codigoClima, 10);
    const dia = isDia(horaAtual);
    
    // Determinar o ícone baseado no código e horário
    let nomeArquivo;
    
    // Códigos Tomorrow.io (principais):
    // 1000 Clear, 1100 Mostly Clear, 1101 Partly Cloudy, 1102 Mostly Cloudy, 1001 Cloudy
    // 2000 Fog, 2100 Light Fog
    // 4000 Drizzle, 4001 Rain, 4200 Light Rain, 4201 Heavy Rain
    // 5000 Snow, 5001 Flurries, 5100 Light Snow, 5101 Heavy Snow
    // 6000 Freezing Drizzle, 6001 Freezing Rain, 6200 Light Freezing Rain, 6201 Heavy Freezing Rain
    // 7000 Ice Pellets, 7101 Heavy Ice Pellets, 7102 Light Ice Pellets
    // 8000 Thunderstorm
    if (codigo === 1000) {
        // Céu limpo
        nomeArquivo = dia ? 'tempo_limpo_dia.png' : 'tempo_limpo_noite.png';
    } else if (codigo === 1100 || codigo === 1101 || codigo === 1102 || codigo === 1001) {
        // Céu parcialmente nublado / predominantemente nublado / encoberto
        // Estratégia visual: sempre mostrar sol entre nuvens, mais "otimista" para DOOH
        nomeArquivo = dia ? 'parcialmente ensolarado_dia.png' : 'parcialmente_nubaldo_noite.png';
    } else if (codigo === 2000 || codigo === 2100) {
        // Nevoeiro
        nomeArquivo = 'ceu_encoberto.png';
    } else if (codigo === 4000 || codigo === 4001 || codigo === 4200) {
        // Garoa / Chuva leve
        nomeArquivo = dia ? 'chuva_ensolarada.png' : 'chuva_leve.png';
    } else if (codigo === 4201 || codigo === 6001 || codigo === 6201) {
        // Chuva forte / chuva congelante forte
        nomeArquivo = 'chuva_moderada.png';
    } else if (codigo === 5000 || codigo === 5001 || codigo === 5100 || codigo === 5101) {
        // Neve
        nomeArquivo = 'chuva_moderada.png'; // fallback visual
    } else if (codigo === 6000 || codigo === 6200) {
        // Precipitação congelante leve
        nomeArquivo = 'chuva_moderada.png';
    } else if (codigo === 7000 || codigo === 7101 || codigo === 7102) {
        // Granizo / gelo
        nomeArquivo = 'tempestade.png';
    } else if (codigo === 8000) {
        // Tempestade com trovoada
        nomeArquivo = 'tempestade.png';
    } else {
        console.warn('Código de clima não mapeado (Tomorrow.io):', codigo);
        nomeArquivo = dia ? 'parcialmente ensolarado_dia.png' : 'parcialmente_nubaldo_noite.png';
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
        
        // Se não houver código, usar fallback (Tomorrow.io: parcialmente nublado)
        if (codigo === null || codigo === undefined || isNaN(codigo)) {
            codigo = 1101; // Partly Cloudy
        }
        
        // Obter hora atual para determinar se é dia ou noite
        const horaAtual = new Date().getHours();
        const caminhoIcone = obterIconeClima(codigo, horaAtual);
        
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
            // Se a imagem não carregar, usar fallback baseado no horário
            const horaAtual = new Date().getHours();
            const fallback = isDia(horaAtual) ? 'parcialmente ensolarado_dia.png' : 'parcialmente_nubaldo_noite.png';
            this.src = `/icones/${encodeURIComponent(fallback)}`;
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
                    codigo = 1101; // Fallback para parcialmente nublado (Tomorrow.io)
                }
                
                // Para previsão, considerar como dia (horário típico de exibição)
                // Ou usar hora atual se preferir
                const horaAtual = new Date().getHours();
                const caminhoIcone = obterIconeClima(codigo, horaAtual);
                
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
                    // Se a imagem não carregar, usar fallback baseado no horário
                    const horaAtual = new Date().getHours();
                    const fallback = isDia(horaAtual) ? 'parcialmente ensolarado_dia.png' : 'parcialmente_nubaldo_noite.png';
                    this.src = `/icones/${encodeURIComponent(fallback)}`;
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
                // Para previsão sem dados, usar hora atual para determinar dia/noite
                const horaAtual = new Date().getHours();
                const caminhoIcone = obterIconeClima(1101, horaAtual); // Código padrão: parcialmente nublado (Tomorrow.io)
                
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
                    // Se a imagem não carregar, usar fallback baseado no horário
                    const horaAtual = new Date().getHours();
                    const fallback = isDia(horaAtual) ? 'parcialmente ensolarado_dia.png' : 'parcialmente_nubaldo_noite.png';
                    this.src = `/icones/${encodeURIComponent(fallback)}`;
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
