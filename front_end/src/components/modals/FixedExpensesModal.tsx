import { X, Plus, Trash2, CalendarCheck } from 'lucide-react';
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
    const [loading, setLoading] = useState(false);

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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <CalendarCheck className="text-purple-500" />
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Despesas Fixas</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <X size={20} className="text-zinc-500" />
                    </button>
                </div>

                <form onSubmit={handleAdd} className="flex gap-2 mb-6">
                    <input
                        value={nome}
                        onChange={e => setNome(e.target.value)}
                        className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm text-zinc-900 dark:text-white outline-none focus:border-purple-500"
                        placeholder="Nome (ex: Aluguel)"
                        required
                    />
                    <select
                        value={tag}
                        onChange={e => setTag(e.target.value)}
                        className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm text-zinc-900 dark:text-white outline-none focus:border-purple-500"
                    >
                        <option>Moradia</option>
                        <option>Trabalho</option>
                        <option>Educação</option>
                        <option>Lazer</option>
                    </select>
                    <input
                        type="number"
                        value={valor}
                        onChange={e => setValor(e.target.value)}
                        className="w-24 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm text-zinc-900 dark:text-white outline-none focus:border-purple-500"
                        placeholder="R$"
                        required
                    />
                    <button disabled={loading} className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-lg">
                        <Plus size={20} />
                    </button>
                </form>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {fixedExpenses.length === 0 && <p className="text-center text-zinc-500 py-4">Nenhuma despesa fixa cadastrada.</p>}
                    {fixedExpenses.map(f => (
                        <div key={f.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
                            <div>
                                <p className="font-bold text-zinc-900 dark:text-white text-sm">{f.nome}</p>
                                <span className="text-xs bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-300">{f.tag}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-red-500">R$ {f.valor.toFixed(2)}</span>
                                <button onClick={() => removeExpense(f.id)} className="text-zinc-400 hover:text-red-500 transition-colors">
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
