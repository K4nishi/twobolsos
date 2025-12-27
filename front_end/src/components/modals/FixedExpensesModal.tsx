import { X, Plus, Trash2, CalendarCheck, Clock, Infinity as InfinityIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { DespesaFixa } from '../../types';

interface FixedExpensesModalProps {
    isOpen: boolean;
    onClose: () => void;
    walletId: number;
}

import { useToast } from '../../context/ToastContext';

export function FixedExpensesModal({ isOpen, onClose, walletId }: FixedExpensesModalProps) {
    const { addToast } = useToast();
    const [fixedExpenses, setFixedExpenses] = useState<DespesaFixa[]>([]);
    const [nome, setNome] = useState('');
    const [valor, setValor] = useState('');
    const [tag, setTag] = useState('Moradia');
    const [duracao, setDuracao] = useState<'indeterminado' | 'determinado'>('indeterminado');
    const [meses, setMeses] = useState('12');
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        if (isOpen) loadExpenses();
    }, [isOpen]);

    async function loadExpenses() {
        try {
            const res = await api.get(`/negocios/${walletId}/fixas`);
            setFixedExpenses(res.data);
        } catch (error) {
            console.error(error);
        }
    }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post(`/negocios/${walletId}/fixas`, {
                nome,
                valor: parseFloat(valor),
                tag,
                dia_vencimento: 1,
                duracao_meses: duracao === 'determinado' ? parseInt(meses) : null
            });
            addToast('success', 'Despesa fixa adicionada');
            loadExpenses();
            setNome('');
            setValor('');
            setDuracao('indeterminado');
            setMeses('12');
            setShowForm(false);
        } catch (error) {
            addToast('error', 'Erro ao adicionar despesa fixa');
        } finally {
            setLoading(false);
        }
    }

    async function removeExpense(id: number) {
        if (!confirm("Remover esta despesa fixa?")) return;
        try {
            await api.delete(`/negocios/${walletId}/fixas/${id}`);
            addToast('success', 'Despesa fixa removida');
            loadExpenses();
        } catch (error) {
            addToast('error', 'Erro ao remover');
        }
    }

    // Calcular total mensal
    const totalMensal = fixedExpenses.reduce((acc, f) => acc + f.valor, 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-hidden shadow-2xl border-t sm:border border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-zinc-900 px-4 sm:px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 z-10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                                <CalendarCheck className="text-purple-600 dark:text-purple-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Despesas Fixas</h2>
                                <p className="text-xs text-zinc-500">Contas mensais recorrentes</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            <X size={20} className="text-zinc-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-4 sm:px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Total mensal */}
                    {fixedExpenses.length > 0 && (
                        <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 rounded-xl border border-purple-100 dark:border-purple-500/20">
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wider">Total Mensal</p>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">R$ {totalMensal.toFixed(2)}</p>
                        </div>
                    )}

                    {/* Lista de despesas fixas */}
                    <div className="space-y-2 mb-4">
                        {fixedExpenses.length === 0 && !showForm && (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                    <CalendarCheck size={28} className="text-zinc-400" />
                                </div>
                                <p className="text-zinc-500 mb-2">Nenhuma despesa fixa cadastrada</p>
                                <p className="text-sm text-zinc-400">Adicione suas contas mensais recorrentes</p>
                            </div>
                        )}
                        
                        {fixedExpenses.map(f => (
                            <div key={f.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 group hover:border-purple-300 dark:hover:border-purple-500/50 transition-colors">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className={`w-2 h-8 rounded-full flex-shrink-0 ${
                                        f.tag === 'Moradia' ? 'bg-blue-500' :
                                        f.tag === 'Trabalho' ? 'bg-green-500' :
                                        f.tag === 'Educação' ? 'bg-yellow-500' :
                                        f.tag === 'Lazer' ? 'bg-pink-500' : 'bg-zinc-400'
                                    }`} />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{f.nome}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">{f.tag}</span>
                                            {(f as any).duracao_meses ? (
                                                <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
                                                    <Clock size={10} /> {(f as any).duracao_meses} meses
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
                                                    <InfinityIcon size={10} /> Recorrente
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="font-bold text-red-500 text-sm whitespace-nowrap">R$ {f.valor.toFixed(2)}</span>
                                    <button 
                                        onClick={() => removeExpense(f.id)} 
                                        className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Formulário para nova despesa */}
                    {showForm ? (
                        <form onSubmit={handleAdd} className="space-y-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
                            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">Nova Despesa Fixa</h3>
                            
                            {/* Nome */}
                            <div>
                                <label className="text-xs text-zinc-500 font-medium block mb-1">Nome</label>
                                <input
                                    value={nome}
                                    onChange={e => setNome(e.target.value)}
                                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                    placeholder="Ex: Aluguel, Internet, Netflix..."
                                    required
                                />
                            </div>

                            {/* Categoria e Valor em grid no desktop, stack no mobile */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-zinc-500 font-medium block mb-1">Categoria</label>
                                    <select
                                        value={tag}
                                        onChange={e => setTag(e.target.value)}
                                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                    >
                                        <option>Moradia</option>
                                        <option>Trabalho</option>
                                        <option>Educação</option>
                                        <option>Lazer</option>
                                        <option>Transporte</option>
                                        <option>Saúde</option>
                                        <option>Outros</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 font-medium block mb-1">Valor Mensal</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">R$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={valor}
                                            onChange={e => setValor(e.target.value)}
                                            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                            placeholder="0,00"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Duração */}
                            <div>
                                <label className="text-xs text-zinc-500 font-medium block mb-2">Duração</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setDuracao('indeterminado')}
                                        className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                                            duracao === 'indeterminado'
                                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                                : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-purple-300'
                                        }`}
                                    >
                                        <InfinityIcon size={16} />
                                        <span className="hidden sm:inline">Indeterminado</span>
                                        <span className="sm:hidden">Sempre</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDuracao('determinado')}
                                        className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                                            duracao === 'determinado'
                                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                                : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-purple-300'
                                        }`}
                                    >
                                        <Clock size={16} />
                                        <span className="hidden sm:inline">Por tempo</span>
                                        <span className="sm:hidden">Meses</span>
                                    </button>
                                </div>
                                
                                {duracao === 'determinado' && (
                                    <div className="mt-3">
                                        <label className="text-xs text-zinc-500 font-medium block mb-1">Quantidade de meses</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="120"
                                            value={meses}
                                            onChange={e => setMeses(e.target.value)}
                                            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                            placeholder="12"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Botões de ação */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-500 transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Plus size={16} />
                                            Adicionar
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button
                            onClick={() => setShowForm(true)}
                            className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-purple-400 hover:text-purple-500 dark:hover:border-purple-500 dark:hover:text-purple-400 transition-all flex items-center justify-center gap-2 font-medium"
                        >
                            <Plus size={18} />
                            Adicionar Despesa Fixa
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
