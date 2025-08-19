import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Plus, Wallet, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import EnhancedTransactionForm from "@/components/enhanced-transaction-form";

export default function QuickActionButtons({ userId }: { userId: string }) {
  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
              <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Registra tu movimiento</h3>
              <p className="text-sm text-muted-foreground">Mantén tu información financiera actualizada</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <EnhancedTransactionForm
              userId={userId}
              defaultType="income"
              trigger={
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm border-0"
                  data-testid="button-quick-income"
                >
                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                  Ingreso
                </Button>
              }
            />
            <EnhancedTransactionForm
              userId={userId}
              defaultType="expense"
              trigger={
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 shadow-sm"
                  data-testid="button-quick-expense"
                >
                  <ArrowDownCircle className="mr-2 h-4 w-4" />
                  Gasto
                </Button>
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
