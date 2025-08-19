import { useRef, useEffect, useState } from "react";
import { Chart, registerables } from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, BarChart3, LineChart, Activity, DollarSign, Calendar, Info } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";

Chart.register(...registerables);

interface Transaction {
  id: string;
  amount: string;
  type: 'income' | 'expense';
  categoryId: string;
  description: string;
  date: string;
}

interface EnhancedAdvancedCashFlowChartProps {
  transactions?: Transaction[];
  title?: string;
  height?: number;
}

export default function EnhancedAdvancedCashFlowChart({
  transactions = [],
  title = "Análisis Avanzado de Flujo de Caja",
  height = 400
}: EnhancedAdvancedCashFlowChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [analysisType, setAnalysisType] = useState<'trends' | 'volatility' | 'seasonal' | 'forecast'>('trends');
  const [timeFrame, setTimeFrame] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');
  const { formatAmount } = useCurrency();

  useEffect(() => {
    if (!chartRef.current || !transactions.length) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Process data based on analysis type and time frame
    const processedData = processTransactionData(transactions, analysisType, timeFrame);

    const chartConfig = getChartConfiguration(analysisType, processedData);
    chartInstance.current = new Chart(ctx, chartConfig);
  }, [transactions, analysisType, timeFrame, formatAmount]);

  const processTransactionData = (transactions: Transaction[], type: string, frame: string) => {
    const now = new Date();
    const periods = frame === 'weekly' ? 12 : frame === 'monthly' ? 12 : 4; // quarters
    const data: any[] = [];

    // Generate time periods
    for (let i = periods - 1; i >= 0; i--) {
      const periodStart = new Date(now);
      const periodEnd = new Date(now);

      if (frame === 'weekly') {
        periodStart.setDate(now.getDate() - (i + 1) * 7);
        periodEnd.setDate(now.getDate() - i * 7);
      } else if (frame === 'monthly') {
        periodStart.setMonth(now.getMonth() - (i + 1));
        periodEnd.setMonth(now.getMonth() - i);
      } else { // quarterly
        periodStart.setMonth(now.getMonth() - (i + 1) * 3);
        periodEnd.setMonth(now.getMonth() - i * 3);
      }

      // Filter transactions for this period
      const periodTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= periodStart && transactionDate < periodEnd;
      });

      const income = periodTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const expense = periodTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const netFlow = income - expense;

      let label = '';
      if (frame === 'weekly') {
        label = periodStart.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
      } else if (frame === 'monthly') {
        label = periodStart.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
      } else {
        label = `Q${Math.floor(periodStart.getMonth() / 3) + 1} ${periodStart.getFullYear()}`;
      }

      data.push({
        label,
        income,
        expense,
        netFlow,
        date: periodStart
      });
    }

    return data;
  };

  const getChartConfiguration = (type: string, data: any[]) => {
    const labels = data.map(d => d.label);

    switch (type) {
      case 'trends':
        return {
          type: 'line' as const,
          data: {
            labels,
            datasets: [
              {
                label: 'Ingresos',
                data: data.map(d => d.income),
                borderColor: 'hsl(159.7826, 100%, 36.0784%)',
                backgroundColor: 'hsla(159.7826, 100%, 36.0784%, 0.1)',
                tension: 0.4,
                fill: false,
                pointRadius: 5,
                pointHoverRadius: 7,
              },
              {
                label: 'Gastos',
                data: data.map(d => d.expense),
                borderColor: 'hsl(0, 84.2%, 60.2%)',
                backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.1)',
                tension: 0.4,
                fill: false,
                pointRadius: 5,
                pointHoverRadius: 7,
              },
              {
                label: 'Flujo Neto',
                data: data.map(d => d.netFlow),
                borderColor: 'hsl(262.1, 83.3%, 57.8%)',
                backgroundColor: 'hsla(262.1, 83.3%, 57.8%, 0.2)',
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8,
                borderWidth: 3,
              }
            ]
          },
          options: getBaseOptions('Análisis de Tendencias', data)
        };

      case 'volatility':
        const volatilityData = data.map((d, i) => {
          if (i === 0) return 0;
          const previous = data[i - 1];
          return Math.abs(d.netFlow - previous.netFlow);
        });

        return {
          type: 'bar' as const,
          data: {
            labels,
            datasets: [
              {
                label: 'Volatilidad del Flujo',
                data: volatilityData,
                backgroundColor: data.map(d =>
                  d.netFlow >= 0 ? 'hsla(159.7826, 100%, 36.0784%, 0.7)' : 'hsla(0, 84.2%, 60.2%, 0.7)'
                ),
                borderColor: data.map(d =>
                  d.netFlow >= 0 ? 'hsl(159.7826, 100%, 36.0784%)' : 'hsl(0, 84.2%, 60.2%)'
                ),
                borderWidth: 1,
              }
            ]
          },
          options: getBaseOptions('Análisis de Volatilidad', data)
        };

      case 'seasonal':
        // Group by month to show seasonal patterns
        const monthlyAverages = new Array(12).fill(0);
        const monthCounts = new Array(12).fill(0);

        data.forEach(d => {
          const month = d.date.getMonth();
          monthlyAverages[month] += d.netFlow;
          monthCounts[month]++;
        });

        const seasonalData = monthlyAverages.map((sum, i) =>
          monthCounts[i] > 0 ? sum / monthCounts[i] : 0
        );

        const monthNames = [
          'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
          'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];

        return {
          type: 'radar' as const,
          data: {
            labels: monthNames,
            datasets: [
              {
                label: 'Promedio Flujo Neto Mensual',
                data: seasonalData,
                borderColor: 'hsl(262.1, 83.3%, 57.8%)',
                backgroundColor: 'hsla(262.1, 83.3%, 57.8%, 0.2)',
                pointBackgroundColor: 'hsl(262.1, 83.3%, 57.8%)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'hsl(262.1, 83.3%, 57.8%)',
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: 'Análisis Estacional',
                font: { size: 16, weight: 'bold' as const }
              },
              legend: {
                position: 'top' as const,
              }
            },
            scales: {
              r: {
                beginAtZero: true,
                ticks: {
                  callback: function(value: any) {
                    return formatAmount(value.toString());
                  }
                }
              }
            }
          }
        };

      case 'forecast':
        // Simple linear regression for forecast
        const forecastPeriods = 6;
        const forecastData = [...data];

        // Calculate trend
        const xValues = data.map((_, i) => i);
        const yValues = data.map(d => d.netFlow);
        const n = data.length;

        const sumX = xValues.reduce((a, b) => a + b, 0);
        const sumY = yValues.reduce((a, b) => a + b, 0);
        const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
        const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Generate forecast
        for (let i = 0; i < forecastPeriods; i++) {
          const futureDate = new Date(data[data.length - 1].date);
          if (timeFrame === 'weekly') {
            futureDate.setDate(futureDate.getDate() + (i + 1) * 7);
          } else if (timeFrame === 'monthly') {
            futureDate.setMonth(futureDate.getMonth() + (i + 1));
          } else {
            futureDate.setMonth(futureDate.getMonth() + (i + 1) * 3);
          }

          const forecastValue = slope * (data.length + i) + intercept;
          forecastData.push({
            label: futureDate.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }),
            income: 0,
            expense: 0,
            netFlow: forecastValue,
            date: futureDate,
            isForecast: true
          });
        }

        return {
          type: 'line' as const,
          data: {
            labels: forecastData.map(d => d.label),
            datasets: [
              {
                label: 'Flujo Histórico',
                data: [...data.map(d => d.netFlow), ...new Array(forecastPeriods).fill(null)],
                borderColor: 'hsl(262.1, 83.3%, 57.8%)',
                backgroundColor: 'hsla(262.1, 83.3%, 57.8%, 0.2)',
                tension: 0.4,
                fill: false,
                pointRadius: 5,
                spanGaps: false,
              },
              {
                label: 'Proyección',
                data: [...new Array(data.length).fill(null), ...forecastData.slice(data.length).map(d => d.netFlow)],
                borderColor: 'hsl(25, 95%, 53%)',
                backgroundColor: 'hsla(25, 95%, 53%, 0.2)',
                borderDash: [5, 5],
                tension: 0.4,
                fill: false,
                pointRadius: 5,
                spanGaps: false,
              }
            ]
          },
          options: getBaseOptions('Proyección de Flujo de Caja', forecastData)
        };

      default:
        return getChartConfiguration('trends', data);
    }
  };

  const getBaseOptions = (title: string, data: any[]) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: title,
        font: { size: 16, weight: 'bold' as const }
      },
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            const value = formatAmount(context.parsed.y.toString());
            return `${context.dataset.label}: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value: any) {
            return formatAmount(value.toString());
          }
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  });

  if (!transactions.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay datos suficientes para el análisis avanzado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAnalysisInfo = (type: string) => {
    switch (type) {
      case 'trends':
        return {
          title: "Análisis de Tendencias",
          description: "Muestra la evolución temporal de ingresos (verde), gastos (rojo) y flujo neto (azul). Las líneas ascendentes indican crecimiento, mientras que las descendentes señalan declive. Use este gráfico para identificar patrones de crecimiento, estacionalidad en ventas o incrementos en costos operativos.",
          insights: "• Identifica tendencias de crecimiento o declive\n• Compara evolución de ingresos vs gastos\n• Detecta cambios en márgenes operativos\n• Evalúa efectividad de estrategias comerciales"
        };
      case 'volatility':
        return {
          title: "Análisis de Volatilidad",
          description: "Mide la variabilidad del flujo de caja usando desviación estándar. Las barras altas indican períodos de mayor incertidumbre financiera. Un flujo volátil sugiere necesidad de mayor reserva de efectivo y planificación de contingencia para mantener estabilidad operativa.",
          insights: "• Evalúa estabilidad financiera del negocio\n• Identifica períodos de mayor riesgo\n• Planifica reservas de efectivo necesarias\n• Detecta patrones de incertidumbre financiera"
        };
      case 'seasonal':
        return {
          title: "Análisis Estacional",
          description: "Compara el rendimiento financiero por períodos equivalentes (mismo mes, trimestre, etc.) a través del tiempo. Revela patrones recurrentes como temporadas altas/bajas de ventas, gastos cíclicos o tendencias específicas del sector empresarial.",
          insights: "• Identifica temporadas altas y bajas\n• Planifica inventario y recursos estacionales\n• Optimiza campañas de marketing por época\n• Anticipa necesidades de capital de trabajo"
        };
      case 'forecast':
        return {
          title: "Proyección de Flujo",
          description: "Predice el comportamiento futuro del flujo de caja basado en tendencias históricas mediante regresión lineal. La línea sólida representa datos reales, mientras que la punteada muestra la proyección. Use para planificación estratégica y toma de decisiones de inversión.",
          insights: "• Planifica necesidades de financiamiento futuro\n• Evalúa viabilidad de nuevas inversiones\n• Anticipa problemas de liquidez\n• Establece objetivos financieros realistas"
        };
      default:
        return {
          title: "Análisis Avanzado",
          description: "Análisis avanzado de datos financieros.",
          insights: "Seleccione un tipo de análisis para ver información detallada."
        };
    }
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>

            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Análisis Avanzado
            </Badge>
          </div>

        {/* Analysis Controls */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {/* Analysis Type */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={analysisType === 'trends' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setAnalysisType('trends')}
                className="h-7 px-2 text-xs"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Tendencias
              </Button>
              <Button
                variant={analysisType === 'volatility' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setAnalysisType('volatility')}
                className="h-7 px-2 text-xs"
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                Volatilidad
              </Button>
              <Button
                variant={analysisType === 'seasonal' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setAnalysisType('seasonal')}
                className="h-7 px-2 text-xs"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Estacional
              </Button>
              <Button
                variant={analysisType === 'forecast' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setAnalysisType('forecast')}
                className="h-7 px-2 text-xs"
              >
                <DollarSign className="h-3 w-3 mr-1" />
                Proyección
              </Button>
            </div>

            {/* Single Info Icon with Dynamic Content */}
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  data-testid="chart-info-tooltip"
                >
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-md p-4 bg-white dark:bg-gray-800 border shadow-lg">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-foreground">
                    {getAnalysisInfo(analysisType).title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {getAnalysisInfo(analysisType).description}
                  </p>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs font-medium mb-2 text-foreground">Insights clave:</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {getAnalysisInfo(analysisType).insights.split('\n').map((insight, index) => (
                        <div key={index} className="flex items-start gap-1">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span>{insight.replace('• ', '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Time Frame */}
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-1">
            <Button
              variant={timeFrame === 'weekly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeFrame('weekly')}
              className="h-7 px-2 text-xs"
            >
              Semanal
            </Button>
            <Button
              variant={timeFrame === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeFrame('monthly')}
              className="h-7 px-2 text-xs"
            >
              Mensual
            </Button>
            <Button
              variant={timeFrame === 'quarterly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeFrame('quarterly')}
              className="h-7 px-2 text-xs"
            >
              Trimestral
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`relative`} style={{ height: `${height}px` }}>
          <canvas ref={chartRef} className="w-full h-full" />
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}
