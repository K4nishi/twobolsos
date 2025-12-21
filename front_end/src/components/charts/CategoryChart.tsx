import { Pie } from 'react-chartjs-2';
import { ChartData, ChartOptions } from 'chart.js';

interface CategoryChartProps {
    data: Record<string, number>;
}

export function CategoryChart({ data }: CategoryChartProps) {
    const labels = Object.keys(data);
    const values = Object.values(data);

    const colors = [
        '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#64748b'
    ];

    const chartData: ChartData<'pie'> = {
        labels,
        datasets: [
            {
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
            },
        ],
    };

    const options: ChartOptions<'pie'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
                labels: { boxWidth: 10, color: '#71717a', font: { size: 10 } }
            },
        },
    };

    return <Pie data={chartData} options={options} />;
}
