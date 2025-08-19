import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Chart, registerables } from "chart.js";
import { TrendingUp, TrendingDown, BarChart3, LineChart, PieChart, Settings, Target, Calculator, Info, Zap, Play, RotateCcw, Download, Calendar } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";

Chart.register(...registerables);

interface CashFlowProjection {
  date: string;
  projectedIncome: string;
  projectedExpenses: string;
  netFlow: string;
}

interface InteractiveProjectionsProps {
  data?: CashFlowProjection[];
  transactions?: any[];
  onScenarioChange?: (scenario: any) => void;
}

interface Scenario {
  name: string;
  incomeGrowth: number;
  expenseReduction: number;
  oneTimeIncome: number;
  oneTimeExpense: number;
  marketGrowth?: number;
  inflationRate?: number;
  timeFrame?: number; // months
}

interface ProjectionMetrics {
  totalProjectedIncome: number;
  totalProjectedExpenses: number;
  netProjectedFlow: number;
  worstCaseScenario: number;
  bestCaseScenario: number;
  averageMonthlyFlow: number;
  breakEvenPoint: number;
  riskLevel: 'low' | 'medium' | 'high';
}

// Get real Argentina inflation data based on INDEC reports
function getArgentinaInflationRate(period: 'current' | 'projected' = 'current'): number {
  if (period === 'projected') {
    // INDEC projected trend for 2025: decreasing from 84.5% to ~40%
    return 45.0; // Mid-year 2025 projection
  }

  // Current inflation rates based on latest INDEC data (July 2025)
  // Monthly: 1.9%, Annual: 36.6%
  return 36.6; // Most recent annual rate
}

// Generate cash flow projections from transaction data
function generateProjectionsFromTransactions(transactions: any[]): CashFlowProjection[] {
  if (!transactions || transactions.length === 0) return [];

  // Group transactions by month
  const monthlyData = new Map();

  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        date: new Date(date.getFullYear(), date.getMonth(), 1).toISOString(),
        income: 0,
        expenses: 0
      });
    }

    const amount = parseFloat(transaction.amount) || 0;
    const monthData = monthlyData.get(monthKey);

    if (transaction.type === 'income') {
      monthData.income += amount;
    } else {
      monthData.expenses += Math.abs(amount);
    }
  });

  // Convert to projection format and create future projections
  const projections: CashFlowProjection[] = [];
  const sortedMonths = Array.from(monthlyData.keys()).sort();

  // Add historical data
  sortedMonths.forEach(monthKey => {
    const data = monthlyData.get(monthKey);
    projections.push({
      date: data.date,
      projectedIncome: data.income.toString(),
      projectedExpenses: data.expenses.toString(),
      netFlow: (data.income - data.expenses).toString()
    });
  });

  // Generate future projections based on historical averages
  if (projections.length > 0) {
    const avgIncome = projections.reduce((sum, p) => sum + parseFloat(p.projectedIncome), 0) / projections.length;
    const avgExpenses = projections.reduce((sum, p) => sum + parseFloat(p.projectedExpenses), 0) / projections.length;

    const lastDate = new Date(projections[projections.length - 1].date);

    // Generate 6 months of future projections
    for (let i = 1; i <= 6; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setMonth(futureDate.getMonth() + i);

      // Add some growth/variability
      const growthFactor = 1 + (Math.random() - 0.5) * 0.1; // ±5% variability
      const futureIncome = avgIncome * growthFactor;
      const futureExpenses = avgExpenses * growthFactor;

      projections.push({
        date: futureDate.toISOString(),
        projectedIncome: futureIncome.toString(),
        projectedExpenses: futureExpenses.toString(),
        netFlow: (futureIncome - futureExpenses).toString()
      });
    }
  }

  return projections;
}

