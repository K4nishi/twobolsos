import React, { useState } from 'react';
import { api } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Login() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            // Form Data for OAuth2 standard
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const res = await api.post('/auth/token', formData);
            localStorage.setItem('access_token', res.data.access_token);
            localStorage.setItem('username', res.data.username || username);
            // user_id is returned by the backend in token response
            if (res.data.user_id) {
                localStorage.setItem('user_id', res.data.user_id.toString());
            }

            window.dispatchEvent(new Event('storage')); // trigger updates
            addToast('success', `Bem-vindo de volta, ${username}!`);
            navigate('/dashboard');
        } catch (error) {
            addToast('error', 'Usuário ou senha incorretos.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-x-hidden">
            <div className="glass-card w-full max-w-md p-6 sm:p-8 rounded-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                        <LogIn className="w-8 h-8 text-blue-500" />
                    </div>
                    <h1 className="text-2xl font-bold dark:text-white text-zinc-800">TwoBolsos</h1>
                    <p className="text-zinc-500 text-sm">Finanças inteligentes</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">Usuário</label>
                        <input
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3.5 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="Seu usuário"
                            required
                            autoComplete="username"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3.5 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="••••••"
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    <button
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            'Entrar'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/register" className="text-zinc-500 hover:text-blue-500 text-sm transition-colors">
                        Não tem conta? Crie uma agora
                    </Link>
                </div>
            </div>
        </div>
    );
}
