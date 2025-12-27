import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { getWsUrl } from '../config';
import { Negocio } from '../types';
import { Plus, FolderInput, LogOut, Wallet } from 'lucide-react';
import { CreateWalletModal } from '../components/modals/CreateWalletModal';
import { JoinWalletModal } from '../components/modals/JoinWalletModal';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const [wallets, setWallets] = useState<Negocio[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

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

    const openWallet = (id: number) => navigate(`/wallet/${id}`);

    return (
        <div className="min-h-screen overflow-x-hidden">
            <div className="p-4 sm:p-6 max-w-6xl mx-auto">
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

                {/* Header - responsivo */}
                <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold dark:text-white text-zinc-900">Twobolsos</h1>
                        <p className="text-zinc-500 text-sm sm:text-base">Gerencie suas finanças</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-2 bg-transparent hover:bg-red-500/10 text-zinc-500 hover:text-red-500 border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 rounded-xl transition-colors"
                            title="Sair"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:inline text-sm">Sair</span>
                        </button>
                        <button
                            onClick={() => setIsJoinModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white px-4 py-2.5 rounded-xl font-medium transition-all active:scale-95"
                        >
                            <FolderInput size={18} />
                            <span className="text-sm">Entrar</span>
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            <Plus size={18} />
                            <span className="text-sm">Novo Bolso</span>
                        </button>
                    </div>
                </header>

                {/* Grid de carteiras */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {wallets.map(w => (
                        <div
                            key={w.id}
                            onClick={() => openWallet(w.id)}
                            className="glass-card p-5 sm:p-6 cursor-pointer relative overflow-hidden group rounded-2xl transition-transform hover:-translate-y-1 active:scale-[0.98]"
                        >
                            <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: w.cor }} />

                            <div className="flex justify-between items-start mb-4">
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-lg font-bold truncate">{w.nome}</h3>
                                    <span className="text-xs px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 mt-1 inline-block">
                                        {w.categoria}
                                    </span>
                                </div>
                                {w.role === 'owner' ? (
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 px-2 py-1 rounded flex-shrink-0 ml-2">Dono</span>
                                ) : (
                                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10 px-2 py-1 rounded flex-shrink-0 ml-2">{w.role}</span>
                                )}
                            </div>

                            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1">Saldo Atual</p>
                            <h2 className={`text-xl sm:text-2xl font-bold ${w.saldo >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                R$ {w.saldo.toFixed(2)}
                            </h2>

                            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-white/5 flex justify-between text-sm text-zinc-500">
                                <span className="truncate">{w.owner_name === 'Você' ? 'Pessoal' : `De: ${w.owner_name}`}</span>
                            </div>
                        </div>
                    ))}

                    {/* Estado vazio */}
                    {wallets.length === 0 && (
                        <div className="col-span-full py-12 text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                <Wallet size={36} className="text-zinc-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                                Nenhuma carteira ainda
                            </h3>
                            <p className="text-zinc-500 mb-6 max-w-sm mx-auto">
                                Crie sua primeira carteira para começar a gerenciar suas finanças
                            </p>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
                            >
                                <Plus size={20} />
                                Criar Primeira Carteira
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

