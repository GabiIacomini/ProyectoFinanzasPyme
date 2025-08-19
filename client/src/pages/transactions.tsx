import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Navigation from "@/components/navigation";
import {
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CalendarIcon,
  DollarSign,
  Search,
  Download,
  Plus,
  RefreshCw
} from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  description: string;
  amount: string;
  type: 'income' | 'expense';
  categoryId: string;
  date: string;
}

interface TransactionCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

export default function TransactionsPage() {
  const { formatAmount } = useCurrency();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [amountFrom, setAmountFrom] = useState("");
  const [amountTo, setAmountTo] = useState("");

  // Fetch transactions
  const { data: transactions = [], isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery({
    queryKey: ['/api/transactions/3fe9b19a-6dcf-4525-937f-6e3bce2b18e0'],
    enabled: true,
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/transaction-categories'],
    enabled: true,
  });

  // Category mapping
  const categoryMap = useMemo(() => {
    const map: { [key: string]: string } = {};
    if (Array.isArray(categories)) {
      categories.forEach((cat: TransactionCategory) => {
        map[cat.id] = cat.name;
      });
    }
    return map;
  }, [categories]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    return transactions.filter((transaction: Transaction) => {
      // Search term filter
      if (searchTerm && !transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Type filter
      if (typeFilter !== "all" && transaction.type !== typeFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== "all" && transaction.categoryId !== categoryFilter) {
        return false;
      }

      // Date range filter
      const transactionDate = new Date(transaction.date);
      if (dateFrom && transactionDate < dateFrom) {
        return false;
      }
      if (dateTo && transactionDate > dateTo) {
        return false;
      }

      // Amount range filter
      const amount = parseFloat(transaction.amount);
      if (amountFrom && amount < parseFloat(amountFrom)) {
        return false;
      }
      if (amountTo && amount > parseFloat(amountTo)) {
        return false;
      }

      return true;
    });
  }, [transactions, searchTerm, typeFilter, categoryFilter, dateFrom, dateTo, amountFrom, amountTo]);

  // Calculate totals
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter((t: Transaction) => t.type === 'income')
      .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0);

    const expenses = filteredTransactions
      .filter((t: Transaction) => t.type === 'expense')
      .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0);

    return {
      income,
      expenses,
      net: income - expenses,
      count: filteredTransactions.length
    };
  }, [filteredTransactions]);

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setAmountFrom("");
    setAmountTo("");
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
  };

  const getTransactionIcon = (type: 'income' | 'expense') => {
    return type === 'income' ? (
      <ArrowDownRight className="h-4 w-4" />
    ) : (
      <ArrowUpRight className="h-4 w-4" />
    );
  };

  if (transactionsLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Mis Movimientos</h2>
              <p className="text-muted-foreground mt-1">
                Todos tus ingresos y gastos en un solo lugar
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              <Button
                onClick={() => refetchTransactions()}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                data-testid="button-refresh"
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex items-center gap-2"
                data-testid="button-add-transaction"
              >
                <Plus className="h-4 w-4" />
                Nueva Transacción
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Transacciones
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-total-count">
                {totals.count}
              </div>
              <p className="text-xs text-muted-foreground">
                Registros filtrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Ingresos
              </CardTitle>
              <ArrowDownRight className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-total-income">
                {formatAmount(totals.income.toString())}
              </div>
              <p className="text-xs text-muted-foreground">
                Suma de ingresos filtrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Gastos
              </CardTitle>
              <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-total-expenses">
                {formatAmount(totals.expenses.toString())}
              </div>
              <p className="text-xs text-muted-foreground">
                Suma de gastos filtrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Balance Neto
              </CardTitle>
              <DollarSign className={`h-4 w-4 ${totals.net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totals.net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`} data-testid="text-net-balance">
                {formatAmount(totals.net.toString())}
              </div>
              <p className="text-xs text-muted-foreground">
                Diferencia ingresos - gastos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros de Búsqueda
              </CardTitle>
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                data-testid="button-clear-filters"
              >
                Limpiar Filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                    data-testid="input-search"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tipo</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger data-testid="select-type">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="income">Ingresos</SelectItem>
                    <SelectItem value="expense">Gastos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Categoría</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {Array.isArray(categories) && categories.map((cat: TransactionCategory) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Fecha Desde</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                      data-testid="button-date-from"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Fecha Hasta</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                      data-testid="button-date-to"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      disabled={(date) => {
                        if (date > new Date()) return true;
                        if (dateFrom && date < dateFrom) return true;
                        return false;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Rango de Importe</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={amountFrom}
                    onChange={(e) => setAmountFrom(e.target.value)}
                    className="w-20"
                    data-testid="input-amount-from"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={amountTo}
                    onChange={(e) => setAmountTo(e.target.value)}
                    className="w-20"
                    data-testid="input-amount-to"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground">
                Lista de Transacciones ({filteredTransactions.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                data-testid="button-export"
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No se encontraron transacciones</h3>
                <p className="text-muted-foreground">
                  Ajusta los filtros para encontrar las transacciones que buscas
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((transaction: Transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors"
                    data-testid={`transaction-${transaction.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        transaction.type === 'income'
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      }`}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {transaction.description}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {categoryMap[transaction.categoryId] || 'Sin categoría'}
                          </Badge>
                          <span>•</span>
                          <span>{formatDate(transaction.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${
                        transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
