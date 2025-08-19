import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useCurrency } from '@/contexts/currency-context';

export default function CurrencySelector() {
  const { currency, dollarType, setCurrency, setDollarType, getDollarRates, isLoadingRates, refreshRates } = useCurrency();
  const dollarRates = getDollarRates();

  const formatRate = (rate: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rate);
  };

  const getRateChange = (type: 'oficial' | 'blue' | 'mep') => {
    // Mock rate changes for demonstration
    const changes = {
      oficial: +15,
      blue: -25,
      mep: +8
    };
    return changes[type];
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Configuración de Moneda
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshRates}
            disabled={isLoadingRates}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${isLoadingRates ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Compact Currency Configuration - All in one row */}
        <div className="flex items-center gap-3">
          {/* Currency Selector */}
          <div className="flex-1">
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="h-8 bg-white dark:bg-gray-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS">Peso (ARS)</SelectItem>
                <SelectItem value="USD">Dólar (USD)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dollar Type Selector - Only shown when USD is selected */}
          {currency === 'USD' && (
            <div className="flex-1">
              <Select value={dollarType} onValueChange={setDollarType}>
                <SelectTrigger className="h-8 bg-white dark:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oficial">Oficial</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="mep">MEP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Dollar Exchange Rates Display - Only when USD is selected */}
        {currency === 'USD' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium text-muted-foreground">
                Cotizaciones Dólar
              </h4>
              {isLoadingRates && (
                <div className="flex items-center space-x-1">
                  <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                  <span className="text-xs text-blue-600">Actualizando...</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(dollarRates).map(([type, rate]) => {
                const change = getRateChange(type as 'oficial' | 'blue' | 'mep');
                const isPositive = change > 0;
                const isSelected = dollarType === type;

                return (
                  <div
                    key={type}
                    className={`p-2 rounded-md border text-center transition-colors ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-600'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="text-xs font-medium capitalize mb-1">
                      {type === 'mep' ? 'MEP' : type}
                      {isSelected && (
                        <Badge variant="default" className="h-3 text-xs ml-1 px-1">
                          •
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs font-semibold">
                      ${formatRate(rate)}
                    </div>
                    <div className={`flex items-center justify-center mt-1 ${
                      isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {isPositive ? (
                        <TrendingUp className="h-2 w-2" />
                      ) : (
                        <TrendingDown className="h-2 w-2" />
                      )}
                      <span className="text-xs ml-1">
                        {Math.abs(change)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
