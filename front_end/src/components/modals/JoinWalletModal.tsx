import { X, ArrowRight, Users } from 'lucide-react';
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                                <Users className="text-green-600 dark:text-green-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Entrar em Bolso</h2>
                                <p className="text-xs text-zinc-500">Use o código de convite</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            <X size={20} className="text-zinc-500" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleJoin} className="px-5 sm:px-6 pb-6 space-y-5">
                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-2 text-center">Código do Convite</label>
                        <input
                            value={code}
                            onChange={e => setCode(e.target.value.toUpperCase())}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-5 text-center text-2xl font-mono tracking-[0.3em] text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all uppercase placeholder:opacity-30 placeholder:tracking-[0.3em]"
                            placeholder="XXXXXX"
                            maxLength={6}
                            required
                            autoFocus
                        />
                        <p className="text-xs text-zinc-400 text-center mt-2">
                            Peça o código de 6 caracteres ao dono do bolso
                        </p>
                    </div>

                    <button
                        disabled={loading || code.length < 6}
                        className="w-full bg-gradient-to-r from-green-600 to-green-500 disabled:from-zinc-600 disabled:to-zinc-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-500/30 disabled:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Entrar Agora</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

