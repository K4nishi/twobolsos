import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextData {
    addToast: (type: ToastType, message: string) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = Math.random().toString(36).substring(7);
        setToasts((state) => [...state, { id, type, message }]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((state) => state.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const icons = {
        success: <CheckCircle size={20} className="text-green-500" />,
        error: <AlertCircle size={20} className="text-red-500" />,
        info: <Info size={20} className="text-blue-500" />,
        warning: <AlertTriangle size={20} className="text-amber-500" />
    };

    const bgColors = {
        success: 'bg-white dark:bg-zinc-900 border-green-500/50',
        error: 'bg-white dark:bg-zinc-900 border-red-500/50',
        info: 'bg-white dark:bg-zinc-900 border-blue-500/50',
        warning: 'bg-white dark:bg-zinc-900 border-amber-500/50'
    };

    return (
        <div className={`
            pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border-l-4 
            ${bgColors[toast.type]} 
            animate-in slide-in-from-right-full fade-in duration-300
        `}>
            <div className="mt-0.5 shrink-0">{icons[toast.type]}</div>
            <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-white leading-tight">{toast.message}</p>
            </div>
            <button onClick={() => onRemove(toast.id)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                <X size={16} />
            </button>

            {/* Progress Bar (Simple CSS Animation) */}
            <div className="absolute bottom-0 left-0 h-0.5 bg-current opacity-20 w-full animate-toast-progress" />
        </div>
    );
}
