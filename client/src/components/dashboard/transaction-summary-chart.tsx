import { useRef, useEffect } from "react";
import { Chart, registerables } from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";
import { createChartTickFormatter, createTooltipFormatter, determineScale, getScaleLabel } from "@/lib/chart-formatters";

Chart.register(...registerables);

interface Transaction {
  id: string;
  amount: string;
  type: 'income' | 'expense';
  categoryId: string;
  description: string;
  date: string;
}

interface TransactionSummaryChartProps {
  transactions?: Transaction[];
  title?: string;
}

export default function TransactionSummaryChart({
  transactions = [],
  title = "Resumen de Transacciones"
}: TransactionSummaryChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const { formatAmount } = useCurrency();

  useEffect(() => {
    if (!chartRef.current || !transactions.length) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Group transactions by week for the last 8 weeks
    const now = new Date();
    const eightWeeksAgo = new Date(now);
    eightWeeksAgo.setDate(now.getDate() - 56); // 8 weeks * 7 days

    const weeklyData: { [key: string]: { income: number; expense: number } } = {};

    // Initialize weeks
    for (let i = 0; i < 8; i++) {
      const weekStart = new Date(eightWeeksAgo);
      weekStart.setDate(eightWeeksAgo.getDate() + (i * 7));
      const weekKey = weekStart.toISOString().split('T')[0];
      weeklyData[weekKey] = { income: 0, expense: 0 };
    }

    // Process transactions
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      if (transactionDate >= eightWeeksAgo && transactionDate <= now) {
        // Find the week this transaction belongs to
        const daysSinceStart = Math.floor((transactionDate.getTime() - eightWeeksAgo.getTime()) / (1000 * 60 * 60 * 24));
        const weekIndex = Math.floor(daysSinceStart / 7);

        if (weekIndex >= 0 && weekIndex < 8) {
          const weekStart = new Date(eightWeeksAgo);
          weekStart.setDate(eightWeeksAgo.getDate() + (weekIndex * 7));
          const weekKey = weekStart.toISOString().split('T')[0];

          const amount = parseFloat(transaction.amount);
          if (transaction.type === 'income') {
            weeklyData[weekKey].income += amount;
          } else {
            weeklyData[weekKey].expense += amount;
          }
        }
      }
    });

    // Prepare chart data
    const labels = Object.keys(weeklyData).map(dateStr => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
    });

    const incomeData = Object.values(weeklyData).map(week => week.income);
    const expenseData = Object.values(weeklyData).map(week => week.expense);
    const netData = Object.values(weeklyData).map(week => week.income - week.expense);

    // Determine the best scale for all values
    const allValues = [...incomeData, ...expenseData, ...netData];
    const scale = determineScale(allValues);
    const tickFormatter = createChartTickFormatter(allValues);
    const tooltipFormatter = createTooltipFormatter(allValues);

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Ingresos',
            data: incomeData,
            borderColor: 'hsl(159.7826, 100%, 36.0784%)',
            backgroundColor: 'hsla(159.7826, 100%, 36.0784%, 0.1)',
            tension: 0.4,
            fill: false,
          },
          {
            label: 'Gastos',
            data: expenseData,
            borderColor: 'hsl(0, 84.2%, 60.2%)',
            backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.1)',
            tension: 0.4,
            fill: false,
          },
          {
            label: 'Balance Neto',
            data: netData,
            borderColor: 'hsl(262.1, 83.3%, 57.8%)',
            backgroundColor: 'hsla(262.1, 83.3%, 57.8%, 0.1)',
            tension: 0.4,
            fill: true,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Tendencia de Transacciones (8 Semanas) - ${getScaleLabel(scale)}`,
            font: { size: 14, weight: 'bold' }
          },
          legend: {
            position: 'bottom',
            labels: { padding: 20, usePointStyle: true }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value: any) {
                const numValue = typeof value === 'number' ? value : parseFloat(value);
                if (isNaN(numValue) || numValue === 0) return '0';
                return tickFormatter(numValue);
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }, [transactions, formatAmount]);

  if (!transactions.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay transacciones para mostrar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 relative">
          <canvas ref={chartRef} className="w-full h-full" />
        </div>
      </CardContent>
    </Card>
  );
}
