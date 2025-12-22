/**
 * Application Configuration
 * Uses environment variables with fallbacks for development
 */

// API base URL - set via VITE_API_URL environment variable
export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// WebSocket URL - derived from API_URL
export const WS_URL = API_URL.replace(/^http/, 'ws');

// Helper to get full API endpoint
export const getApiUrl = (endpoint: string): string => {
    return `${API_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
};

// Helper to get WebSocket URL with user ID
export const getWsUrl = (userId: string | number): string => {
    return `${WS_URL}/ws/${userId}`;
};
