import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, CalendarIcon, Filter, RefreshCw } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCurrency } from '@/contexts/currency-context';

interface Transaction {
  id: string;
  amount: string;
  type: 'income' | 'expense';
  categoryId: string;
  description: string;
  date: string;
}

interface ReportCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'Disponible' | 'En Proceso';
  defaultPeriod: 'monthly' | 'weekly' | 'quarterly' | 'annual';
  transactions: Transaction[];
}

export default function ReportCard({
  id,
  title,
  description,
  icon: Icon,
  status,
  defaultPeriod,
  transactions
}: ReportCardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const { formatAmount } = useCurrency();

  // Calculate date range based on report type and period
  const getDateRange = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (selectedPeriod === 'custom' && startDate && endDate) {
      return { start: startDate, end: endDate };
    }

    switch (defaultPeriod) {
      case 'weekly':
        if (selectedPeriod === 'current') {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return { start: weekStart, end: weekEnd };
        } else if (selectedPeriod === 'previous') {
          const prevWeekStart = new Date(now);
          prevWeekStart.setDate(now.getDate() - now.getDay() - 7);
          const prevWeekEnd = new Date(prevWeekStart);
          prevWeekEnd.setDate(prevWeekStart.getDate() + 6);
          return { start: prevWeekStart, end: prevWeekEnd };
        }
        break;
      case 'monthly':
        if (selectedPeriod === 'current') {
          return {
            start: new Date(currentYear, currentMonth, 1),
            end: new Date(currentYear, currentMonth + 1, 0)
          };
        } else if (selectedPeriod === 'previous') {
          return {
            start: new Date(currentYear, currentMonth - 1, 1),
            end: new Date(currentYear, currentMonth, 0)
          };
        }
        break;
      case 'quarterly':
        const currentQuarter = Math.floor(currentMonth / 3);
        if (selectedPeriod === 'current') {
          return {
            start: new Date(currentYear, currentQuarter * 3, 1),
            end: new Date(currentYear, (currentQuarter + 1) * 3, 0)
          };
        } else if (selectedPeriod === 'previous') {
          return {
            start: new Date(currentYear, (currentQuarter - 1) * 3, 1),
            end: new Date(currentYear, currentQuarter * 3, 0)
          };
        }
        break;
      case 'annual':
        if (selectedPeriod === 'current') {
          return {
            start: new Date(currentYear, 0, 1),
            end: new Date(currentYear, 11, 31)
          };
        } else if (selectedPeriod === 'previous') {
          return {
            start: new Date(currentYear - 1, 0, 1),
            end: new Date(currentYear - 1, 11, 31)
          };
        } else if (selectedPeriod === 'ytd') {
          return {
            start: new Date(currentYear, 0, 1),
            end: now
          };
        }
        break;
    }

    // Default fallback
    return {
      start: new Date(currentYear, currentMonth, 1),
      end: new Date(currentYear, currentMonth + 1, 0)
    };
  };

  // Filter transactions for this report
  const getFilteredTransactions = () => {
    const { start, end } = getDateRange();
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= start && transactionDate <= end;
    });
  };

  // Calculate metrics for this report
  const calculateMetrics = () => {
    const filteredTransactions = getFilteredTransactions();

    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const netBalance = income - expenses;

    return { income, expenses, netBalance, transactionCount: filteredTransactions.length };
  };

  const metrics = calculateMetrics();

  // Export functionality
  const handleExport = async () => {
    if (status !== 'Disponible' || !selectedFormat) return;

    setIsExporting(true);
    try {
      const filteredTransactions = getFilteredTransactions();
      const { start, end } = getDateRange();

      const reportData = {
        reportId: id,
        title,
        period: `${formatDate(start, 'dd/MM/yyyy', { locale: es })} - ${formatDate(end, 'dd/MM/yyyy', { locale: es })}`,
        metrics,
        transactions: filteredTransactions
      };

      if (selectedFormat === 'csv') {
        await exportToCSV(reportData);
      } else if (selectedFormat === 'xlsx') {
        await exportToExcel(reportData);
      } else if (selectedFormat === 'pdf') {
        await exportToPDF(reportData);
      }

      console.log(`${title} exportado exitosamente en formato ${selectedFormat}`);
    } catch (error) {
      console.error('Error al exportar reporte:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getFileName = (extension: string) => {
    const today = formatDate(new Date(), 'dd-MM-yyyy', { locale: es });
    const reportName = title.toLowerCase().replace(/\s+/g, '_');
    return `${reportName}_${today}.${extension}`;
  };

  const exportToCSV = (reportData: any) => {
    const { title, period, transactions, metrics } = reportData;

    let csvContent = `${title}\nPeríodo: ${period}\n\n`;
    csvContent += `Resumen Financiero\n`;
    csvContent += `Ingresos,${metrics.income}\n`;
    csvContent += `Gastos,${metrics.expenses}\n`;
    csvContent += `Balance Neto,${metrics.netBalance}\n\n`;
    csvContent += `Detalle de Transacciones\n`;
    csvContent += `Fecha,Descripción,Tipo,Categoría,Monto\n`;

    transactions.forEach((t: any) => {
      csvContent += `${t.date},"${t.description}",${t.type},${t.categoryId},${t.amount}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = getFileName('csv');
    link.click();
  };

  const exportToExcel = (reportData: any) => {
    // For Excel, we'll export as CSV but with .xlsx extension for now
    // In a real implementation, you'd use a library like xlsx
    const { title, period, transactions, metrics } = reportData;

    let csvContent = `${title}\nPeríodo: ${period}\n\n`;
    csvContent += `Resumen Financiero\n`;
    csvContent += `Ingresos,${metrics.income}\n`;
    csvContent += `Gastos,${metrics.expenses}\n`;
    csvContent += `Balance Neto,${metrics.netBalance}\n\n`;
    csvContent += `Detalle de Transacciones\n`;
    csvContent += `Fecha,Descripción,Tipo,Categoría,Monto\n`;

    transactions.forEach((t: any) => {
      csvContent += `${t.date},"${t.description}",${t.type},${t.categoryId},${t.amount}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = getFileName('xlsx');
    link.click();
  };

  const exportToPDF = async (reportData: any) => {
    try {
      // Dynamic import for jsPDF
      const { jsPDF } = await import('jspdf');
      const { title, period, transactions, metrics } = reportData;

      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text(title.toUpperCase(), 20, 30);

      doc.setFontSize(12);
      doc.text(`Período: ${period}`, 20, 45);

      // Financial Summary
      doc.setFontSize(14);
      doc.text('RESUMEN FINANCIERO', 20, 65);

      doc.setFontSize(11);
      doc.text(`Ingresos: ${formatAmount(metrics.income.toString())}`, 20, 80);
      doc.text(`Gastos: ${formatAmount(metrics.expenses.toString())}`, 20, 90);
      doc.text(`Balance Neto: ${formatAmount(metrics.netBalance.toString())}`, 20, 100);
      doc.text(`Total de Transacciones: ${metrics.transactionCount}`, 20, 110);

      // Transactions detail
      if (transactions.length > 0) {
        doc.setFontSize(14);
        doc.text('DETALLE DE TRANSACCIONES', 20, 130);

        doc.setFontSize(9);
        let yPosition = 145;

        transactions.forEach((t: any, index: number) => {
          if (yPosition > 270) { // New page if needed
            doc.addPage();
            yPosition = 20;
          }

          const line = `${index + 1}. ${t.date} - ${t.description} (${t.type === 'income' ? 'Ingreso' : 'Gasto'}): ${formatAmount(t.amount)}`;
          doc.text(line, 20, yPosition);
          yPosition += 8;
        });
      }

      // Save the PDF
      doc.save(getFileName('pdf'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to text export if PDF fails
      const { title, period, transactions, metrics } = reportData;

      let content = `${title.toUpperCase()}\n`;
      content += `Período: ${period}\n\n`;
      content += `RESUMEN FINANCIERO\n`;
      content += `Ingresos: ${formatAmount(metrics.income.toString())}\n`;
      content += `Gastos: ${formatAmount(metrics.expenses.toString())}\n`;
      content += `Balance Neto: ${formatAmount(metrics.netBalance.toString())}\n`;
      content += `Total de Transacciones: ${metrics.transactionCount}\n\n`;
      content += `DETALLE DE TRANSACCIONES\n`;

      transactions.forEach((t: any, index: number) => {
        content += `${index + 1}. ${t.date} - ${t.description} (${t.type}): ${formatAmount(t.amount)}\n`;
      });

      const blob = new Blob([content], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = getFileName('txt');
      link.click();
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <Badge variant={status === 'Disponible' ? 'default' : 'secondary'}>
            {status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Report Filters */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4" />
            Filtros del Reporte
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Período
              </label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Actual</SelectItem>
                  <SelectItem value="previous">Anterior</SelectItem>
                  {defaultPeriod === 'annual' && <SelectItem value="ytd">Año a la Fecha</SelectItem>}
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range */}
            {selectedPeriod === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Desde
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-8 w-full justify-start text-left font-normal text-xs">
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {startDate ? formatDate(startDate, 'dd/MM', { locale: es }) : 'Fecha'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={(date) => {
                          if (date > new Date()) return true;
                          if (endDate && date > endDate) return true;
                          return false;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Hasta
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-8 w-full justify-start text-left font-normal text-xs">
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {endDate ? formatDate(endDate, 'dd/MM', { locale: es }) : 'Fecha'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => {
                          if (date > new Date()) return true;
                          if (startDate && date < startDate) return true;
                          return false;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Summary */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Resumen del Período</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-green-600 font-medium">{formatAmount(metrics.income.toString())}</div>
              <div className="text-muted-foreground">Ingresos</div>
            </div>
            <div>
              <div className="text-red-600 font-medium">{formatAmount(metrics.expenses.toString())}</div>
              <div className="text-muted-foreground">Gastos</div>
            </div>
            <div>
              <div className={`font-medium ${metrics.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.netBalance >= 0 ? '+' : ''}{formatAmount(metrics.netBalance.toString())}
              </div>
              <div className="text-muted-foreground">Balance</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {metrics.transactionCount} transacciones encontradas
          </div>
        </div>

        {/* Export Options */}
        <div className="flex gap-2">
          <Select value={selectedFormat} onValueChange={setSelectedFormat}>
            <SelectTrigger
              className="flex-1"
              disabled={status !== 'Disponible' || isExporting}
            >
              <SelectValue placeholder="Seleccionar formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="xlsx">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleExport}
            disabled={status !== 'Disponible' || isExporting || !selectedFormat || metrics.transactionCount === 0}
            size="sm"
            className="px-3"
          >
            {isExporting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
