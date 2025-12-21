import { Car, Fuel, Gauge } from 'lucide-react';
import { KPI } from '../../types';

interface DriverKpiProps {
    kpis: KPI;
    onCloseKm: () => void;
}

export function DriverKpi({ kpis, onCloseKm }: DriverKpiProps) {
    return (
        <div className="glass-card mb-6 p-4 bg-gradient-to-br from-zinc-900 to-zinc-950 border-amber-500/20">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                    <Car className="text-amber-500" size={20} />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Painel do Motorista</h3>
                </div>
                <button onClick={onCloseKm} className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 px-3 py-1.5 rounded-full font-bold transition-colors">
                    Fechar KM
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="border-r border-white/5">
                    <p className="text-2xl font-bold text-white">{kpis.total_km?.toFixed(0) || 0}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">KM Total</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-white">{kpis.total_litros?.toFixed(1) || 0}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Litros</p>
                </div>
                <div className="col-span-2 h-px bg-white/5 my-1" />
                <div className="border-r border-white/5">
                    <p className="text-xl font-bold text-amber-500">{kpis.autonomia?.toFixed(1) || 0.0}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">KM/L</p>
                </div>
                <div>
                    <p className="text-xl font-bold text-green-500">R$ {kpis.rendimento?.toFixed(2) || 0.00}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Lucro/KM</p>
                </div>
            </div>
        </div>
    );
}
