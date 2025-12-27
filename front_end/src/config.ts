/**
 * Application Configuration
 * =========================
 * 
 * Configura URLs da API e WebSocket baseado no ambiente.
 * 
 * Em desenvolvimento: usa localhost:8000
 * Em produção: usa a mesma origem (mesmo servidor)
 */

// Detecta se está em produção (mesma origem = tudo junto)
const isProduction = import.meta.env.PROD;

// API base URL
// - Em dev: VITE_API_URL ou localhost:8000
// - Em prod: mesma origem (string vazia = relativo)
export const API_URL = import.meta.env.VITE_API_URL ||
    (isProduction ? '' : 'http://127.0.0.1:8000');

// WebSocket URL - deriva automaticamente da origem atual
export const WS_URL = (() => {
    if (import.meta.env.VITE_WS_URL) {
        return import.meta.env.VITE_WS_URL;
    }

    if (isProduction) {
        // Em produção, usa o protocolo correto baseado na página atual
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}`;
    }

    // Em desenvolvimento
    return 'ws://127.0.0.1:8000';
})();

/**
 * Retorna a URL completa de um endpoint da API.
 * 
 * @param endpoint - Caminho do endpoint (ex: '/auth/token')
 * @returns URL completa
 * 
 * @example
 * getApiUrl('/negocios') // => 'http://localhost:8000/negocios' (dev)
 * getApiUrl('/negocios') // => '/negocios' (prod - relativo)
 */
export const getApiUrl = (endpoint: string): string => {
    const path = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    return `${API_URL}${path}`;
};

/**
 * Retorna a URL do WebSocket para um usuário específico.
 * 
 * @param userId - ID do usuário
 * @returns URL do WebSocket
 * 
 * @example
 * getWsUrl(123) // => 'ws://localhost:8000/ws/123' (dev)
 * getWsUrl(123) // => 'wss://meusite.com/ws/123' (prod)
 */
export const getWsUrl = (userId: string | number): string => {
    return `${WS_URL}/ws/${userId}`;
};
