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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-t sm:border animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 ${isIncome ? 'bg-gradient-to-b from-green-50 to-white dark:from-zinc-900 dark:to-zinc-900 shadow-green-500/10 border-green-100 dark:border-zinc-800' : 'bg-gradient-to-b from-red-50 to-white dark:from-zinc-900 dark:to-zinc-900 shadow-red-500/10 border-red-100 dark:border-zinc-800'}`}>

                {/* Header */}
                <div className="sticky top-0 px-5 sm:px-6 pt-5 sm:pt-6 pb-4 bg-inherit">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isIncome ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20'}`}>
                                {isIncome ? <ArrowUpCircle className="text-green-600 dark:text-green-500 w-6 h-6" /> : <ArrowDownCircle className="text-red-600 dark:text-red-500 w-6 h-6" />}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{isIncome ? 'Nova Receita' : 'Nova Despesa'}</h2>
                                <p className="text-xs text-zinc-500">{isIncome ? 'Adicione uma entrada de dinheiro' : 'Registre um gasto'}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                            <X size={20} className="text-zinc-500" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-5 sm:px-6 pb-6 space-y-4">
                    {/* Valor - destaque principal */}
                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Valor (R$)</label>
                        <div className="relative">
                            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold ${isIncome ? 'text-green-400' : 'text-red-400'}`}>R$</span>
                            <input
                                type="number"
                                step="0.01"
                                inputMode="decimal"
                                value={valor}
                                onChange={e => setValor(e.target.value)}
                                className={`w-full bg-white dark:bg-zinc-800 border-2 rounded-xl pl-14 pr-4 py-4 text-3xl font-bold outline-none transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-700 ${isIncome ? 'text-green-600 border-green-100 dark:border-green-500/30 focus:border-green-500' : 'text-red-600 border-red-100 dark:border-red-500/30 focus:border-red-500'}`}
                                placeholder="0,00"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Descrição</label>
                        <input
                            value={descricao}
                            onChange={e => setDescricao(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder={isIncome ? "Ex: Salário, Venda..." : "Ex: Supermercado, Uber..."}
                            required
                        />
                    </div>

                    {/* Categoria e Data - responsivo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Categoria</label>
                            <select
                                value={tag}
                                onChange={e => setTag(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
                                required
                            >
                                <option value="" disabled>Selecione</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Data</label>
                            <input
                                type="date"
                                value={data}
                                onChange={e => setData(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    {/* Botão de salvar */}
                    <button
                        disabled={loading}
                        className={`w-full text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 ${isIncome ? 'bg-gradient-to-r from-green-600 to-green-500 shadow-green-500/30' : 'bg-gradient-to-r from-red-600 to-red-500 shadow-red-500/30'}`}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={18} />
                                <span>Salvar {isIncome ? 'Receita' : 'Despesa'}</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

