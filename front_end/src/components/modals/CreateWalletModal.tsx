import { X, Save, Car, DollarSign, Wallet } from 'lucide-react';
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

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-t sm:border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
                {/* Header */}
                <div className="sticky top-0 px-5 sm:px-6 pt-5 sm:pt-6 pb-4 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                                <Wallet className="text-blue-600 dark:text-blue-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Nova Carteira</h2>
                                <p className="text-xs text-zinc-500">Crie um novo bolso financeiro</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            <X size={20} className="text-zinc-500" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 space-y-5">
                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-2">Nome da Carteira</label>
                        <input
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ex: Minha Carteira Principal"
                            required
                        />
                    </div>

                    {/* Categoria - botões de seleção em vez de dropdown */}
                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-2">Tipo de Carteira</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setCategoria('PADRAO')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${categoria === 'PADRAO'
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                                    }`}
                            >
                                <DollarSign size={24} className={categoria === 'PADRAO' ? 'text-blue-600' : 'text-zinc-400'} />
                                <span className={`text-sm font-medium ${categoria === 'PADRAO' ? 'text-blue-600' : 'text-zinc-600 dark:text-zinc-400'}`}>Padrão</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setCategoria('MOTORISTA')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${categoria === 'MOTORISTA'
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                                    }`}
                            >
                                <Car size={24} className={categoria === 'MOTORISTA' ? 'text-blue-600' : 'text-zinc-400'} />
                                <span className={`text-sm font-medium ${categoria === 'MOTORISTA' ? 'text-blue-600' : 'text-zinc-600 dark:text-zinc-400'}`}>Motorista</span>
                            </button>
                        </div>
                    </div>

                    {/* Cor - paleta visual */}
                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-2">Cor de Identificação</label>
                        <div className="flex items-center gap-2 flex-wrap">
                            {colors.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setCor(c)}
                                    className={`w-10 h-10 rounded-xl transition-all ${cor === c ? 'ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-900' : ''
                                        }`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                            <div className="relative">
                                <input
                                    type="color"
                                    value={cor}
                                    onChange={e => setCor(e.target.value)}
                                    className="w-10 h-10 rounded-xl cursor-pointer border-2 border-dashed border-zinc-300 dark:border-zinc-600 p-0 bg-transparent opacity-0 absolute inset-0"
                                />
                                <div className="w-10 h-10 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center text-zinc-400 text-lg">+</div>
                            </div>
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={18} />
                                <span>Criar Carteira</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