// Calculate comprehensive projection metrics
function calculateProjectionMetrics(data: CashFlowProjection[], scenario: Scenario, months: number): ProjectionMetrics {
  if (!data.length) {
    return {
      totalProjectedIncome: 0,
      totalProjectedExpenses: 0,
      netProjectedFlow: 0,
      worstCaseScenario: 0,
      bestCaseScenario: 0,
      averageMonthlyFlow: 0,
      breakEvenPoint: 0,
      riskLevel: 'medium'
    };
  }

  // Calculate historical averages - check for different field names
  let avgIncome = 0;
  let avgExpenses = 0;

  // Try different possible field names for income and expenses
  if (data[0].projectedIncome !== undefined) {
    avgIncome = data.reduce((sum, item) => sum + parseFloat(item.projectedIncome || '0'), 0) / data.length;
    avgExpenses = data.reduce((sum, item) => sum + parseFloat(item.projectedExpenses || '0'), 0) / data.length;
  } else {
    // Fallback: try to use netFlow if available
    const avgNetFlow = data.reduce((sum, item) => sum + parseFloat(item.netFlow || '0'), 0) / data.length;
    // Estimate income and expenses from net flow (assume 70/30 split)
    avgIncome = Math.abs(avgNetFlow) * 1.7;
    avgExpenses = Math.abs(avgNetFlow) * 0.7;
    if (avgNetFlow < 0) {
      // If net flow is negative, expenses are higher
      [avgIncome, avgExpenses] = [avgExpenses, avgIncome];
    }
  }



  // Apply scenario adjustments
  const projectedIncome = avgIncome * (1 + scenario.incomeGrowth / 100) * (1 + (scenario.marketGrowth || 0) / 100);
  const projectedExpenses = avgExpenses * (1 - scenario.expenseReduction / 100) * (1 + (scenario.inflationRate || 0) / 100 / 12);

  const monthlyNetFlow = projectedIncome - projectedExpenses;
  const totalProjectedIncome = (projectedIncome * months) + (scenario.oneTimeIncome || 0);
  const totalProjectedExpenses = (projectedExpenses * months) + (scenario.oneTimeExpense || 0);
  const netProjectedFlow = totalProjectedIncome - totalProjectedExpenses;

  // Calculate confidence intervals
  const variance = Math.abs(monthlyNetFlow * 0.2); // 20% variance
  const worstCase = netProjectedFlow - (variance * months);
  const bestCase = netProjectedFlow + (variance * months);

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';
  if (worstCase < 0 && netProjectedFlow < avgIncome * 2) riskLevel = 'high';
  else if (netProjectedFlow > avgIncome * 6) riskLevel = 'low';

  return {
    totalProjectedIncome,
    totalProjectedExpenses,
    netProjectedFlow,
    worstCaseScenario: worstCase,
    bestCaseScenario: bestCase,
    averageMonthlyFlow: monthlyNetFlow,
    breakEvenPoint: projectedExpenses > 0 ? projectedIncome / projectedExpenses : 0,
    riskLevel
  };
}

