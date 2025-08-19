import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Moon, Sun, DollarSign, Settings as SettingsIcon, RefreshCw, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import { useCurrency } from '@/contexts/currency-context';
// Temporary theme hook until theme context is fully implemented
const useTheme = () => {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
  };

  useState(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark';
    if (stored) {
      setThemeState(stored);
      if (stored === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  });

  return { theme, setTheme };
};
import PageTransition from '@/components/page-transition';
import { Link } from 'wouter';

export default function Settings() {
  const {
    currency,
    dollarType,
    setCurrency,
    setDollarType,
    getDollarRates,
    isLoadingRates,
    refreshRates
  } = useCurrency();

  const { theme, setTheme } = useTheme();
  const dollarRates = getDollarRates();

  const formatRate = (rate: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rate);
  };

  const getRateChange = (type: 'oficial' | 'blue' | 'mep') => {
    // Mock data for trends - in real app this would come from API
    const changes = {
      oficial: 2.5,
      blue: -1.2,
      mep: 0.8
    };
    return changes[type];
  };

  return (
    <PageTransition>
      <div className="p-6 space-y-6">
        {/* Header with back navigation */}
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Volver al Dashboard</span>
            </Button>
          </Link>
        </div>

        <div className="flex items-center space-x-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Configuración
            </h1>
            <p className="text-muted-foreground">
              Personaliza tu experiencia en FinPyME Pro
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Theme Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <span>Apariencia</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base text-foreground">Modo Oscuro</Label>
                  <div className="text-sm text-muted-foreground">
                    Cambia entre tema claro y oscuro
                  </div>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  data-testid="switch-dark-mode"
                />
              </div>
            </CardContent>
          </Card>

          {/* Currency Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Configuración de Moneda</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshRates}
                  disabled={isLoadingRates}
                  className="h-8 w-8 p-0"
                  data-testid="button-refresh-rates"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingRates ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Currency Selector */}
              <div className="space-y-2">
                <Label className="text-base text-foreground">Moneda Principal</Label>
                <Select value={currency} onValueChange={setCurrency} data-testid="select-currency">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">Peso Argentino (ARS)</SelectItem>
                    <SelectItem value="USD">Dólar Estadounidense (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dollar Type Selector - Only shown when USD is selected */}
              {currency === 'USD' && (
                <div className="space-y-2">
                  <Label className="text-base text-foreground">Tipo de Dólar</Label>
                  <Select value={dollarType} onValueChange={setDollarType} data-testid="select-dollar-type">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oficial">Dólar Oficial</SelectItem>
                      <SelectItem value="blue">Dólar Blue</SelectItem>
                      <SelectItem value="mep">Dólar MEP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              {/* Exchange Rates Display */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base text-foreground">Cotizaciones del Dólar</Label>
                  {isLoadingRates && (
                    <div className="flex items-center space-x-1">
                      <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                      <span className="text-xs text-blue-600">Actualizando...</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(dollarRates).map(([type, rate]) => {
                    const change = getRateChange(type as 'oficial' | 'blue' | 'mep');
                    const isPositive = change > 0;
                    const isSelected = currency === 'USD' && dollarType === type;

                    return (
                      <div
                        key={type}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                        }`}
                        data-testid={`rate-${type}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="font-medium capitalize flex items-center space-x-2 text-foreground">
                              <span>{type === 'mep' ? 'MEP' : type.charAt(0).toUpperCase() + type.slice(1)}</span>
                              {isSelected && (
                                <Badge variant="default" className="text-xs">
                                  Activo
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Dólar {type === 'mep' ? 'MEP' : type}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-lg text-foreground">
                            ${formatRate(rate)}
                          </div>
                          <div className={`flex items-center justify-end space-x-1 text-sm ${
                            isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {isPositive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            <span>{Math.abs(change)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Plan Actual</Label>
                <p className="text-lg font-semibold text-foreground">FinPyME Pro</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Última Actualización</Label>
                <p className="text-lg font-semibold text-foreground">Hace 2 minutos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
