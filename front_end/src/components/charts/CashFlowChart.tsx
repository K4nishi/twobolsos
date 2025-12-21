import { Line } from 'react-chartjs-2';
import { ChartData, ChartOptions } from 'chart.js';

interface CashFlowChartProps {
    data: {
        labels: string[];
        receitas: number[];
        despesas: number[];
    };
}

export function CashFlowChart({ data }: CashFlowChartProps) {
    const chartData: ChartData<'line'> = {
        labels: data.labels,
        datasets: [
            {
                label: 'Receitas',
                data: data.receitas,
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                tension: 0.4,
                fill: true,
            },
            {
                label: 'Despesas',
                data: data.despesas,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                fill: true,
            },
        ],
    };

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: { color: '#71717a' }
            },
            title: { display: false },
        },
        scales: {
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#71717a' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#71717a' }
            }
        }
    };

    return <Line data={chartData} options={options} />;
}
