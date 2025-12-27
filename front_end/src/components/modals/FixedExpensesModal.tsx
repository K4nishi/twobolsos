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
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-zinc-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl border-t sm:border border-zinc-200 dark:border-zinc-800 flex flex-col"
                style={{ maxHeight: '85vh' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header - fixo */}
                <div className="flex-shrink-0 px-4 sm:px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                                <CalendarCheck className="text-purple-600 dark:text-purple-400" size={18} />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-zinc-900 dark:text-white">Despesas Fixas</h2>
                                <p className="text-xs text-zinc-500">Contas mensais</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                            <X size={20} className="text-zinc-500" />
                        </button>
                    </div>
                </div>

                {/* Content - scrollável */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 overscroll-contain">
                    {/* Total mensal */}
                    {fixedExpenses.length > 0 && (
                        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl">
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Total Mensal</p>
                            <p className="text-xl font-bold text-purple-700 dark:text-purple-300">R$ {totalMensal.toFixed(2)}</p>
                        </div>
                    )}

                    {/* Lista de despesas */}
                    <div className="space-y-2 mb-4">
                        {fixedExpenses.length === 0 && !showForm && (
                            <div className="text-center py-6">
                                <CalendarCheck size={32} className="text-zinc-300 mx-auto mb-2" />
                                <p className="text-zinc-500 text-sm">Nenhuma despesa fixa</p>
                            </div>
                        )}

                        {fixedExpenses.map(f => (
                            <div key={f.id} className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className={`w-1.5 h-6 rounded-full flex-shrink-0 ${f.tag === 'Moradia' ? 'bg-blue-500' :
                                            f.tag === 'Trabalho' ? 'bg-green-500' :
                                                f.tag === 'Educação' ? 'bg-yellow-500' :
                                                    f.tag === 'Lazer' ? 'bg-pink-500' : 'bg-zinc-400'
                                        }`} />
                                    <div className="min-w-0">
                                        <p className="font-medium text-zinc-900 dark:text-white text-sm truncate">{f.nome}</p>
                                        <p className="text-[10px] text-zinc-400">{f.tag}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <span className="font-bold text-red-500 text-sm">R$ {f.valor.toFixed(2)}</span>
                                    <button
                                        onClick={() => removeExpense(f.id)}
                                        className="p-1.5 text-zinc-400 hover:text-red-500 rounded"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Formulário */}
                    {showForm ? (
                        <form onSubmit={handleAdd} className="space-y-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
                            <p className="font-semibold text-zinc-900 dark:text-white text-sm">Nova Despesa</p>

                            {/* Nome */}
                            <input
                                value={nome}
                                onChange={e => setNome(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-purple-500"
                                placeholder="Nome (ex: Aluguel)"
                                required
                            />

                            {/* Valor */}
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">R$</span>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    value={valor}
                                    onChange={e => setValor(e.target.value)}
                                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:border-purple-500"
                                    placeholder="0,00"
                                    required
                                />
                            </div>

                            {/* Categoria */}
                            <select
                                value={tag}
                                onChange={e => setTag(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-purple-500"
                            >
                                <option>Moradia</option>
                                <option>Trabalho</option>
                                <option>Educação</option>
                                <option>Lazer</option>
                                <option>Transporte</option>
                                <option>Saúde</option>
                                <option>Outros</option>
                            </select>

                            {/* Duração - simplificado */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDuracao('indeterminado')}
                                    className={`py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${duracao === 'indeterminado'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600'
                                        }`}
                                >
                                    <InfinityIcon size={14} />
                                    Sempre
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDuracao('determinado')}
                                    className={`py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${duracao === 'determinado'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600'
                                        }`}
                                >
                                    <Clock size={14} />
                                    Por meses
                                </button>
                            </div>

                            {duracao === 'determinado' && (
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    min="1"
                                    max="120"
                                    value={meses}
                                    onChange={e => setMeses(e.target.value)}
                                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-purple-500"
                                    placeholder="Quantidade de meses"
                                />
                            )}

                            {/* Botões */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="py-2.5 rounded-lg text-sm font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="py-2.5 rounded-lg text-sm font-medium bg-purple-600 text-white flex items-center justify-center gap-1"
                                >
                                    {loading ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Plus size={16} />
                                            Salvar
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button
                            onClick={() => setShowForm(true)}
                            className="w-full py-3 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-purple-400 hover:text-purple-500 flex items-center justify-center gap-2 font-medium text-sm"
                        >
                            <Plus size={18} />
                            Adicionar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
