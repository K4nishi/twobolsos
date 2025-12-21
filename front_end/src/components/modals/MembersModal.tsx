import { X, Copy, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface MembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    walletId: number;
    isOwner: boolean;
}

interface Member {
    user_id: number;
    username: string;
    role: string;
}

export function MembersModal({ isOpen, onClose, walletId, isOwner }: MembersModalProps) {
    const { addToast } = useToast();
    const [members, setMembers] = useState<Member[]>([]);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [loadingCode, setLoadingCode] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadMembers();
            setInviteCode(null);
        }
    }, [isOpen]);

    async function loadMembers() {
        try {
            const res = await api.get(`/negocios/${walletId}/members`);
            setMembers(res.data);
        } catch (error) {
            addToast('error', 'Erro ao carregar membros. Verifique permissões.');
            console.error(error);
        }
    }

    async function generateInvite() {
        setLoadingCode(true);
        try {
            const res = await api.post(`/negocios/${walletId}/invite`);
            setInviteCode(res.data.code);
            addToast('success', 'Código gerado com sucesso!');
        } catch (error) {
            console.error(error);
            addToast('error', 'Erro ao gerar convite');
        } finally {
            setLoadingCode(false);
        }
    }

    async function removeMember(userId: number) {
        if (!confirm("Remover este membro?")) return;
        try {
            await api.delete(`/negocios/${walletId}/members/${userId}`);
            addToast('success', 'Membro removido.');
            loadMembers();
        } catch (error) {
            addToast('error', 'Erro ao remover membro');
        }
    }

    async function updateRole(userId: number, role: string) {
        try {
            await api.patch(`/negocios/${walletId}/members/${userId}`, { role });
            addToast('success', 'Permissão atualizada.');
            loadMembers();
        } catch (error) {
            addToast('error', 'Erro ao atualizar permissão');
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Users className="text-blue-500" />
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Membros</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <X size={20} className="text-zinc-500" />
                    </button>
                </div>

                {isOwner && (
                    <div className="mb-6 bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl border border-blue-100 dark:border-blue-500/20 text-center">
                        {inviteCode ? (
                            <div>
                                <p className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400 mb-2">Código de Convite</p>
                                <div className="text-3xl font-mono font-bold text-zinc-900 dark:text-white tracking-widest bg-white dark:bg-black/30 p-2 rounded-lg mb-2 select-all">
                                    {inviteCode}
                                </div>
                                <p className="text-xs text-zinc-500">Válido por 24 horas</p>
                            </div>
                        ) : (
                            <button
                                onClick={generateInvite}
                                disabled={loadingCode}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-blue-500/20"
                            >
                                {loadingCode ? 'Gerando...' : 'Gerar Código de Convite'}
                            </button>
                        )}
                    </div>
                )}

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {members.length === 0 && <p className="text-center text-zinc-500 py-4">Carregando membros...</p>}
                    {members.map(m => (
                        <div key={m.user_id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                                    {m.username.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-zinc-900 dark:text-white text-sm text-left">{m.username}</p>
                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${m.role === 'owner' ? 'bg-blue-100 text-blue-600' : 'bg-zinc-200 text-zinc-600'}`}>
                                        {m.role === 'owner' ? 'Dono' : m.role === 'editor' ? 'Pode Editar' : 'Visualizador'}
                                    </span>
                                </div>
                            </div>
                            {isOwner && m.role !== 'owner' && (
                                <div className="flex items-center gap-2">
                                    <select
                                        value={m.role}
                                        onChange={(e) => updateRole(m.user_id, e.target.value)}
                                        className="bg-white dark:bg-black text-xs border border-zinc-300 dark:border-zinc-700 rounded p-1 outline-none focus:border-blue-500"
                                    >
                                        <option value="editor">Editor</option>
                                        <option value="viewer">Visualizar</option>
                                    </select>
                                    <button onClick={() => removeMember(m.user_id)} className="text-zinc-400 hover:text-red-500 transition-colors p-2">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

