import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUpCircle, ArrowDownCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import EnhancedTransactionForm from "@/components/enhanced-transaction-form";

export default function FloatingActionButton({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Secondary buttons */}
      <div className={cn(
        "transition-all duration-300 mb-4 space-y-3",
        isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-75 translate-y-4 pointer-events-none"
      )}>
        <div className="flex flex-col items-end space-y-2">
          {/* Income button */}
          <div className="flex items-center space-x-3">
            <div className="bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-green-600 dark:text-green-400">Registrar Ingreso</span>
            </div>
            <EnhancedTransactionForm
              userId={userId}
              defaultType="income"
              trigger={
                <Button
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white shadow-lg border-0 rounded-full w-12 h-12"
                  data-testid="fab-income"
                >
                  <ArrowUpCircle className="h-5 w-5" />
                </Button>
              }
            />
          </div>

          {/* Expense button */}
          <div className="flex items-center space-x-3">
            <div className="bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-red-600 dark:text-red-400">Registrar Gasto</span>
            </div>
            <EnhancedTransactionForm
              userId={userId}
              defaultType="expense"
              trigger={
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white dark:bg-gray-800 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 shadow-lg rounded-full w-12 h-12"
                  data-testid="fab-expense"
                >
                  <ArrowDownCircle className="h-5 w-5" />
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {/* Main FAB button */}
      <Button
        onClick={toggleOpen}
        className={cn(
          "rounded-full w-14 h-14 shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300",
          isOpen && "rotate-45"
        )}
        data-testid="fab-main"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </div>
  );
}
