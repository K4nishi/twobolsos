import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { getWsUrl } from '../config';
import { Negocio } from '../types';
import { Plus, FolderInput, LogOut, Wallet, Sun, Moon } from 'lucide-react';
import { CreateWalletModal } from '../components/modals/CreateWalletModal';
import { JoinWalletModal } from '../components/modals/JoinWalletModal';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const [wallets, setWallets] = useState<Negocio[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

    useEffect(() => {
        loadWallets();
    }, []);

    async function loadWallets() {
        try {
            const res = await api.get('/negocios');
            setWallets(res.data);
        } catch (error) {
            console.error(error);
        }
    }

    // Real-time Updates for Dashboard List
    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        if (!userId) return;

        const ws = new WebSocket(getWsUrl(userId));

        ws.onmessage = (event) => {
            if (event.data === 'UPDATE_LIST' || event.data.includes('UPDATE')) {
                loadWallets();
            }
        };

        return () => ws.close();
    }, []);

    function handleLogout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('username');
        navigate('/login');
    }

    function toggleTheme() {
        const html = document.documentElement;
        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            setIsDark(false);
        } else {
            html.classList.add('dark');
            setIsDark(true);
        }
    }

    const openWallet = (id: number) => navigate(`/wallet/${id}`);

    return (
        <div className="min-h-screen overflow-x-hidden bg-gray-50 dark:bg-zinc-950">
            <div className="px-4 py-4 sm:p-6 max-w-6xl mx-auto">
                <CreateWalletModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={loadWallets}
                />

                <JoinWalletModal
                    isOpen={isJoinModalOpen}
                    onClose={() => setIsJoinModalOpen(false)}
                    onSuccess={loadWallets}
                />

                {/* Header Mobile */}
                <header className="mb-6">
                    {/* Top row - Logo e Theme toggle */}
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold dark:text-white text-zinc-900">Twobolsos</h1>
                            <p className="text-zinc-500 text-xs sm:text-sm">Gerencie suas finanças</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleTheme}
                                className="p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                {isDark ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-500/10 transition-colors"
                                title="Sair"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Action buttons - full width on mobile */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setIsJoinModalOpen(true)}
                            className="flex items-center justify-center gap-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white px-4 py-3 rounded-xl font-medium transition-all active:scale-95"
                        >
                            <FolderInput size={18} />
                            <span className="text-sm">Entrar</span>
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            <Plus size={18} />
                            <span className="text-sm">Novo Bolso</span>
                        </button>
                    </div>
                </header>

                {/* Grid de carteiras */}
                <div className="space-y-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 sm:space-y-0">
                    {wallets.map(w => (
                        <div
                            key={w.id}
                            onClick={() => openWallet(w.id)}
                            className="glass-card p-4 cursor-pointer relative overflow-hidden group transition-transform hover:-translate-y-1 active:scale-[0.98]"
                        >
                            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: w.cor }} />

                            <div className="flex justify-between items-start mb-3">
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-base font-bold truncate dark:text-white">{w.nome}</h3>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 mt-1 inline-block">
                                        {w.categoria}
                                    </span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded flex-shrink-0 ml-2 ${w.role === 'owner'
                                        ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10'
                                        : 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10'
                                    }`}>
                                    {w.role === 'owner' ? 'Dono' : w.role}
                                </span>
                            </div>

                            <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-medium uppercase tracking-wider">Saldo Atual</p>
                            <h2 className={`text-xl font-bold ${w.saldo >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                R$ {w.saldo.toFixed(2)}
                            </h2>

                            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
                                <span className="truncate">{w.owner_name === 'Você' ? 'Pessoal' : `De: ${w.owner_name}`}</span>
                            </div>
                        </div>
                    ))}

                    {/* Estado vazio */}
                    {wallets.length === 0 && (
                        <div className="col-span-full py-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                <Wallet size={28} className="text-zinc-400" />
                            </div>
                            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                                Nenhuma carteira
                            </h3>
                            <p className="text-zinc-500 text-sm mb-4">
                                Crie sua primeira carteira
                            </p>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
                            >
                                <Plus size={18} />
                                Criar Carteira
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
