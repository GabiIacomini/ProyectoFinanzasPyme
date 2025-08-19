import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";
import { smartFormatValue } from "@/lib/chart-formatters";

interface Transaction {
  id: string;
  amount: string;
  type: 'income' | 'expense';
  categoryId: string;
  description: string;
  date: string;
}

interface ExpenseCategoriesProps {
  transactions?: Transaction[];
}

// Category mapping for better display
const categoryNames: { [key: string]: string } = {
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

export default function ExpenseCategories({ transactions = [] }: ExpenseCategoriesProps) {
  const { formatAmount } = useCurrency();

  // Filter only expense transactions from current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const expenseTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return t.type === 'expense' &&
           transactionDate.getMonth() === currentMonth &&
           transactionDate.getFullYear() === currentYear;
  });

  // Group expenses by category
  const expensesByCategory = expenseTransactions.reduce((acc, transaction) => {
    const categoryName = categoryNames[transaction.categoryId] || 'Otros';
    acc[categoryName] = (acc[categoryName] || 0) + parseFloat(transaction.amount);
    return acc;
  }, {} as Record<string, number>);

  // Convert to array and sort by amount
  const categoryData = Object.entries(expensesByCategory)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5); // Top 5 categories

  const totalExpenses = categoryData.reduce((sum, cat) => sum + cat.amount, 0);
  const allAmounts = categoryData.map(cat => cat.amount);

  if (categoryData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Categorías de Gastos</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay gastos este mes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Categorías de Gastos</CardTitle>
        <p className="text-sm text-muted-foreground">
          Total: {smartFormatValue(totalExpenses, allAmounts)}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {categoryData.map((category, index) => {
          const percentage = (category.amount / totalExpenses) * 100;
          const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-yellow-500',
            'bg-purple-500',
            'bg-red-500'
          ];

          return (
            <div key={category.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${colors[index]}`} />
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold">
                    {smartFormatValue(category.amount, allAmounts)}
                  </span>
                  <div className="text-xs text-muted-foreground">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
