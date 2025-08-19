import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { createChartTickFormatter } from "@/lib/chart-formatters";

Chart.register(...registerables);

interface CashFlowProjection {
  date: string;
  projectedIncome: string;
  projectedExpenses: string;
  netFlow: string;
}

interface CashFlowChartProps {
  data?: CashFlowProjection[];
}

export default function CashFlowChart({ data }: CashFlowChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Prepare data
    const dataArray = Array.isArray(data) ? data.slice(0, 8) : [];
    const labels = dataArray.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
    });

    const incomeData = dataArray.map(item => parseFloat(item.projectedIncome));
    const expenseData = dataArray.map(item => parseFloat(item.projectedExpenses));
    const netFlowData = dataArray.map(item => parseFloat(item.netFlow));

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Ingresos Proyectados',
            data: incomeData,
            borderColor: 'hsl(159.7826, 100%, 36.0784%)',
            backgroundColor: 'hsla(159.7826, 100%, 36.0784%, 0.1)',
            tension: 0.4,
            fill: false,
          },
          {
            label: 'Egresos Proyectados',
            data: expenseData,
            borderColor: 'hsl(356.3033, 90.5579%, 54.3137%)',
            backgroundColor: 'hsla(356.3033, 90.5579%, 54.3137%, 0.1)',
            tension: 0.4,
            fill: false,
          },
          {
            label: 'Flujo Neto',
            data: netFlowData,
            borderColor: 'hsl(203.8863, 88.2845%, 53.1373%)',
            backgroundColor: 'hsla(203.8863, 88.2845%, 53.1373%, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              callback: function(value: any) {
                const numValue = typeof value === 'number' ? value : parseFloat(value);
                return createChartTickFormatter([numValue])(numValue);
              }
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
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <Card className="lg:col-span-2 bg-white border border-gray-200" data-testid="card-cash-flow-chart">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Proyección de Flujo de Caja
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-sm text-muted-foreground">
              30D
            </Button>
            <Button variant="default" size="sm" className="text-sm" data-testid="button-60d">
              60D
            </Button>
            <Button variant="ghost" size="sm" className="text-sm text-muted-foreground">
              90D
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 relative">
          <canvas ref={chartRef} className="w-full h-full" data-testid="canvas-cash-flow"></canvas>
        </div>
        <div className="flex items-center justify-center mt-4 space-x-6">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-secondary rounded-full mr-2"></div>
            <span className="text-sm text-muted-foreground">Ingresos Proyectados</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-destructive rounded-full mr-2"></div>
            <span className="text-sm text-muted-foreground">Egresos Proyectados</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
            <span className="text-sm text-muted-foreground">Flujo Neto</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
