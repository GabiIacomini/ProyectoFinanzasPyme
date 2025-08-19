import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './auth-context';

type Currency = 'ARS' | 'USD';
type DollarType = 'oficial' | 'blue' | 'mep';

interface CurrencyContextType {
  currency: Currency;
  dollarType: DollarType;
  setCurrency: (currency: Currency) => void;
  setDollarType: (type: DollarType) => void;
  formatAmount: (amount: string | number, showSymbol?: boolean) => string;
  exchangeRate: number | null;
  convertAmount: (amount: string | number, fromCurrency: Currency, toCurrency: Currency) => number;
  getDollarRates: () => { oficial: number; blue: number; mep: number };
  isLoadingRates: boolean;
  refreshRates: () => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Real-time exchange rates from DolarAPI.com
const FALLBACK_RATES = {
  oficial: 1270,   // Fallback rates in case API fails
  blue: 1300,
  mep: 1304
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currency, setCurrencyState] = useState<Currency>('ARS');
  const [dollarType, setDollarTypeState] = useState<DollarType>('oficial');
  const [dollarRates, setDollarRates] = useState(FALLBACK_RATES);
  const [exchangeRate, setExchangeRate] = useState<number>(FALLBACK_RATES.oficial);
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  useEffect(() => {
    if (user?.preferredCurrency) {
      setCurrencyState(user.preferredCurrency as Currency);
    } else {
      const storedCurrency = localStorage.getItem('preferred_currency') as Currency;
      if (storedCurrency && ['ARS', 'USD'].includes(storedCurrency)) {
        setCurrencyState(storedCurrency);
      }
    }

    const storedDollarType = localStorage.getItem('preferred_dollar_type') as DollarType;
    if (storedDollarType && ['oficial', 'blue', 'mep'].includes(storedDollarType)) {
      setDollarTypeState(storedDollarType);
    }
  }, [user]);

  // Fetch real exchange rates from DolarAPI
  const fetchExchangeRates = async () => {
    setIsLoadingRates(true);
    try {
      const endpoints = [
        { type: 'oficial', url: 'https://dolarapi.com/v1/dolares/oficial' },
        { type: 'blue', url: 'https://dolarapi.com/v1/dolares/blue' },
        { type: 'mep', url: 'https://dolarapi.com/v1/dolares/bolsa' } // MEP is called "bolsa" in DolarAPI
      ];

      const fetchPromises = endpoints.map(async endpoint => {
        try {
          const response = await fetch(endpoint.url);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          return {
            type: endpoint.type,
            rate: data.venta || data.compra || FALLBACK_RATES[endpoint.type as keyof typeof FALLBACK_RATES]
          };
        } catch (error) {
          console.warn(`Error fetching ${endpoint.type} rate:`, error);
          return {
            type: endpoint.type,
            rate: FALLBACK_RATES[endpoint.type as keyof typeof FALLBACK_RATES]
          };
        }
      });

      const rates = await Promise.all(fetchPromises);
      const newRates = rates.reduce((acc, { type, rate }) => {
        acc[type as keyof typeof FALLBACK_RATES] = rate;
        return acc;
      }, {} as typeof FALLBACK_RATES);

      setDollarRates(newRates);
      setExchangeRate(newRates[dollarType]);

      console.log('Exchange rates updated:', newRates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      setDollarRates(FALLBACK_RATES);
      setExchangeRate(FALLBACK_RATES[dollarType]);
    } finally {
      setIsLoadingRates(false);
    }
  };

  useEffect(() => {
    fetchExchangeRates();
    // Update rates every 5 minutes
    const interval = setInterval(fetchExchangeRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setExchangeRate(dollarRates[dollarType]);
  }, [dollarType, dollarRates]);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('preferred_currency', newCurrency);
  };

  const setDollarType = (newDollarType: DollarType) => {
    setDollarTypeState(newDollarType);
    localStorage.setItem('preferred_dollar_type', newDollarType);
    setExchangeRate(dollarRates[newDollarType]);
  };

  const getDollarRates = () => dollarRates;

  const formatAmount = (amount: string | number, showSymbol: boolean = true): string => {
    let numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numericAmount)) return '0';

    // If displaying in USD and the amount is originally in ARS, convert it
    if (currency === 'USD' && exchangeRate) {
      // Assuming the original amount is in ARS, convert to USD
      numericAmount = numericAmount / exchangeRate;
    }

    const formatted = new Intl.NumberFormat('es-AR', {
      style: 'decimal',
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0,
    }).format(Math.abs(numericAmount));

    const symbol = '$';
    const currencyCode = currency === 'USD' ? ` USD` : ' ARS';

    return showSymbol ? `${symbol}${formatted}${currencyCode}` : formatted;
  };

  const convertAmount = (
    amount: string | number,
    fromCurrency: Currency,
    toCurrency: Currency
  ): number => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numericAmount) || !exchangeRate) return 0;

    if (fromCurrency === toCurrency) return numericAmount;

    // Convert ARS to USD: cantidad_pesos / precio_dolar_seleccionado
    if (fromCurrency === 'ARS' && toCurrency === 'USD') {
      return numericAmount / exchangeRate;
    }

    // Convert USD to ARS: cantidad_dolares * precio_dolar_seleccionado
    if (fromCurrency === 'USD' && toCurrency === 'ARS') {
      return numericAmount * exchangeRate;
    }

    return numericAmount;
  };

  const value = {
    currency,
    dollarType,
    setCurrency,
    setDollarType,
    formatAmount,
    exchangeRate,
    convertAmount,
    getDollarRates,
    isLoadingRates,
    refreshRates: fetchExchangeRates,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
