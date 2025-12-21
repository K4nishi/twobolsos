import { Outlet } from 'react-router-dom';
import { ThemeToggle } from './ui/ThemeToggle';
import { ReactNode } from 'react';

interface LayoutProps {
    children?: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
            <ThemeToggle />
            <main className="container mx-auto px-4 py-8">
                {children || <Outlet />}
            </main>
        </div>
    );
}
