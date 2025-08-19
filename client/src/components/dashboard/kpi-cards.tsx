import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Percent } from "lucide-react";

interface KpiCardsProps {
  data?: {
    currentBalance: string;
    monthlyIncome: string;
    monthlyExpenses: string;
    inflationRate: string;
  };
}

export default function KpiCards({ data }: KpiCardsProps) {
  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount || "0");
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Current Balance */}
      <Card className="bg-white border border-gray-200" data-testid="card-current-balance">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo Actual</p>
              <p className="text-2xl font-bold text-gray-900" data-testid="text-current-balance">
                {formatCurrency(data?.currentBalance || "0")}
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="text-secondary h-4 w-4 mr-1" />
                <span className="text-secondary text-sm font-medium">+12.5%</span>
                <span className="text-muted-foreground text-sm ml-2">vs. mes anterior</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
              <Wallet className="text-secondary h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Income */}
      <Card className="bg-white border border-gray-200" data-testid="card-monthly-income">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ingresos del Mes</p>
              <p className="text-2xl font-bold text-gray-900" data-testid="text-monthly-income">
                {formatCurrency(data?.monthlyIncome || "0")}
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="text-secondary h-4 w-4 mr-1" />
                <span className="text-secondary text-sm font-medium">+8.3%</span>
                <span className="text-muted-foreground text-sm ml-2">ajustado inflación</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <ArrowUpRight className="text-primary h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Expenses */}
      <Card className="bg-white border border-gray-200" data-testid="card-monthly-expenses">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Egresos del Mes</p>
              <p className="text-2xl font-bold text-gray-900" data-testid="text-monthly-expenses">
                {formatCurrency(data?.monthlyExpenses || "0")}
              </p>
              <div className="flex items-center mt-2">
                <TrendingDown className="text-destructive h-4 w-4 mr-1" />
                <span className="text-destructive text-sm font-medium">-4.2%</span>
                <span className="text-muted-foreground text-sm ml-2">vs. proyectado</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <ArrowDownRight className="text-destructive h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inflation Rate */}
      <Card className="bg-white border border-gray-200" data-testid="card-inflation-rate">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Inflación Mensual</p>
              <p className="text-2xl font-bold text-gray-900" data-testid="text-inflation-rate">
                {data?.inflationRate || "0"}%
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="text-orange-500 h-4 w-4 mr-1" />
                <span className="text-orange-500 text-sm font-medium">INDEC Nov 2024</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Percent className="text-orange-500 h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
