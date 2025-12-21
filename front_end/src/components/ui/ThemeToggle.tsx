import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-zinc-800/50 backdrop-blur-sm border border-white/10 text-zinc-100 hover:bg-zinc-700 transition-colors fixed top-4 right-4 z-50 shadow-lg"
            aria-label="Toggle Theme"
        >
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} className="text-amber-400" />}
        </button>
    );
}
