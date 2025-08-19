import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";


interface Transaction {
  id: string;
  amount: string;
  type: 'income' | 'expense';
  categoryId: string;
  description: string;
  date: string;
}

interface CashFlowKpiCardsProps {
  transactions?: Transaction[];
  timeRange?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export default function CashFlowKpiCards({
  transactions = [],
  timeRange = 'weekly'
}: CashFlowKpiCardsProps) {
  const { formatAmount } = useCurrency();

  // Calculate date range based on timeRange
  const now = new Date();
  let startDate = new Date(now);
  let periodLabel = '';

  switch (timeRange) {
    case 'daily':
      startDate.setDate(now.getDate() - 7); // Last 7 days
      periodLabel = '7 días';
      break;
    case 'weekly':
      startDate.setDate(now.getDate() - (8 * 7)); // Last 8 weeks
      periodLabel = '8 semanas';
      break;
    case 'monthly':
      startDate.setMonth(now.getMonth() - 6); // Last 6 months
      periodLabel = '6 meses';
      break;
    case 'yearly':
      startDate.setFullYear(now.getFullYear() - 3); // Last 3 years
      periodLabel = '3 años';
      break;
  }

  // Filter transactions within the time range
  const periodTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= startDate && transactionDate <= now;
  });

  // Calculate totals
  const totalIncome = periodTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalExpenses = periodTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const netFlow = totalIncome - totalExpenses;

  // Calculate projections based on historical data
  const periodsCount = timeRange === 'daily' ? 7 :
                      timeRange === 'weekly' ? 8 :
                      timeRange === 'monthly' ? 6 : 3;

  const projectedIncome = totalIncome; // For now, use historical as projection
  const projectedExpenses = totalExpenses;
  const projectedNet = projectedIncome - projectedExpenses;



  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Projected Income */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Ingresos Proyectados</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatAmount(projectedIncome)}
          </div>
          <div className="mt-1">
            <span className="text-xs text-muted-foreground">
              {periodLabel}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Projected Expenses */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Egresos Proyectados</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatAmount(projectedExpenses)}
          </div>
          <div className="mt-1">
            <span className="text-xs text-muted-foreground">
              {periodLabel}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Net Projected Flow */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Flujo Neto Proyectado</CardTitle>
          <DollarSign className={`h-4 w-4 ${projectedNet >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${projectedNet >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatAmount(projectedNet)}
          </div>
          <div className="mt-1">
            <span className="text-xs text-muted-foreground">
              Resultado neto
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
