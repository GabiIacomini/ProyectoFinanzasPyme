import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { TrendingUp, TrendingDown, BarChart3, LineChart } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";

Chart.register(...registerables);

interface CashFlowProjection {
  date: string;
  projectedIncome: string;
  projectedExpenses: string;
  netFlow: string;
}

interface AdvancedCashFlowChartProps {
  data?: CashFlowProjection[];
  title?: string;
  height?: number;
}

export default function AdvancedCashFlowChart({
  data,
  title = "Análisis Avanzado de Flujo de Caja",
  height = 400
}: AdvancedCashFlowChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('area');
  const [showCumulative, setShowCumulative] = useState(false);
  const { formatAmount } = useCurrency();

  useEffect(() => {
    if (!chartRef.current || !data) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Prepare data
    const dataArray = Array.isArray(data) ? data : [];
    const labels = dataArray.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
    });

    const incomeData = dataArray.map(item => parseFloat(item.projectedIncome));
    const expenseData = dataArray.map(item => parseFloat(item.projectedExpenses));
    const netFlowData = dataArray.map(item => parseFloat(item.netFlow));

    // Calculate cumulative data if needed
    let cumulativeNetFlow: number[] = [];
    if (showCumulative) {
      let cumulative = 0;
      cumulativeNetFlow = netFlowData.map(value => {
        cumulative += value;
        return cumulative;
      });
    }

    const datasets = [
      {
        label: 'Ingresos Proyectados',
        data: incomeData,
        borderColor: 'hsl(159.7826, 100%, 36.0784%)',
        backgroundColor: chartType === 'area' ? 'hsla(159.7826, 100%, 36.0784%, 0.1)' : 'hsl(159.7826, 100%, 36.0784%)',
        tension: 0.4,
        fill: chartType === 'area',
      },
      {
        label: 'Egresos Proyectados',
        data: expenseData,
        borderColor: 'hsl(356.3033, 90.5579%, 54.3137%)',
        backgroundColor: chartType === 'area' ? 'hsla(356.3033, 90.5579%, 54.3137%, 0.1)' : 'hsl(356.3033, 90.5579%, 54.3137%)',
        tension: 0.4,
        fill: chartType === 'area',
      },
      {
        label: showCumulative ? 'Flujo Neto Acumulado' : 'Flujo Neto',
        data: showCumulative ? cumulativeNetFlow : netFlowData,
        borderColor: 'hsl(203.8863, 88.2845%, 53.1373%)',
        backgroundColor: chartType === 'area' ? 'hsla(203.8863, 88.2845%, 53.1373%, 0.2)' : 'hsl(203.8863, 88.2845%, 53.1373%)',
        tension: 0.4,
        fill: chartType === 'area',
        borderWidth: 3,
      },
    ];

    chartInstance.current = new Chart(ctx, {
      type: chartType === 'area' ? 'line' : chartType,
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
            },
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                const value = formatAmount(context.parsed.y.toString());
                return `${context.dataset.label}: ${value}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              callback: function(value) {
                const num = Number(value);
                if (Math.abs(num) >= 1000000) {
                  return '$' + (num / 1000000).toFixed(1) + 'M';
                } else if (Math.abs(num) >= 1000) {
                  return '$' + (num / 1000).toFixed(0) + 'K';
                }
                return '$' + num.toLocaleString();
              },
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
        elements: {
          point: {
            radius: chartType === 'line' || chartType === 'area' ? 4 : 0,
            hoverRadius: 6,
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, chartType, showCumulative, formatAmount]);

  const positiveFlows = data?.filter(item => parseFloat(item.netFlow) > 0).length || 0;
  const negativeFlows = data?.filter(item => parseFloat(item.netFlow) < 0).length || 0;

  return (
    <Card className="bg-white border border-gray-200" data-testid="card-advanced-cashflow">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {title}
            </CardTitle>
            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-1 text-secondary" />
                <span>{positiveFlows} periodos positivos</span>
              </div>
              <div className="flex items-center">
                <TrendingDown className="h-4 w-4 mr-1 text-destructive" />
                <span>{negativeFlows} periodos negativos</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center space-x-2">
            <Button
              variant={chartType === 'line' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('line')}
              data-testid="button-line-chart"
            >
              <LineChart className="mr-1 h-4 w-4" />
              Líneas
            </Button>
            <Button
              variant={chartType === 'bar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('bar')}
              data-testid="button-bar-chart"
            >
              <BarChart3 className="mr-1 h-4 w-4" />
              Barras
            </Button>
            <Button
              variant={chartType === 'area' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('area')}
              data-testid="button-area-chart"
            >
              <TrendingUp className="mr-1 h-4 w-4" />
              Área
            </Button>
            <Button
              variant={showCumulative ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowCumulative(!showCumulative)}
              data-testid="button-cumulative"
            >
              {showCumulative ? 'Normal' : 'Acumulado'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }} className="relative">
          <canvas ref={chartRef} className="w-full h-full" data-testid="canvas-advanced-cashflow"></canvas>
        </div>
      </CardContent>
    </Card>
  );
}
