import { X, Plus, Trash2, CalendarCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { DespesaFixa } from '../../types';
import { useToast } from '../../context/ToastContext';

interface FixedExpensesModalProps {
    isOpen: boolean;
    onClose: () => void;
    walletId: number;
}

export function FixedExpensesModal({ isOpen, onClose, walletId }: FixedExpensesModalProps) {
    const { addToast } = useToast();
    const [fixedExpenses, setFixedExpenses] = useState<DespesaFixa[]>([]);
    const [nome, setNome] = useState('');
    const [valor, setValor] = useState('');
    const [tag, setTag] = useState('Moradia');
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
                dia_vencimento: 1
            });
            addToast('success', 'Despesa fixa adicionada');
            loadExpenses();
            setNome('');
            setValor('');
            setShowForm(false);
        } catch (error) {
            addToast('error', 'Erro ao adicionar');
        } finally {
            setLoading(false);
        }
    }

    async function removeExpense(id: number) {
        try {
            await api.delete(`/negocios/${walletId}/fixas/${id}`);
            addToast('success', 'Removida');
            loadExpenses();
        } catch (error) {
            addToast('error', 'Erro ao remover');
        }
    }

    const totalMensal = fixedExpenses.reduce((acc, f) => acc + f.valor, 0);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-zinc-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden"
                style={{ maxHeight: '80vh' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                        <CalendarCheck className="text-purple-600" size={20} />
                        <h2 className="font-bold text-zinc-900 dark:text-white">Despesas Fixas</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                        <X size={20} className="text-zinc-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 60px)' }}>
                    {/* Total */}
                    {fixedExpenses.length > 0 && (
                        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
                            <p className="text-xs text-purple-600 font-medium">Total Mensal</p>
                            <p className="text-xl font-bold text-purple-700 dark:text-purple-300">R$ {totalMensal.toFixed(2)}</p>
                        </div>
                    )}

                    {/* Lista */}
                    <div className="space-y-2 mb-4">
                        {fixedExpenses.length === 0 && !showForm && (
                            <p className="text-center text-zinc-400 py-6 text-sm">Nenhuma despesa fixa</p>
                        )}

                        {fixedExpenses.map(f => (
                            <div key={f.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm truncate dark:text-white">{f.nome}</p>
                                    <p className="text-[10px] text-zinc-400">{f.tag}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                    <span className="font-bold text-red-500 text-sm">R$ {f.valor.toFixed(2)}</span>
                                    <button onClick={() => removeExpense(f.id)} className="p-1 text-zinc-400 hover:text-red-500">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Form */}
                    {showForm ? (
                        <form onSubmit={handleAdd} className="space-y-3 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                            <input
                                value={nome}
                                onChange={e => setNome(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-3 text-sm"
                                placeholder="Nome (ex: Aluguel)"
                                required
                            />

                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                value={valor}
                                onChange={e => setValor(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-3 text-sm"
                                placeholder="Valor (ex: 500.00)"
                                required
                            />

                            <select
                                value={tag}
                                onChange={e => setTag(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-3 text-sm"
                            >
                                <option>Moradia</option>
                                <option>Trabalho</option>
                                <option>Educação</option>
                                <option>Lazer</option>
                                <option>Transporte</option>
                                <option>Saúde</option>
                                <option>Outros</option>
                            </select>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="py-3 rounded-lg text-sm font-medium bg-zinc-300 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="py-3 rounded-lg text-sm font-medium bg-purple-600 text-white flex items-center justify-center gap-1"
                                >
                                    {loading ? '...' : <><Plus size={16} /> Salvar</>}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button
                            onClick={() => setShowForm(true)}
                            className="w-full py-3 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-purple-400 hover:text-purple-500 flex items-center justify-center gap-2 text-sm font-medium"
                        >
                            <Plus size={18} /> Adicionar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
