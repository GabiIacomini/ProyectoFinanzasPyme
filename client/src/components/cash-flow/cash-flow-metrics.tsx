import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Calendar, BarChart3 } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";

interface Transaction {
  id: string;
  amount: string;
  type: 'income' | 'expense';
  categoryId: string;
  description: string;
  date: string;
}

interface CashFlowMetricsProps {
  transactions?: Transaction[];
}

export default function CashFlowMetrics({ transactions = [] }: CashFlowMetricsProps) {
  const { formatAmount } = useCurrency();

  // Calculate comprehensive metrics from transactions
  const now = new Date();

  // Calculate weekly metrics over the last 8 weeks
  const calculateWeeklyMetrics = () => {
    const weeks = [];
    for (let i = 0; i < 8; i++) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

      const weekTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= weekStart && transactionDate < weekEnd;
      });

      const income = weekTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const expenses = weekTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const netFlow = income - expenses;

      weeks.push({ income, expenses, netFlow, weekStart, weekEnd });
    }
    return weeks;
  };

  const weeklyData = calculateWeeklyMetrics();
  const weeklyAverageFlow = weeklyData.reduce((sum, week) => sum + week.netFlow, 0) / weeklyData.length;

  // Count positive weeks
  const positiveWeeks = weeklyData.filter(week => week.netFlow > 0).length;
  const totalWeeks = weeklyData.length;

  // Calculate volatility - standard deviation of weekly flows
  const mean = weeklyAverageFlow;
  const variance = weeklyData.reduce((sum, week) => sum + Math.pow(week.netFlow - mean, 2), 0) / weeklyData.length;
  const standardDeviation = Math.sqrt(variance);

  // Volatility classification
  const volatilityLevel = standardDeviation < 50000 ? 'Baja' :
                         standardDeviation < 150000 ? 'Media' : 'Alta';

  const volatilityColor = volatilityLevel === 'Baja' ? 'bg-green-100 text-green-800' :
                         volatilityLevel === 'Media' ? 'bg-yellow-100 text-yellow-800' :
                         'bg-red-100 text-red-800';

  // Calculate forecast and trend
  const recentWeeks = weeklyData.slice(0, 4); // Last 4 weeks
  const olderWeeks = weeklyData.slice(4, 8); // Previous 4 weeks

  const recentAverage = recentWeeks.reduce((sum, week) => sum + week.netFlow, 0) / recentWeeks.length;
  const olderAverage = olderWeeks.reduce((sum, week) => sum + week.netFlow, 0) / olderWeeks.length;

  const trendDirection = recentAverage > olderAverage ? 'Creciente' :
                        recentAverage < olderAverage ? 'Decreciente' : 'Estable';

  // Forecast based on trend
  const trendRate = olderAverage !== 0 ? (recentAverage - olderAverage) / olderAverage : 0;
  const forecastValue = recentAverage * (1 + trendRate * 0.5); // Conservative forecast
  const forecast = forecastValue > 0 ? 'Positivo' : 'Negativo';

  // Generate recommendation
  const generateRecommendation = () => {
    if (positiveWeeks >= 6) {
      return 'Excelente gestión financiera. Considera oportunidades de inversión.';
    } else if (positiveWeeks >= 4) {
      return 'Mantener estrategia actual y considerar inversiones.';
    } else if (positiveWeeks >= 2) {
      return 'Revisar gastos principales y optimizar categorías de mayor impacto.';
    } else {
      return 'Urgente: revisar estructura de costos y buscar nuevas fuentes de ingresos.';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Métricas de Flujo de Caja */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Métricas de Flujo de Caja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Flujo Promedio Semanal */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Flujo Promedio Semanal</div>
                <div className="text-xs text-gray-500">Media de flujo neto</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${weeklyAverageFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatAmount(weeklyAverageFlow.toString())}
              </div>
            </div>
          </div>

          {/* Semanas Positivas */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Semanas Positivas</div>
                <div className="text-xs text-gray-500">Flujo neto positivo</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">
                {positiveWeeks} / {totalWeeks}
              </div>
            </div>
          </div>

          {/* Volatilidad */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Volatilidad</div>
                <div className="text-xs text-gray-500">Variación del flujo</div>
              </div>
            </div>
            <div className="text-right">
              <Badge className={volatilityColor}>
                {volatilityLevel}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen Ejecutivo */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Resumen Ejecutivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pronóstico */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Pronóstico:</div>
            <div className={`text-base font-semibold ${forecast === 'Positivo' ? 'text-green-600' : 'text-red-600'}`}>
              {forecast}
            </div>
          </div>

          {/* Tendencia */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Tendencia:</div>
            <div className="text-base text-gray-600">
              {trendDirection === 'Creciente' ? '📈 Creciente' :
               trendDirection === 'Decreciente' ? '📉 Decreciente' :
               '➡️ Estable'}
            </div>
          </div>

          {/* Recomendación */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Recomendación:</div>
            <div className="text-sm text-gray-600 leading-relaxed">
              {generateRecommendation()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
