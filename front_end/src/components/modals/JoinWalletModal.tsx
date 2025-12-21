import { X, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../services/api';

interface JoinWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

import { useToast } from '../../context/ToastContext';

export function JoinWalletModal({ isOpen, onClose, onSuccess }: JoinWalletModalProps) {
    const { addToast } = useToast();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    async function handleJoin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post(`/negocios/join?code=${code}`);
            addToast('success', 'Você entrou no bolso com sucesso!');
            onSuccess();
            onClose();
            setCode('');
        } catch (error) {
            addToast('error', 'Código inválido ou expirado.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Entrar em Bolso</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <X size={20} className="text-zinc-500" />
                    </button>
                </div>

                <form onSubmit={handleJoin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-2 text-center">Código do Convite</label>
                        <input
                            value={code}
                            onChange={e => setCode(e.target.value.toUpperCase())}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-center text-2xl font-mono tracking-widest text-zinc-900 dark:text-white focus:border-green-500 outline-none transition-all uppercase placeholder:opacity-20"
                            placeholder="XT902A"
                            maxLength={6}
                            required
                        />
                    </div>

                    <button
                        disabled={loading || code.length < 6}
                        className="w-full bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Validando...' : <>Entrar Agora <ArrowRight size={18} /></>}
                    </button>
                </form>
            </div>
        </div>
    );
}
