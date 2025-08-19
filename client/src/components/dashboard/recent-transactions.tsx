import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";

interface Transaction {
  id: string;
  description: string;
  amount: string;
  type: 'income' | 'expense';
  date: string;
  categoryId?: string;
}

interface RecentTransactionsProps {
  transactions?: Transaction[];
}

// Category mapping for better display
const categoryNames: { [key: string]: string } = {
  'cat-income-sales': 'Ventas',
  'cat-income-services': 'Servicios',
  'cat-income-investments': 'Inversiones',
  'cat-income-other': 'Otros Ingresos',
  'cat-expense-office': 'Oficina',
  'cat-expense-marketing': 'Marketing',
  'cat-expense-software': 'Software',
  'cat-expense-equipment': 'Equipamiento',
  'cat-expense-travel': 'Viajes',
  'cat-expense-supplies': 'Suministros',
  'cat-expense-utilities': 'Servicios',
  'cat-expense-rent': 'Alquiler',
  'cat-expense-insurance': 'Seguros',
  'cat-expense-food': 'Alimentación',
  'cat-expense-transport': 'Transporte',
  'cat-expense-other': 'Otros Gastos',
};

export default function RecentTransactions({ transactions = [] }: RecentTransactionsProps) {
  const { formatAmount } = useCurrency();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return `Hoy, ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      return `Ayer, ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays < 7) {
      return `${diffInDays} días`;
    } else {
      return date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
    }
  };

  // Sort transactions by date (most recent first) and take last 10
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  if (recentTransactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Transacciones Recientes</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hay transacciones registradas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Transacciones Recientes</CardTitle>
          <Button variant="link" className="text-primary font-medium p-0">
            Ver todas
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                transaction.type === 'income'
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
              }`}>
                {transaction.type === 'income' ? (
                  <ArrowDownRight className="h-4 w-4" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  {transaction.description}
                </p>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>{categoryNames[transaction.categoryId || ''] || 'Sin categoría'}</span>
                  <span>•</span>
                  <span>{formatDate(transaction.date)}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${
                transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
