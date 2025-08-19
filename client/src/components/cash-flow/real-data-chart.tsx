import { useRef, useEffect, useState } from "react";
import { Chart, registerables } from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, LineChart, TrendingUp, Activity, Calendar, DollarSign } from "lucide-react";
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

interface RealDataChartProps {
  transactions?: Transaction[];
  title?: string;
  timeRange?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  amountScale?: 'units' | 'thousands' | 'millions';
}

export default function RealDataChart({
  transactions = [],
  title = "Flujo de Caja Real",
  timeRange = 'weekly',
  amountScale = 'units'
}: RealDataChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area' | 'cumulative'>('line');
  const [localTimeRange, setLocalTimeRange] = useState(timeRange);
  const [localAmountScale, setLocalAmountScale] = useState(amountScale);
  const { formatAmount } = useCurrency();

  // Use the new chart formatters instead of custom logic

  useEffect(() => {
    if (!chartRef.current || !transactions.length) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Calculate date range and periods based on timeRange
    const now = new Date();
    const startDate = new Date(now);
    let periods = 0;
    let periodType = '';

    switch (localTimeRange) {
      case 'daily':
        startDate.setDate(now.getDate() - 30);
        periods = 30;
        periodType = 'day';
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - (8 * 7));
        periods = 8;
        periodType = 'week';
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 11);
        startDate.setDate(1); // Start from the 1st of the month
        periods = 12;
        periodType = 'month';
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 4);
        startDate.setMonth(0); // January
        startDate.setDate(1); // 1st of January
        periods = 5;
        periodType = 'year';
        break;
    }

    // Generate period data
    const periodData: { [key: string]: { income: number; expense: number; net: number; date: Date } } = {};

    // Initialize periods
    for (let i = 0; i < periods; i++) {
      const periodStart = new Date(startDate);

      switch (periodType) {
        case 'day':
          periodStart.setDate(startDate.getDate() + i);
          break;
        case 'week':
          periodStart.setDate(startDate.getDate() + (i * 7));
          break;
        case 'month':
          periodStart.setMonth(startDate.getMonth() + i);
          // Set to first day of month for consistency
          periodStart.setDate(1);
          break;
        case 'year':
          periodStart.setFullYear(startDate.getFullYear() + i);
          // Set to January 1st for consistency
          periodStart.setMonth(0);
          periodStart.setDate(1);
          break;
      }

      const periodKey = `${periodType}-${i}`;
      periodData[periodKey] = {
        income: 0,
        expense: 0,
        net: 0,
        date: new Date(periodStart)
      };
    }

    // Process transactions
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      if (transactionDate >= startDate && transactionDate <= now) {
        let periodIndex = 0;

        switch (periodType) {
          case 'day':
            periodIndex = Math.floor((transactionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            break;
          case 'week':
            periodIndex = Math.floor((transactionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
            break;
          case 'month':
            const yearDiff = transactionDate.getFullYear() - startDate.getFullYear();
            const monthDiff = transactionDate.getMonth() - startDate.getMonth();
            periodIndex = yearDiff * 12 + monthDiff;
            break;
          case 'year':
            periodIndex = transactionDate.getFullYear() - startDate.getFullYear();
            break;
        }

        // Add bounds checking and ensure valid period
        if (periodIndex >= 0 && periodIndex < periods && periodData[`${periodType}-${periodIndex}`]) {
          const periodKey = `${periodType}-${periodIndex}`;
          const amount = parseFloat(transaction.amount);

          if (transaction.type === 'income') {
            periodData[periodKey].income += amount;
          } else {
            periodData[periodKey].expense += amount;
          }
        }
      }
    });

    // Calculate net flow and cumulative for each period
    let cumulativeFlow = 0;
    const labels: string[] = [];
    const incomeData: number[] = [];
    const expenseData: number[] = [];
    const netData: number[] = [];
    const cumulativeData: number[] = [];

    // Sort periods by date to ensure proper chronological order
    const sortedPeriods = Object.keys(periodData)
      .sort((a, b) => {
        const periodA = periodData[a];
        const periodB = periodData[b];
        return periodA.date.getTime() - periodB.date.getTime();
      });

    sortedPeriods.forEach(periodKey => {
      const period = periodData[periodKey];

      period.net = period.income - period.expense;
      cumulativeFlow += period.net;

      // Format label based on period type
      let label = '';
      switch (periodType) {
        case 'day':
          label = period.date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
          break;
        case 'week':
          const weekStart = new Date(period.date);
          const weekEnd = new Date(period.date);
          weekEnd.setDate(weekEnd.getDate() + 6);
          label = `${weekStart.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('es-AR', { day: 'numeric' })}`;
          break;
        case 'month':
          label = period.date.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
          break;
        case 'year':
          label = period.date.getFullYear().toString();
          break;
      }

      labels.push(label);

      // Don't apply scaling here - let the formatter handle it
      incomeData.push(period.income);
      expenseData.push(period.expense);
      netData.push(period.net);
      cumulativeData.push(cumulativeFlow);
    });

    // Configure chart based on type
    let chartConfig: any = {
      type: chartType === 'area' ? 'line' : chartType === 'cumulative' ? 'line' : chartType,
      data: {
        labels,
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${title} - ${periods} ${periodType === 'day' ? 'Días' : periodType === 'week' ? 'Semanas' : periodType === 'month' ? 'Meses' : 'Años'} - ${getScaleLabel(localAmountScale)}`,
            font: { size: 14, weight: 'bold' }
          },
          legend: {
            position: 'bottom' as const,
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

                // Get all data values for context
                const allChartValues = [...incomeData, ...expenseData, ...netData, ...cumulativeData];
                const formatter = createChartTickFormatter(allChartValues, { scale: localAmountScale, currency: false });
                return formatter(numValue);
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index' as const
        }
      }
    };

    // Configure datasets based on chart type
    if (chartType === 'cumulative') {
      chartConfig.data.datasets = [
        {
          label: 'Flujo Acumulado',
          data: cumulativeData,
          borderColor: 'hsl(262.1, 83.3%, 57.8%)',
          backgroundColor: 'hsla(262.1, 83.3%, 57.8%, 0.2)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ];
    } else if (chartType === 'area') {
      chartConfig.data.datasets = [
        {
          label: 'Ingresos',
          data: incomeData,
          borderColor: 'hsl(159.7826, 100%, 36.0784%)',
          backgroundColor: 'hsla(159.7826, 100%, 36.0784%, 0.3)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Gastos',
          data: expenseData,
          borderColor: 'hsl(0, 84.2%, 60.2%)',
          backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.3)',
          tension: 0.4,
          fill: true,
        }
      ];
    } else {
      chartConfig.data.datasets = [
        {
          label: 'Ingresos',
          data: incomeData,
          borderColor: 'hsl(159.7826, 100%, 36.0784%)',
          backgroundColor: chartType === 'bar' ? 'hsla(159.7826, 100%, 36.0784%, 0.8)' : 'hsla(159.7826, 100%, 36.0784%, 0.1)',
          tension: 0.4,
          fill: false,
        },
        {
          label: 'Gastos',
          data: expenseData,
          borderColor: 'hsl(0, 84.2%, 60.2%)',
          backgroundColor: chartType === 'bar' ? 'hsla(0, 84.2%, 60.2%, 0.8)' : 'hsla(0, 84.2%, 60.2%, 0.1)',
          tension: 0.4,
          fill: false,
        },
        {
          label: 'Flujo Neto',
          data: netData,
          borderColor: 'hsl(262.1, 83.3%, 57.8%)',
          backgroundColor: chartType === 'bar' ? 'hsla(262.1, 83.3%, 57.8%, 0.8)' : 'hsla(262.1, 83.3%, 57.8%, 0.2)',
          tension: 0.4,
          fill: chartType === 'line' ? false : true,
        }
      ];
    }

    chartInstance.current = new Chart(ctx, chartConfig);
  }, [transactions, chartType, localTimeRange, localAmountScale, title]);

  const getChartIcon = () => {
    switch (chartType) {
      case 'bar': return <BarChart3 className="h-4 w-4" />;
      case 'area': return <Activity className="h-4 w-4" />;
      case 'cumulative': return <TrendingUp className="h-4 w-4" />;
      default: return <LineChart className="h-4 w-4" />;
    }
  };

  const getChartTypeLabel = () => {
    switch (chartType) {
      case 'bar': return 'Barras';
      case 'area': return 'Área';
      case 'cumulative': return 'Acumulado';
      default: return 'Líneas';
    }
  };

  if (!transactions.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay datos de transacciones para mostrar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              {getChartIcon()}
              {getChartTypeLabel()}
            </Badge>
          </div>
        </div>

        {/* Compact Controls */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {/* Chart Type Controls */}
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-1">
            <Button
              variant={chartType === 'line' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('line')}
              className="h-7 px-2"
            >
              <LineChart className="h-3 w-3" />
            </Button>
            <Button
              variant={chartType === 'bar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('bar')}
              className="h-7 px-2"
            >
              <BarChart3 className="h-3 w-3" />
            </Button>
            <Button
              variant={chartType === 'area' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('area')}
              className="h-7 px-2"
            >
              <Activity className="h-3 w-3" />
            </Button>
            <Button
              variant={chartType === 'cumulative' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('cumulative')}
              className="h-7 px-2"
            >
              <TrendingUp className="h-3 w-3" />
            </Button>
          </div>

          {/* Time Range Controls */}
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-1">
            <Button
              variant={localTimeRange === 'daily' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLocalTimeRange('daily')}
              className="h-7 px-2 text-xs"
            >
              Diario
            </Button>
            <Button
              variant={localTimeRange === 'weekly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLocalTimeRange('weekly')}
              className="h-7 px-2 text-xs"
            >
              Semanal
            </Button>
            <Button
              variant={localTimeRange === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLocalTimeRange('monthly')}
              className="h-7 px-2 text-xs"
            >
              Mensual
            </Button>
            <Button
              variant={localTimeRange === 'yearly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLocalTimeRange('yearly')}
              className="h-7 px-2 text-xs"
            >
              Anual
            </Button>
          </div>

          {/* Amount Scale Controls */}
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-1">
            <Button
              variant={localAmountScale === 'units' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLocalAmountScale('units')}
              className="h-7 px-2 text-xs"
            >
              $ Unidades
            </Button>
            <Button
              variant={localAmountScale === 'thousands' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLocalAmountScale('thousands')}
              className="h-7 px-2 text-xs"
            >
              $ Miles
            </Button>
            <Button
              variant={localAmountScale === 'millions' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLocalAmountScale('millions')}
              className="h-7 px-2 text-xs"
            >
              $ Millones
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 relative">
          <canvas ref={chartRef} className="w-full h-full" />
        </div>
      </CardContent>
    </Card>
  );
}
