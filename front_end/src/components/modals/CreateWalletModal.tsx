import { X, Save, Car, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../services/api';

interface CreateWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

import { useToast } from '../../context/ToastContext';

export function CreateWalletModal({ isOpen, onClose, onSuccess }: CreateWalletModalProps) {
    const { addToast } = useToast();
    const [nome, setNome] = useState('');
    const [categoria, setCategoria] = useState('PADRAO');
    const [cor, setCor] = useState('#3b82f6');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/negocios', { nome, categoria, cor });
            addToast('success', 'Carteira criada com sucesso!');
            onSuccess();
            onClose();
        } catch (error) {
            addToast('error', 'Erro ao criar carteira. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Nova Carteira</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <X size={20} className="text-zinc-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Nome da Carteira</label>
                        <input
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Ex: Minha Carteira"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Categoria</label>
                            <div className="relative">
                                <select
                                    value={categoria}
                                    onChange={e => setCategoria(e.target.value)}
                                    className="w-full appearance-none bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    <option value="PADRAO">Padrão</option>
                                    <option value="MOTORISTA">Motorista App</option>
                                </select>
                                <div className="absolute right-3 top-3.5 pointer-events-none text-zinc-500">
                                    {categoria === 'PADRAO' ? <DollarSign size={16} /> : <Car size={16} />}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Cor</label>
                            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2">
                                <input
                                    type="color"
                                    value={cor}
                                    onChange={e => setCor(e.target.value)}
                                    className="w-8 h-8 rounded-lg cursor-pointer border-none p-0 bg-transparent"
                                />
                                <span className="text-sm text-zinc-500 font-mono">{cor}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={18} /> Criar Carteira</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
