import { X, Car } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../services/api';

interface CloseKmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    walletId: number;
}

import { useToast } from '../../context/ToastContext';

export function CloseKmModal({ isOpen, onClose, onSuccess, walletId }: CloseKmModalProps) {
    const { addToast } = useToast();
    const [km, setKm] = useState('');
    const [data, setData] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            // Sends a 'neutral' transaction or just for record
            await api.post('/transacoes', {
                negocio_id: walletId,
                valor: 0,
                descricao: 'Fechamento KM',
                tipo: 'despesa', // Standard accounting
                tag: 'KM',
                data,
                km: parseFloat(km),
                meio_pagamento: 'Outros'
            });
            addToast('success', 'KM registrado com sucesso!');
            onSuccess();
            onClose();
            setKm('');
        } catch (error) {
            addToast('error', 'Erro ao registrar KM');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Car className="text-amber-500" />
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Fechar KM do Dia</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <X size={20} className="text-zinc-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-500/10 p-3 rounded-lg flex items-start gap-3">
                        <div className="mt-0.5"><Car size={16} className="text-amber-600 dark:text-amber-500" /></div>
                        <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                            Registra apenas a rodagem do veículo. Não afeta o saldo financeiro da carteira.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">KM Rodado</label>
                        <input
                            type="number"
                            value={km}
                            onChange={e => setKm(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-amber-500/50 rounded-xl p-4 text-3xl font-bold text-amber-600 dark:text-amber-500 outline-none transition-all text-center placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                            placeholder="000"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Data</label>
                        <input
                            type="date"
                            value={data}
                            onChange={e => setData(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                            required
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? 'Registrando...' : 'Confirmar KM'}
                    </button>
                </form>
            </div>
        </div>
    );
}
