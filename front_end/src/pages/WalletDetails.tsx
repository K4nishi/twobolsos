import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { KPI, Transacao, Negocio, ChartData } from '../types';
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle, Trash2, Users, MoreVertical, CalendarCheck, Filter, ChevronDown } from 'lucide-react';
import { TransactionModal } from '../components/modals/TransactionModal';
import { MembersModal } from '../components/modals/MembersModal';
import { FixedExpensesModal } from '../components/modals/FixedExpensesModal';
import { CloseKmModal } from '../components/modals/CloseKmModal';
import { DriverKpi } from '../components/ui/DriverKpi';
import { CashFlowChart } from '../components/charts/CashFlowChart';
import { CategoryChart } from '../components/charts/CategoryChart';
import { useToast } from '../context/ToastContext';

export default function WalletDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [wallet, setWallet] = useState<Negocio | null>(null);
    const [transactions, setTransactions] = useState<Transacao[]>([]);
    const [kpis, setKpis] = useState<KPI | null>(null);

    // Charts
    const [chartData, setChartData] = useState<ChartData | null>(null);
    const [pieData, setPieData] = useState<Record<string, number> | null>(null);
    const [chartDays, setChartDays] = useState('30');

    // Filters
    const [filterType, setFilterType] = useState<'todos' | 'receita' | 'despesa'>('todos');

    // Modals & UI
    const [transType, setTransType] = useState<'receita' | 'despesa' | null>(null);
    const [showMembers, setShowMembers] = useState(false);
    const [showFixed, setShowFixed] = useState(false);
    const [showCloseKm, setShowCloseKm] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false); // Changed to state
    const [wsConnected, setWsConnected] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const res = await api.get(`/negocios/${id}/dashboard?dias=${chartDays}`);
            setWallet({ ...res.data.negocio, role: res.data.role });
            setTransactions(res.data.extrato);
            setKpis(res.data.kpis);
            setChartData(res.data.grafico);
            setPieData(res.data.pizza);
        } catch (error) {
            // Error handled silently - user sees loading state
        } finally {
            setLoading(false);
        }
    }, [id, chartDays]);

    // Real-time WebSocket Connection
    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        if (!userId) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.hostname}:8000/ws/${userId}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => setWsConnected(true);
        ws.onmessage = (event) => {
            if (event.data === 'UPDATE_DASHBOARD' || event.data.includes('UPDATE')) {
                loadData();
            }
        };
        ws.onerror = () => setWsConnected(false);
        ws.onclose = () => setWsConnected(false);

        return () => ws.close();
    }, [id, loadData]);

    // Main Data Load
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Close dropdown when clicking outside (simple version)
    useEffect(() => {
        const clickHandler = () => setShowDropdown(false);
        window.addEventListener('click', clickHandler);
        return () => window.removeEventListener('click', clickHandler);
    }, []);



    async function deleteTransaction(tid: number) {
        if (!confirm("Excluir essa transação?")) return;
        try {
            await api.delete(`/transacoes/${tid}`);
            addToast('success', 'Transação excluída');
            loadData();
        } catch (error) {
            addToast('error', 'Erro ao excluir transação');
        }
    }

    async function deleteWallet() {
        if (!confirm("Tem certeza? Essa ação não pode ser desfeita.")) return;
        try {
            await api.delete(`/negocios/${id}`);
            addToast('success', 'Carteira excluída com sucesso');
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            addToast('error', 'Erro ao excluir carteira. Verifique permissões.');
        }
    }

    if (loading || !wallet) return <div className="p-8 text-center text-zinc-500">Carregando...</div>;

    const currentUserId = Number(localStorage.getItem('user_id'));
    const isOwner = wallet.owner_id === currentUserId;

    const filteredTransactions = transactions.filter(t => {
        if (filterType === 'todos') return true;
        return t.tipo === filterType;
    });

    return (
        <div className="p-4 max-w-4xl mx-auto pb-20">
            <TransactionModal
                isOpen={!!transType}
                onClose={() => setTransType(null)}
                onSuccess={loadData}
                walletId={Number(id)}
                type={transType || 'receita'}
            />

            <MembersModal
                isOpen={showMembers}
                onClose={() => setShowMembers(false)}
                walletId={Number(id)}
                isOwner={wallet?.role === 'owner'}
            />

            <FixedExpensesModal
                isOpen={showFixed}
                onClose={() => setShowFixed(false)}
                walletId={Number(id)}
            />

            <CloseKmModal
                isOpen={showCloseKm}
                onClose={() => setShowCloseKm(false)}
                onSuccess={loadData}
                walletId={Number(id)}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => navigate('/dashboard')} className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                    <ArrowLeft className="text-zinc-600 dark:text-zinc-400" />
                </button>
                <div className="text-center flex flex-col items-center">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold dark:text-white text-zinc-900">{wallet.nome}</h1>
                        <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} title={wsConnected ? "Conectado em Tempo Real" : "Desconectado"}></div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500">{wallet.categoria}</span>
                </div>
                <div className="relative" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <MoreVertical className="text-zinc-600 dark:text-zinc-400" />
                    </button>

                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            <button onClick={() => { setShowFixed(true); setShowDropdown(false); }} className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 border-b border-zinc-100 dark:border-zinc-800">
                                <CalendarCheck size={16} /> Despesas Fixas
                            </button>
                            <button onClick={() => { setShowMembers(true); setShowDropdown(false); }} className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                                <Users size={16} /> Membros / Convidar
                            </button>
                            <div className="border-t border-zinc-100 dark:border-zinc-800 my-1"></div>
                            <button onClick={deleteWallet} className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-sm text-red-600">
                                <Trash2 size={16} /> Excluir Carteira
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Driver Panel */}
            {wallet.categoria === 'MOTORISTA' && kpis && (
                <DriverKpi kpis={kpis} onCloseKm={() => setShowCloseKm(true)} />
            )}

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="glass-card p-4 rounded-2xl text-center">
                    <p className="text-xs font-bold uppercase text-green-600 dark:text-green-500 mb-1">Entradas</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">R$ {kpis?.receita.toFixed(2)}</p>
                </div>
                <div className="glass-card p-4 rounded-2xl text-center">
                    <p className="text-xs font-bold uppercase text-red-600 dark:text-red-500 mb-1">Saídas</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">R$ {kpis?.despesa.toFixed(2)}</p>
                </div>
                <div className="glass-card p-4 rounded-2xl text-center bg-zinc-900/5">
                    <p className="text-xs font-bold uppercase text-blue-600 dark:text-blue-500 mb-1">Saldo</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">R$ {kpis?.saldo.toFixed(2)}</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="md:col-span-2 glass-card p-4 rounded-2xl h-[300px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold uppercase text-zinc-500">Fluxo de Caixa</h3>
                        <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                            {['7', '15', '30'].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setChartDays(d)}
                                    className={`px-3 py-1 text-xs rounded-md transition-colors ${chartDays === d ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white font-bold' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                >
                                    {d}d
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-[220px]">
                        {chartData && <CashFlowChart data={chartData} />}
                    </div>
                </div>
                <div className="glass-card p-4 rounded-2xl h-[300px]">
                    <h3 className="text-xs font-bold uppercase text-zinc-500 mb-4">Categorias (30d)</h3>
                    <div className="h-[220px]">
                        {pieData && Object.keys(pieData).length > 0 ? (
                            <CategoryChart data={pieData} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-zinc-500 text-xs">Sem dados</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <button onClick={() => setTransType('receita')} className="bg-green-600 hover:bg-green-500 text-white p-4 rounded-2xl shadow-lg shadow-green-500/20 active:scale-95 transition-all flex justify-center items-center gap-2 font-bold">
                    <ArrowUpCircle /> Entrada
                </button>
                <button onClick={() => setTransType('despesa')} className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-2xl shadow-lg shadow-red-500/20 active:scale-95 transition-all flex justify-center items-center gap-2 font-bold">
                    <ArrowDownCircle /> Saída
                </button>
            </div>

            {/* History */}
            <div className="glass-card p-4 sm:p-6 rounded-3xl min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Histórico</h3>
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                        <button onClick={() => setFilterType('todos')} className={`px-3 py-1 text-xs rounded-md transition-all ${filterType === 'todos' ? 'bg-white dark:bg-zinc-600 shadow font-bold' : 'text-zinc-500'}`}>T</button>
                        <button onClick={() => setFilterType('receita')} className={`px-3 py-1 text-xs rounded-md transition-all ${filterType === 'receita' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 font-bold' : 'text-zinc-500'}`}><ArrowUpCircle size={14} /></button>
                        <button onClick={() => setFilterType('despesa')} className={`px-3 py-1 text-xs rounded-md transition-all ${filterType === 'despesa' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 font-bold' : 'text-zinc-500'}`}><ArrowDownCircle size={14} /></button>
                    </div>
                </div>

                <div className="space-y-2">
                    {filteredTransactions.length === 0 && <p className="text-center text-zinc-400 py-8">Nenhuma transação encontrada.</p>}
                    {filteredTransactions.map(t => (
                        <div key={t.id} className="flex justify-between items-center p-3 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-xl transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.tipo === 'receita' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-500' : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500'}`}>
                                    {t.tipo === 'receita' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                                </div>
                                <div>
                                    <p className="font-bold text-zinc-900 dark:text-white text-sm">{t.descricao}</p>
                                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                                        {new Date(t.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                        <span className="opacity-50">•</span>
                                        <span className="text-zinc-400">{t.created_by_name}</span>
                                        {t.tag && <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 rounded text-[10px] ml-1">{t.tag}</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                                <span className={`font-bold ${t.tipo === 'receita' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                    {t.tipo === 'receita' ? '+' : '-'} R$ {t.valor.toFixed(2)}
                                </span>
                                <button onClick={() => deleteTransaction(t.id)} className="text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
