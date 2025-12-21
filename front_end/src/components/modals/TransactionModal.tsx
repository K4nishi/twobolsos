import { X, Save, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../services/api';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    walletId: number;
    type: 'receita' | 'despesa';
}

import { useToast } from '../../context/ToastContext';

export function TransactionModal({ isOpen, onClose, onSuccess, walletId, type }: TransactionModalProps) {
    const { addToast } = useToast();
    const [valor, setValor] = useState('');
    const [descricao, setDescricao] = useState('');
    const [tag, setTag] = useState('');
    const [data, setData] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const categories = type === 'receita'
        ? ['Salário', 'Vendas', 'Investimentos', 'Presente', 'Outros']
        : ['Alimentação', 'Transporte', 'Moradia', 'Educação', 'Lazer', 'Saúde', 'Compras', 'Manutenção', 'Outros'];

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/transacoes', {
                negocio_id: walletId,
                valor: parseFloat(valor),
                descricao,
                tipo: type,
                data,
                tag: tag || 'Outros',
                meio_pagamento: 'Dinheiro'
            });
            addToast('success', `${type === 'receita' ? 'Receita' : 'Despesa'} adicionada com sucesso!`);
            onSuccess();
            onClose();
            setValor('');
            setDescricao('');
            setTag('');
        } catch (error) {
            addToast('error', 'Erro ao adicionar transação');
        } finally {
            setLoading(false);
        }
    }

    const isIncome = type === 'receita';

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className={`w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl border-t sm:border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200 ${isIncome ? 'bg-green-50 dark:bg-zinc-900 shadow-green-500/10' : 'bg-red-50 dark:bg-zinc-900 shadow-red-500/10'}`}>

                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        {isIncome ? <ArrowUpCircle className="text-green-500 w-8 h-8" /> : <ArrowDownCircle className="text-red-500 w-8 h-8" />}
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{isIncome ? 'Nova Receita' : 'Nova Despesa'}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <X size={20} className="text-zinc-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Valor (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={valor}
                            onChange={e => setValor(e.target.value)}
                            className={`w-full bg-white dark:bg-zinc-800 border-2 rounded-xl p-4 text-3xl font-bold outline-none transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-700 ${isIncome ? 'text-green-600 border-green-100 focus:border-green-500' : 'text-red-600 border-red-100 focus:border-red-500'}`}
                            placeholder="0.00"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Descrição</label>
                            <input
                                value={descricao}
                                onChange={e => setDescricao(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Ex: Supermercado"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Categoria</label>
                            <select
                                value={tag}
                                onChange={e => setTag(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                required
                            >
                                <option value="" disabled>Selecione</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Data</label>
                        <input
                            type="date"
                            value={data}
                            onChange={e => setData(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            required
                        />
                    </div>

                    <button
                        disabled={loading}
                        className={`w-full text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 ${isIncome ? 'bg-green-600 hover:bg-green-500 shadow-green-500/20' : 'bg-red-600 hover:bg-red-500 shadow-red-500/20'}`}
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={18} /> Salvar</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
