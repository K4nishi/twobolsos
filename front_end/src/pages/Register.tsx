import React, { useState } from 'react';
import { api } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Register() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        if (password !== confirmPassword) {
            addToast('warning', 'As senhas não coincidem!');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/register', { username, password });
            addToast('success', 'Conta criada com sucesso! Redirecionando...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error: any) {
            if (error.response?.status === 400) {
                addToast('error', 'Nome de usuário já existe. Tente outro.');
            } else {
                addToast('error', 'Erro ao criar conta. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                        <UserPlus className="w-8 h-8 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold dark:text-white text-zinc-800">Criar Conta</h1>
                    <p className="text-zinc-500 text-sm">Junte-se ao TwoBolsos</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">Usuário</label>
                        <input
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-zinc-900 dark:text-white focus:outline-none focus:border-green-500 transition-colors"
                            placeholder="Escolha um usuário"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-zinc-900 dark:text-white focus:outline-none focus:border-green-500 transition-colors"
                            placeholder="••••••"
                            required
                            minLength={4}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">Confirmar Senha</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-zinc-900 dark:text-white focus:outline-none focus:border-green-500 transition-colors"
                            placeholder="••••••"
                            required
                            minLength={4}
                        />
                    </div>
                    <button
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
                    >
                        {loading ? 'Criando...' : 'Cadastrar'}
                    </button>
                </form>
                <div className="mt-6 text-center">
                    <Link to="/login" className="text-zinc-500 hover:text-green-500 text-sm transition-colors">
                        Já tem conta? Entrar
                    </Link>
                </div>
            </div>
        </div>
    );
}
