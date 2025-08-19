import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import PageTransition from "@/components/page-transition";
import EnhancedAdvancedCashFlowChart from "@/components/dashboard/enhanced-advanced-cashflow-chart";
import RealDataChart from "@/components/cash-flow/real-data-chart";
import CashFlowKpiCards from "@/components/cash-flow/cash-flow-kpi-cards";
import CashFlowMetrics from "@/components/cash-flow/cash-flow-metrics";
import InteractiveProjections from "@/components/cash-flow/interactive-projections";
import SmartInsightsGenerator from "@/components/ai/smart-insights-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, TrendingDown, Calendar, DollarSign, BarChart3, Download, Activity, LineChart, PieChart, Target, Bot } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { useAuth } from "@/contexts/auth-context";
import { useCurrency } from "@/contexts/currency-context";

Chart.register(...registerables);

export default function CashFlow() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'interactive' | 'insights'>('overview');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const { formatAmount } = useCurrency();

  const { user } = useAuth();

  const { data: cashFlowData, isLoading, error } = useQuery({
    queryKey: ['/api/cash-flow-projections', user?.id],
    enabled: !!user?.id,
  });

  const { data: transactions } = useQuery({
    queryKey: ['/api/transactions', user?.id],
    enabled: !!user?.id,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  useEffect(() => {
    if (!chartRef.current || !cashFlowData) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Prepare data
    const dataArray = Array.isArray(cashFlowData) ? cashFlowData : [];
    const labels = dataArray.map((item: any) => {
      const date = new Date(item.date);
      return date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
    });

    const incomeData = dataArray.map((item: any) => parseFloat(item.projectedIncome));
    const expenseData = dataArray.map((item: any) => parseFloat(item.projectedExpenses));
    const netFlowData = dataArray.map((item: any) => parseFloat(item.netFlow));

    chartInstance.current = new Chart(ctx, {
      type: chartType,
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
            label: 'Gastos Proyectados',
            data: expenseData,
            borderColor: 'hsl(0, 84.2%, 60.2%)',
            backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.1)',
            tension: 0.4,
            fill: false,
          },
          {
            label: 'Flujo Neto',
            data: netFlowData,
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
            text: 'Proyección de Flujo de Caja - 8 Semanas',
            font: { size: 14, weight: 'bold' }
          },
          legend: {
            position: 'bottom',
            labels: { padding: 20, usePointStyle: true }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: function(value) {
                return formatAmount(value.toString());
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
  }, [cashFlowData, chartType, formatAmount]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              Error al cargar los datos de flujo de caja.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const dataArray = Array.isArray(cashFlowData) ? cashFlowData : [];
  const totalProjectedIncome = dataArray.reduce((sum, item: any) => sum + parseFloat(item.projectedIncome), 0);
  const totalProjectedExpenses = dataArray.reduce((sum, item: any) => sum + parseFloat(item.projectedExpenses), 0);
  const netProjection = totalProjectedIncome - totalProjectedExpenses;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mi Dinero</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Ve cómo entra y sale tu dinero, con proyecciones inteligentes
                </p>
              </div>
              <div className="flex gap-2 mt-4 sm:mt-0">
                <Button size="sm">
                  <Activity className="h-4 w-4 mr-2" />
                  Actualizar Proyecciones
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Vista General
              </TabsTrigger>
              <TabsTrigger value="interactive" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Proyecciones Interactivas
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Insights de IA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Cash Flow KPI Cards with Real Data */}
              <CashFlowKpiCards
                transactions={Array.isArray(transactions) ? transactions : []}
                timeRange={timeRange}
              />

              {/* Real Data Charts with Multiple Views */}
              <div className="space-y-6">
                <RealDataChart
                  transactions={Array.isArray(transactions) ? transactions : []}
                  title="Flujo de Caja Real - Vista Completa"
                  timeRange={timeRange}
                />

                <EnhancedAdvancedCashFlowChart
                  transactions={Array.isArray(transactions) ? transactions : []}
                  title="Análisis Avanzado de Flujo de Caja"
                  height={450}
                />
              </div>



              {/* Cash Flow Metrics */}
              <CashFlowMetrics transactions={Array.isArray(transactions) ? transactions : []} />
            </TabsContent>

            <TabsContent value="interactive" className="space-y-6">
              <InteractiveProjections
                data={dataArray.length > 0 ? dataArray : []}
                transactions={Array.isArray(transactions) ? transactions : []}
                onScenarioChange={(scenario) => {
                  console.log('Scenario changed:', scenario);
                }}
              />
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <SmartInsightsGenerator
                transactions={Array.isArray(transactions) ? transactions : []}
                cashFlowData={dataArray}
                onInsightGenerated={(insight) => {
                  console.log('New insight generated:', insight);
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </PageTransition>
    </div>
  );
}
