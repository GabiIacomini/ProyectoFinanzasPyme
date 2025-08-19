import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";


interface Transaction {
  id: string;
  amount: string;
  type: 'income' | 'expense';
  categoryId: string;
  description: string;
  date: string;
}

interface TransactionKpiCardsProps {
  transactions?: Transaction[];
}

export default function TransactionKpiCards({ transactions = [] }: TransactionKpiCardsProps) {
  const { formatAmount } = useCurrency();

  // Calculate current month data
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === currentMonth &&
           transactionDate.getFullYear() === currentYear;
  });

  // Calculate previous month data for comparison
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const previousMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === previousMonth &&
           transactionDate.getFullYear() === previousYear;
  });

  // Current month calculations
  const currentIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const currentExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const currentBalance = currentIncome - currentExpenses;



  // Previous month calculations
  const previousIncome = previousMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const previousExpenses = previousMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  // Calculate percentage changes
  const incomeChange = previousIncome > 0
    ? ((currentIncome - previousIncome) / previousIncome) * 100
    : 0;

  const expenseChange = previousExpenses > 0
    ? ((currentExpenses - previousExpenses) / previousExpenses) * 100
    : 0;

  const getChangeIndicator = (change: number) => {
    if (Math.abs(change) < 0.1) return null;

    return (
      <span className={`text-xs font-medium ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {change >= 0 ? '+' : ''}{change.toFixed(1)}% vs mes anterior
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Ingresos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatAmount(currentIncome)}
          </div>
          <div className="mt-1">
            {getChangeIndicator(incomeChange)}
          </div>
        </CardContent>
      </Card>

      {/* Total Gastos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatAmount(currentExpenses)}
          </div>
          <div className="mt-1">
            {getChangeIndicator(expenseChange)}
          </div>
        </CardContent>
      </Card>

      {/* Balance Neto */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance Neto</CardTitle>
          <DollarSign className={`h-4 w-4 ${currentBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${currentBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatAmount(currentBalance)}
          </div>
          <div className="mt-1">
            <span className="text-xs text-muted-foreground">
              Diferencia ingresos - gastos
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Total Transacciones */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
          <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {currentMonthTransactions.length}
          </div>
          <div className="mt-1">
            <span className="text-xs text-muted-foreground">
              Este mes
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