export default function InteractiveProjections({ data = [], transactions = [], onScenarioChange }: InteractiveProjectionsProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [activeTab, setActiveTab] = useState('projections');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('area');
  const [projectionPeriod, setProjectionPeriod] = useState<'3' | '6' | '12' | '24'>('6');
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(true);
  const [isApplyingScenario, setIsApplyingScenario] = useState(false);
  const [chartInitialized, setChartInitialized] = useState(false);
  const [scenario, setScenario] = useState<Scenario>({
    name: 'Escenario Base',
    incomeGrowth: 0,
    expenseReduction: 0,
    oneTimeIncome: 0,
    oneTimeExpense: 0,
    marketGrowth: 0,
    inflationRate: getArgentinaInflationRate('current'), // Real INDEC data
    timeFrame: 6
  });
  const { formatAmount } = useCurrency();

  // Use transaction data to generate projections if cash flow data is not available
  const effectiveData = data.length > 0 ? data : generateProjectionsFromTransactions(transactions);

  // Calculate projection metrics
  const projectionMetrics = calculateProjectionMetrics(effectiveData, scenario, parseInt(projectionPeriod));

  const predefinedScenarios: Scenario[] = [
    {
      name: 'Optimista',
      incomeGrowth: 25,
      expenseReduction: 15,
      oneTimeIncome: 0,
      oneTimeExpense: 0,
      marketGrowth: 10,
      inflationRate: 25.0, // Optimistic inflation control scenario
      timeFrame: parseInt(projectionPeriod)
    },
    {
      name: 'Conservador',
      incomeGrowth: 8,
      expenseReduction: 5,
      oneTimeIncome: 0,
      oneTimeExpense: 0,
      marketGrowth: 3,
      inflationRate: getArgentinaInflationRate('current'), // Current INDEC rate
      timeFrame: parseInt(projectionPeriod)
    },
    {
      name: 'Pesimista',
      incomeGrowth: -15,
      expenseReduction: -8,
      oneTimeIncome: 0,
      oneTimeExpense: 100000,
      marketGrowth: -5,
      inflationRate: 55.0, // Inflation resurgence scenario
      timeFrame: parseInt(projectionPeriod)
    },
    {
      name: 'Expansión',
      incomeGrowth: 40,
      expenseReduction: 10,
      oneTimeIncome: 200000,
      oneTimeExpense: 150000,
      marketGrowth: 15,
      inflationRate: 30.0, // Moderate inflation during growth
      timeFrame: parseInt(projectionPeriod)
    },
    {
      name: 'Crisis',
      incomeGrowth: -25,
      expenseReduction: -10,
      oneTimeIncome: 0,
      oneTimeExpense: 75000,
      marketGrowth: -10,
      inflationRate: 75.0, // Crisis-level inflation
      timeFrame: parseInt(projectionPeriod)
    }
  ];

  const applyScenario = (selectedScenario: Scenario) => {
    setIsApplyingScenario(true);
    const updatedScenario = { ...selectedScenario, timeFrame: parseInt(projectionPeriod) };

    // Force immediate state update
    setScenario(updatedScenario);
    setChartInitialized(false); // Force chart re-initialization
    console.log('Scenario changed:', updatedScenario);
    onScenarioChange?.(updatedScenario);

    // Small delay for visual feedback
    setTimeout(() => {
      setIsApplyingScenario(false);
    }, 300);
  };

  const resetToBase = () => {
    setScenario({
      name: 'Escenario Base',
      incomeGrowth: 0,
      expenseReduction: 0,
      oneTimeIncome: 0,
      oneTimeExpense: 0,
      marketGrowth: 0,
      inflationRate: getArgentinaInflationRate('current'),
      timeFrame: parseInt(projectionPeriod)
    });
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 dark:text-green-400';
      case 'high': return 'text-red-600 dark:text-red-400';
      default: return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300';
      case 'high': return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300';
      default: return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300';
    }
  };

  const calculateModifiedData = (originalData: CashFlowProjection[], scenario: Scenario) => {
    return originalData.map((item, index) => {
      const income = parseFloat(item.projectedIncome);
      const expenses = parseFloat(item.projectedExpenses);

      // Apply percentage changes
      const modifiedIncome = income * (1 + scenario.incomeGrowth / 100);
      const modifiedExpenses = expenses * (1 - scenario.expenseReduction / 100);

      // Apply one-time adjustments to first period
      const finalIncome = index === 0 ? modifiedIncome + scenario.oneTimeIncome : modifiedIncome;
      const finalExpenses = index === 0 ? modifiedExpenses + scenario.oneTimeExpense : modifiedExpenses;
      const netFlow = finalIncome - finalExpenses;

      return {
        ...item,
        projectedIncome: finalIncome.toString(),
        projectedExpenses: finalExpenses.toString(),
        netFlow: netFlow.toString()
      };
    });
  };

  // Force chart recreation when scenario or data changes
  useEffect(() => {
    if (!chartRef.current || !effectiveData.length) return;

    // Destroy existing chart immediately
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const modifiedData = calculateModifiedData(effectiveData, scenario);

    const labels = modifiedData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
    });

    const originalNetFlow = effectiveData.map(item => parseFloat(item.netFlow));
    const modifiedNetFlow = modifiedData.map(item => parseFloat(item.netFlow));
    const incomeData = modifiedData.map(item => parseFloat(item.projectedIncome));
    const expenseData = modifiedData.map(item => parseFloat(item.projectedExpenses));

    const datasets = [
      {
        label: 'Flujo Neto (Original)',
        data: originalNetFlow,
        borderColor: 'hsl(210, 40%, 80%)',
        backgroundColor: 'hsla(210, 40%, 80%, 0.1)',
        borderDash: [5, 5],
        tension: 0.4,
        fill: false,
      },
      {
        label: 'Flujo Neto (Proyectado)',
        data: modifiedNetFlow,
        borderColor: 'hsl(262.1, 83.3%, 57.8%)',
        backgroundColor: chartType === 'area' ? 'hsla(262.1, 83.3%, 57.8%, 0.1)' : 'hsl(262.1, 83.3%, 57.8%)',
        tension: 0.4,
        fill: chartType === 'area',
      },
      {
        label: 'Ingresos Proyectados',
        data: incomeData,
        borderColor: 'hsl(159.7826, 100%, 36.0784%)',
        backgroundColor: chartType === 'area' ? 'hsla(159.7826, 100%, 36.0784%, 0.1)' : 'hsl(159.7826, 100%, 36.0784%)',
        tension: 0.4,
        fill: false,
      },
      {
        label: 'Gastos Proyectados',
        data: expenseData,
        borderColor: 'hsl(0, 84.2%, 60.2%)',
        backgroundColor: chartType === 'area' ? 'hsla(0, 84.2%, 60.2%, 0.1)' : 'hsl(0, 84.2%, 60.2%)',
        tension: 0.4,
        fill: false,
      }
    ];

    chartInstance.current = new Chart(ctx, {
      type: chartType === 'area' ? 'line' : chartType,
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Proyecciones Interactivas - ${scenario.name}`,
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

    setChartInitialized(true);

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [effectiveData, scenario, chartType, formatAmount]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="projections">Proyecciones</TabsTrigger>
            <TabsTrigger value="scenarios">Escenarios</TabsTrigger>
            <TabsTrigger value="analysis">Análisis</TabsTrigger>
          </TabsList>

          <TabsContent value="projections" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Proyecciones Interactivas
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" data-testid="projections-info">
                          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="text-sm">Proyecciones basadas en datos históricos reales con análisis de escenarios múltiples y intervalos de confianza.</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getRiskBadgeColor(projectionMetrics.riskLevel)}>
                      {projectionMetrics.riskLevel === 'low' ? 'Riesgo Bajo' :
                       projectionMetrics.riskLevel === 'high' ? 'Riesgo Alto' : 'Riesgo Medio'}
                    </Badge>
                    <Badge variant="outline">{projectionPeriod} meses adelante</Badge>
                  </div>
                </div>

                {/* Controls Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
                  <div className="flex items-center gap-4">
                    {/* Projection Period */}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Período:</Label>
                      <Select value={projectionPeriod} onValueChange={(value: '3' | '6' | '12' | '24') => setProjectionPeriod(value)}>
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3m</SelectItem>
                          <SelectItem value="6">6m</SelectItem>
                          <SelectItem value="12">1a</SelectItem>
                          <SelectItem value="24">2a</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Chart Type Selector */}
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Tipo:</Label>
                      <div className="flex gap-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-1">
                        <Button
                          size="sm"
                          variant={chartType === 'line' ? 'default' : 'ghost'}
                          onClick={() => setChartType('line')}
                          className="h-7 px-2"
                          data-testid="chart-type-line"
                        >
                          <LineChart className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={chartType === 'bar' ? 'default' : 'ghost'}
                          onClick={() => setChartType('bar')}
                          className="h-7 px-2"
                          data-testid="chart-type-bar"
                        >
                          <BarChart3 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={chartType === 'area' ? 'default' : 'ghost'}
                          onClick={() => setChartType('area')}
                          className="h-7 px-2"
                          data-testid="chart-type-area"
                        >
                          <PieChart className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Reset Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetToBase}
                      className="h-8 px-3 text-xs"
                      data-testid="reset-scenario"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Metrics Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-green-700 dark:text-green-300 font-medium">Ingresos Proyectados</p>
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    </div>
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">
                      {formatAmount(projectionMetrics.totalProjectedIncome)}
                    </p>
                  </div>

                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-red-700 dark:text-red-300 font-medium">Gastos Proyectados</p>
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    </div>
                    <p className="text-lg font-bold text-red-700 dark:text-red-300">
                      {formatAmount(projectionMetrics.totalProjectedExpenses)}
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Flujo Neto</p>
                      <BarChart3 className="h-3 w-3 text-blue-600" />
                    </div>
                    <p className={`text-lg font-bold ${projectionMetrics.netProjectedFlow >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      {formatAmount(projectionMetrics.netProjectedFlow)}
                    </p>
                  </div>

                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">Promedio Mensual</p>
                      <Calculator className="h-3 w-3 text-yellow-600" />
                    </div>
                    <p className={`text-lg font-bold ${projectionMetrics.averageMonthlyFlow >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      {formatAmount(projectionMetrics.averageMonthlyFlow)}
                    </p>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-96 border rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                  <canvas ref={chartRef} className="w-full h-full" />
                </div>

                {/* Alert if high risk */}
                {projectionMetrics.riskLevel === 'high' && (
                  <Alert className="mt-4 border-red-200 dark:border-red-800">
                    <AlertDescription className="text-red-700 dark:text-red-300">
                      <strong>⚠️ Atención:</strong> Las proyecciones indican alto riesgo financiero.
                      Considere ajustar los parámetros del escenario o implementar medidas de contingencia.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración de Escenarios
                  <Badge variant="outline" className="ml-2">
                    {scenario.name}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Predefined Scenarios */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Escenarios Predefinidos:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    {predefinedScenarios.map((presetScenario) => (
                      <Button
                        key={presetScenario.name}
                        variant={scenario.name === presetScenario.name ? 'default' : 'outline'}
                        onClick={() => applyScenario(presetScenario)}
                        className="h-auto p-3 flex flex-col items-center text-center"
                        data-testid={`scenario-${presetScenario.name.toLowerCase()}`}
                      >
                        <span className="font-medium text-sm">{presetScenario.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {presetScenario.incomeGrowth > 0 ? '+' : ''}{presetScenario.incomeGrowth}% ingresos
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Scenario Configuration */}
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Configuración Personalizada</h4>
                    <Button variant="outline" size="sm" onClick={resetToBase} data-testid="reset-custom-scenario">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Restaurar
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Income Growth */}
                    <div>
                      <Label className="text-sm font-medium">Crecimiento de Ingresos (%)</Label>
                      <div className="mt-3">
                        <Slider
                          value={[scenario.incomeGrowth]}
                          onValueChange={([value]) => {
                            const updatedScenario = {...scenario, incomeGrowth: value, name: 'Personalizado'};
                            setScenario(updatedScenario);
                            onScenarioChange?.(updatedScenario);
                          }}
                          min={-50}
                          max={100}
                          step={1}
                          className="w-full"
                          data-testid="income-growth-slider"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>-50%</span>
                          <span className="font-medium">
                            {scenario.incomeGrowth > 0 ? '+' : ''}{scenario.incomeGrowth}%
                          </span>
                          <span>+100%</span>
                        </div>
                      </div>
                    </div>

                    {/* Expense Reduction */}
                    <div>
                      <Label className="text-sm font-medium">Optimización de Gastos (%)</Label>
                      <div className="mt-3">
                        <Slider
                          value={[scenario.expenseReduction]}
                          onValueChange={([value]) => {
                            const updatedScenario = {...scenario, expenseReduction: value, name: 'Personalizado'};
                            setScenario(updatedScenario);
                            onScenarioChange?.(updatedScenario);
                          }}
                          min={-25}
                          max={50}
                          step={1}
                          className="w-full"
                          data-testid="expense-reduction-slider"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>-25%</span>
                          <span className="font-medium">
                            {scenario.expenseReduction > 0 ? '+' : ''}{scenario.expenseReduction}%
                          </span>
                          <span>+50%</span>
                        </div>
                      </div>
                    </div>

                    {/* Market Growth */}
                    <div>
                      <Label className="text-sm font-medium">Crecimiento del Mercado (%)</Label>
                      <div className="mt-3">
                        <Slider
                          value={[scenario.marketGrowth || 0]}
                          onValueChange={([value]) => {
                            const updatedScenario = {...scenario, marketGrowth: value, name: 'Personalizado'};
                            setScenario(updatedScenario);
                            onScenarioChange?.(updatedScenario);
                          }}
                          min={-20}
                          max={30}
                          step={1}
                          className="w-full"
                          data-testid="market-growth-slider"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>-20%</span>
                          <span className="font-medium">
                            {(scenario.marketGrowth || 0) > 0 ? '+' : ''}{scenario.marketGrowth || 0}%
                          </span>
                          <span>+30%</span>
                        </div>
                      </div>
                    </div>

                    {/* Inflation Rate */}
                    <div>
                      <Label className="text-sm font-medium">Tasa de Inflación (%)</Label>
                      <div className="mt-3">
                        <Slider
                          value={[scenario.inflationRate || 12.4]}
                          onValueChange={([value]) => {
                            const updatedScenario = {...scenario, inflationRate: value, name: 'Personalizado'};
                            setScenario(updatedScenario);
                            onScenarioChange?.(updatedScenario);
                          }}
                          min={5}
                          max={50}
                          step={0.5}
                          className="w-full"
                          data-testid="inflation-rate-slider"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>5%</span>
                          <span className="font-medium">{scenario.inflationRate?.toFixed(1) || '12.4'}%</span>
                          <span>50%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* One-time Events */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <Label className="text-sm font-medium">Ingreso Extraordinario</Label>
                      <Input
                        type="number"
                        value={scenario.oneTimeIncome || 0}
                        onChange={(e) => {
                          const updatedScenario = {...scenario, oneTimeIncome: parseInt(e.target.value) || 0, name: 'Personalizado'};
                          setScenario(updatedScenario);
                          onScenarioChange?.(updatedScenario);
                        }}
                        placeholder="0"
                        className="mt-2"
                        data-testid="one-time-income-input"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Ej: Capital de inversión, venta de activo, subsidio
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Gasto Extraordinario</Label>
                      <Input
                        type="number"
                        value={scenario.oneTimeExpense || 0}
                        onChange={(e) => {
                          const updatedScenario = {...scenario, oneTimeExpense: parseInt(e.target.value) || 0, name: 'Personalizado'};
                          setScenario(updatedScenario);
                          onScenarioChange?.(updatedScenario);
                        }}
                        placeholder="0"
                        className="mt-2"
                        data-testid="one-time-expense-input"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Ej: Equipamiento, reparaciones, multas, impuestos
                      </p>
                    </div>
                  </div>

                  {/* Apply Button */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Los cambios se aplican en tiempo real
                    </div>
                    <Button
                      onClick={() => {
                        setActiveTab('projections');
                        // Optional: scroll to top of projections
                      }}
                      variant="outline"
                      className="gap-2"
                      data-testid="view-projections"
                    >
                      <Target className="h-4 w-4" />
                      Ver Proyecciones
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Análisis de Proyecciones - {scenario.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Scenario Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Mejor Escenario</span>
                    </div>
                    <p className="text-xl font-bold text-green-700 dark:text-green-300">
                      {formatAmount(projectionMetrics.bestCaseScenario)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      +{Math.round(((projectionMetrics.bestCaseScenario - projectionMetrics.netProjectedFlow) / Math.abs(projectionMetrics.netProjectedFlow)) * 100)}% sobre base
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Escenario Actual</span>
                    </div>
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                      {formatAmount(projectionMetrics.netProjectedFlow)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Proyección configurada</p>
                  </div>

                  <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Peor Escenario</span>
                    </div>
                    <p className="text-xl font-bold text-red-700 dark:text-red-300">
                      {formatAmount(projectionMetrics.worstCaseScenario)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(((projectionMetrics.worstCaseScenario - projectionMetrics.netProjectedFlow) / Math.abs(projectionMetrics.netProjectedFlow)) * 100)}% bajo base
                    </p>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 border rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Punto de Equilibrio</p>
                    <p className="text-lg font-bold">{projectionMetrics.breakEvenPoint.toFixed(2)}</p>
                    <p className="text-xs text-green-600">ratio ingresos/gastos</p>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Nivel de Riesgo</p>
                    <p className={`text-lg font-bold ${getRiskColor(projectionMetrics.riskLevel)}`}>
                      {projectionMetrics.riskLevel === 'low' ? 'Bajo' :
                       projectionMetrics.riskLevel === 'high' ? 'Alto' : 'Medio'}
                    </p>
                    <p className="text-xs text-muted-foreground">evaluación general</p>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Período</p>
                    <p className="text-lg font-bold">{projectionPeriod}</p>
                    <p className="text-xs text-muted-foreground">meses proyectados</p>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Variabilidad</p>
                    <p className="text-lg font-bold">±20%</p>
                    <p className="text-xs text-muted-foreground">intervalo confianza</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Recomendaciones Estratégicas
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Mantener reserva de emergencia equivalente a {Math.ceil(parseInt(projectionPeriod) / 4)} meses de gastos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>Revisar y optimizar gastos fijos trimestralmente</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">⚡</span>
                        <span>Desarrollar múltiples fuentes de ingresos para reducir riesgo</span>
                      </li>
                    </ul>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-0.5">📊</span>
                        <span>Monitorear KPIs financieros mensualmente</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500 mt-0.5">🎯</span>
                        <span>Ajustar estrategia según análisis de volatilidad</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">⚠️</span>
                        <span>Implementar alertas tempranas de liquidez</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
