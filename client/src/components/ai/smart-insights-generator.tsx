import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bot, TrendingUp, TrendingDown, Target, Lightbulb, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";

interface Transaction {
  id: string;
  amount: string;
  type: 'income' | 'expense';
  categoryId: string;
  description: string;
  date: string;
}

interface CashFlowProjection {
  date: string;
  projectedIncome: string;
  projectedExpenses: string;
  netFlow: string;
}

interface SmartInsight {
  id: string;
  type: 'pattern' | 'opportunity' | 'recommendation' | 'alert';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
  impact: 'positive' | 'negative' | 'neutral';
  actionable: boolean;
  metadata?: any;
}

interface SmartInsightsGeneratorProps {
  transactions?: Transaction[];
  cashFlowData?: CashFlowProjection[];
  onInsightGenerated?: (insight: SmartInsight) => void;
}

export default function SmartInsightsGenerator({
  transactions = [],
  cashFlowData = [],
  onInsightGenerated
}: SmartInsightsGeneratorProps) {
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { formatAmount } = useCurrency();

  // Pattern detection algorithms
  const detectSpendingPatterns = (transactions: Transaction[]): SmartInsight[] => {
    const insights: SmartInsight[] = [];

    // Analyze expense frequency and amounts
    const expensesByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.categoryId] = (acc[t.categoryId] || 0) + parseFloat(t.amount);
        return acc;
      }, {} as Record<string, number>);

    // Detect high-expense categories
    const totalExpenses = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);
    Object.entries(expensesByCategory).forEach(([categoryId, amount]) => {
      const percentage = (amount / totalExpenses) * 100;
      if (percentage > 30) {
        insights.push({
          id: `pattern-${categoryId}`,
          type: 'pattern',
          title: 'Concentración de Gastos Detectada',
          description: `El ${percentage.toFixed(1)}% de tus gastos se concentra en una sola categoría. Considera diversificar o optimizar esta área.`,
          priority: percentage > 50 ? 'high' : 'medium',
          confidence: 0.85,
          impact: 'negative',
          actionable: true,
          metadata: { categoryId, percentage, amount }
        });
      }
    });

    return insights;
  };

  const detectCashFlowTrends = (cashFlowData: CashFlowProjection[]): SmartInsight[] => {
    const insights: SmartInsight[] = [];

    if (cashFlowData.length < 3) return insights;

    // Analyze cash flow trend
    const netFlows = cashFlowData.map(d => parseFloat(d.netFlow));
    const isDecreasing = netFlows.slice(-3).every((value, index, arr) =>
      index === 0 || value < arr[index - 1]
    );

    const isIncreasing = netFlows.slice(-3).every((value, index, arr) =>
      index === 0 || value > arr[index - 1]
    );

    if (isDecreasing) {
      insights.push({
        id: 'trend-decreasing',
        type: 'alert',
        title: 'Tendencia Negativa en Flujo de Caja',
        description: 'Se detecta una tendencia decreciente en el flujo de caja durante las últimas 3 semanas. Considera revisar gastos o incrementar ingresos.',
        priority: 'high',
        confidence: 0.9,
        impact: 'negative',
        actionable: true
      });
    } else if (isIncreasing) {
      insights.push({
        id: 'trend-increasing',
        type: 'opportunity',
        title: 'Tendencia Positiva en Flujo de Caja',
        description: 'Excelente! Tu flujo de caja muestra una tendencia creciente. Este es un buen momento para considerar inversiones o reservas.',
        priority: 'medium',
        confidence: 0.85,
        impact: 'positive',
        actionable: true
      });
    }

    return insights;
  };

  const generateOptimizationRecommendations = (transactions: Transaction[]): SmartInsight[] => {
    const insights: SmartInsight[] = [];

    // Analyze transaction timing
    const recentTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return transactionDate >= thirtyDaysAgo;
    });

    if (recentTransactions.length > 0) {
      const avgDailyExpenses = recentTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0) / 30;

      if (avgDailyExpenses > 5000) { // Threshold for ARS
        insights.push({
          id: 'recommendation-expense-review',
          type: 'recommendation',
          title: 'Revisión de Gastos Recomendada',
          description: `Con un promedio de ${formatAmount(avgDailyExpenses.toString())} en gastos diarios, podrías optimizar revisando gastos no esenciales.`,
          priority: 'medium',
          confidence: 0.75,
          impact: 'positive',
          actionable: true,
          metadata: { avgDailyExpenses }
        });
      }
    }

    return insights;
  };

  const generateInsights = async () => {
    setIsGenerating(true);

    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1500));

      const allInsights = [
        ...detectSpendingPatterns(transactions),
        ...detectCashFlowTrends(cashFlowData),
        ...generateOptimizationRecommendations(transactions)
      ];

      setInsights(allInsights);

      // Notify parent component of new insights
      allInsights.forEach(insight => {
        onInsightGenerated?.(insight);
      });

    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern':
        return <TrendingUp className="h-5 w-5" />;
      case 'opportunity':
        return <Target className="h-5 w-5" />;
      case 'recommendation':
        return <Lightbulb className="h-5 w-5" />;
      case 'alert':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Bot className="h-5 w-5" />;
    }
  };

  const getInsightColor = (type: string, impact: string) => {
    switch (type) {
      case 'pattern':
        return 'border-blue-200 bg-blue-50';
      case 'opportunity':
        return 'border-green-200 bg-green-50';
      case 'recommendation':
        return 'border-orange-200 bg-orange-50';
      case 'alert':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Alta</Badge>;
      case 'medium':
        return <Badge variant="secondary">Media</Badge>;
      case 'low':
        return <Badge variant="outline">Baja</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Generador de Insights Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Analiza patrones, tendencias y oportunidades en tus datos financieros usando algoritmos inteligentes.
            </div>
            <Button
              onClick={generateInsights}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isGenerating ? 'Analizando...' : 'Generar Insights'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {insights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Insights Generados ({insights.length})</h3>

          {insights.map((insight) => (
            <Card key={insight.id} className={`border-l-4 ${getInsightColor(insight.type, insight.impact)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getInsightIcon(insight.type)}
                    <div>
                      <CardTitle className="text-base">{insight.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getPriorityBadge(insight.priority)}
                        <Badge variant="outline" className="text-xs">
                          {Math.round(insight.confidence * 100)}% confianza
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {insight.description}
                </p>

                {insight.actionable && (
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      Este insight requiere acción. Considera implementar los cambios sugeridos para optimizar tu situación financiera.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {insights.length === 0 && !isGenerating && (
        <Card>
          <CardContent className="text-center py-8">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Haz clic en "Generar Insights" para analizar tus datos financieros y recibir recomendaciones inteligentes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
