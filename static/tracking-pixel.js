/**
 * Tracking Pixel - Sistema de Rastreamento de Comportamento Pós-Scan
 * Sprint 2 - Tracking OOH/DOOH
 * 
 * Este script deve ser incluído na landing page após o redirecionamento
 * 
 * Uso:
 * <script>
 *   window.TRACKING_CLICK_ID = 123; // ID do clique (deve ser passado via URL ou localStorage)
 * </script>
 * <script src="/static/tracking-pixel.js"></script>
 */

(function() {
    'use strict';
    
    // Configurações
    const CONFIG = {
        apiUrl: '/api/tracking/event',
        heartbeatInterval: 30000, // 30 segundos
        scrollThresholds: [25, 50, 75, 100], // Percentuais de scroll
        maxScrollDepth: 0,
        sessionStartTime: Date.now(),
        timeOnPage: 0
    };
    
    // Obter click_id
    function getClickId() {
        // Tentar obter de várias fontes
        if (window.TRACKING_CLICK_ID) {
            return window.TRACKING_CLICK_ID;
        }
        
        // Tentar obter da URL (ex: ?click_id=123)
        const urlParams = new URLSearchParams(window.location.search);
        const clickId = urlParams.get('click_id');
        if (clickId) {
            return parseInt(clickId, 10);
        }
        
        // Tentar obter do localStorage (se foi salvo anteriormente)
        const storedClickId = localStorage.getItem('tracking_click_id');
        if (storedClickId) {
            return parseInt(storedClickId, 10);
        }
        
        return null;
    }
    
    // Enviar evento para o servidor
    function trackEvent(eventType, eventValue = null) {
        const clickId = getClickId();
        if (!clickId) {
            console.warn('[Tracking] Click ID não encontrado. Evento não será rastreado.');
            return;
        }
        
        const payload = {
            click_id: clickId,
            event_type: eventType,
            event_value: eventValue ? JSON.stringify(eventValue) : null
        };
        
        // Enviar via fetch (não bloqueia)
        fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            keepalive: true // Garante que a requisição seja enviada mesmo se a página for fechada
        }).catch(error => {
            console.error('[Tracking] Erro ao enviar evento:', error);
        });
    }
    
    // Rastrear pageview inicial
    function trackPageView() {
        trackEvent('pageview', {
            url: window.location.href,
            referrer: document.referrer,
            timestamp: new Date().toISOString()
        });
    }
    
    // Rastrear scroll depth
    function trackScrollDepth() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = documentHeight > 0 ? Math.round((scrollTop / documentHeight) * 100) : 0;
        
        // Verificar se atingiu algum threshold
        for (const threshold of CONFIG.scrollThresholds) {
            if (scrollPercent >= threshold && CONFIG.maxScrollDepth < threshold) {
                CONFIG.maxScrollDepth = threshold;
                trackEvent('scroll', {
                    depth: threshold,
                    scroll_percent: scrollPercent,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
    
    // Rastrear tempo de permanência (heartbeat)
    function trackTimeOnPage() {
        const timeOnPage = Math.round((Date.now() - CONFIG.sessionStartTime) / 1000); // em segundos
        CONFIG.timeOnPage = timeOnPage;
        
        trackEvent('pageview', {
            time_on_page: timeOnPage,
            timestamp: new Date().toISOString()
        });
    }
    
    // Rastrear cliques em CTAs
    function trackCTAClicks() {
        // Procurar por elementos com data-tracking-cta
        document.addEventListener('click', function(event) {
            const target = event.target.closest('[data-tracking-cta]');
            if (target) {
                const ctaName = target.getAttribute('data-tracking-cta');
                const ctaText = target.textContent.trim().substring(0, 100);
                
                trackEvent('cta_click', {
                    cta_name: ctaName,
                    cta_text: ctaText,
                    cta_url: target.href || null,
                    timestamp: new Date().toISOString()
                });
            }
        });
    }
    
    // Rastrear conversões específicas
    function trackConversions() {
        // WhatsApp
        document.addEventListener('click', function(event) {
            const target = event.target.closest('a[href*="wa.me"], a[href*="whatsapp.com"], a[href*="api.whatsapp.com"]');
            if (target) {
                trackEvent('whatsapp', {
                    url: target.href,
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        // Formulários
        const forms = document.querySelectorAll('form[data-tracking-form]');
        forms.forEach(form => {
            form.addEventListener('submit', function(event) {
                const formName = form.getAttribute('data-tracking-form') || 'form';
                trackEvent('form', {
                    form_name: formName,
                    timestamp: new Date().toISOString()
                });
            });
        });
        
        // Downloads
        document.addEventListener('click', function(event) {
            const target = event.target.closest('a[download], a[href$=".pdf"], a[href$=".doc"], a[href$=".zip"]');
            if (target && target.hasAttribute('download') || /\.(pdf|doc|docx|zip|rar)$/i.test(target.href)) {
                trackEvent('download', {
                    file_url: target.href,
                    file_name: target.download || target.href.split('/').pop(),
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        // Chamadas telefônicas
        document.addEventListener('click', function(event) {
            const target = event.target.closest('a[href^="tel:"]');
            if (target) {
                trackEvent('call', {
                    phone_number: target.href.replace('tel:', ''),
                    timestamp: new Date().toISOString()
                });
            }
        });
    }
    
    // Função para rastrear conversão customizada (para uso externo)
    window.trackConversion = function(eventType, eventValue) {
        if (typeof eventType !== 'string') {
            console.error('[Tracking] eventType deve ser uma string');
            return;
        }
        
        const validTypes = ['whatsapp', 'form', 'download', 'call', 'purchase'];
        if (!validTypes.includes(eventType)) {
            console.warn(`[Tracking] Tipo de evento '${eventType}' não é um tipo de conversão padrão. Será registrado mesmo assim.`);
        }
        
        trackEvent(eventType, eventValue);
    };
    
    // Inicialização
    function init() {
        const clickId = getClickId();
        if (!clickId) {
            console.warn('[Tracking] Click ID não encontrado. Tracking não será ativado.');
            return;
        }
        
        // Salvar click_id no localStorage para persistência
        localStorage.setItem('tracking_click_id', clickId.toString());
        
        console.log('[Tracking] Inicializado para click_id:', clickId);
        
        // Rastrear pageview inicial
        trackPageView();
        
        // Rastrear scroll
        let scrollTimeout;
        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(trackScrollDepth, 100); // Debounce
        });
        
        // Rastrear tempo de permanência (heartbeat a cada 30s)
        setInterval(trackTimeOnPage, CONFIG.heartbeatInterval);
        
        // Rastrear cliques em CTAs
        trackCTAClicks();
        
        // Rastrear conversões
        trackConversions();
        
        // Rastrear tempo de permanência ao sair da página
        window.addEventListener('beforeunload', function() {
            const finalTimeOnPage = Math.round((Date.now() - CONFIG.sessionStartTime) / 1000);
            if (finalTimeOnPage > 0) {
                // Usar sendBeacon para garantir envio mesmo ao fechar a página
                const clickId = getClickId();
                if (clickId) {
                    const payload = JSON.stringify({
                        click_id: clickId,
                        event_type: 'pageview',
                        event_value: JSON.stringify({
                            time_on_page: finalTimeOnPage,
                            max_scroll_depth: CONFIG.maxScrollDepth,
                            timestamp: new Date().toISOString()
                        })
                    });
                    
                    navigator.sendBeacon(CONFIG.apiUrl, payload);
                }
            }
        });
    }
    
    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
