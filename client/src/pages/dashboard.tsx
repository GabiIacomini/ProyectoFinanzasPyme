import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import PageTransition from "@/components/page-transition";
import EnhancedTransactionForm from "@/components/enhanced-transaction-form";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import ExpenseCategories from "@/components/dashboard/expense-categories";
import TransactionKpiCards from "@/components/dashboard/transaction-kpi-cards";
import TransactionSummaryChart from "@/components/dashboard/transaction-summary-chart";
import CurrencySelector from "@/components/dashboard/currency-selector";
// import NotificationGenerator from "@/components/notifications/notification-generator";
import QuickActionButtons from "@/components/dashboard/quick-action-buttons";
import CurrencyRatesBanner from "@/components/dashboard/currency-rates-banner";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useCurrency } from "@/contexts/currency-context";
import { useState } from "react";

export default function Dashboard() {

  const { user } = useAuth();
  const { formatAmount } = useCurrency();

  const userId = user?.id || "demo-user-id";

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard', userId],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: transactions } = useQuery({
    queryKey: ['/api/transactions', userId],
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <PageTransition>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <p className="text-red-800 dark:text-red-200">
              Error al cargar los datos del dashboard. Por favor, intente nuevamente.
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Navigation />
      {/* <NotificationGenerator
        transactions={transactions as any}
        dashboardData={dashboardData}
      /> */}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Currency Rates Banner */}
        <CurrencyRatesBanner />

        {/* Header */}
        <div className="mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Hola, {user?.username}! 👋
            </h2>
            <p className="text-muted-foreground mt-1">
              Análisis financiero de {user?.companyName || 'tu empresa'}
            </p>
          </div>
        </div>





        {/* Quick Action Buttons */}
        <QuickActionButtons userId={userId} />

        {/* Transaction KPI Cards */}
        <TransactionKpiCards transactions={Array.isArray(transactions) ? transactions : []} />

        {/* Main Dashboard Grid - Transaction Focus */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 mt-8">
          <TransactionSummaryChart transactions={Array.isArray(transactions) ? transactions : []} />
          <ExpenseCategories
            transactions={Array.isArray(transactions) ? transactions : []}
          />
        </div>

        {/* Recent Transactions */}
        <div className="mb-8">
          <RecentTransactions transactions={Array.isArray(transactions) ? transactions : []} />
        </div>


      </div>
    </PageTransition>
  );
}
