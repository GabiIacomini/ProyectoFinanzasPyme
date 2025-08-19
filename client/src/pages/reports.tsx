import { useQuery } from '@tanstack/react-query';
import Navigation from '@/components/navigation';
import PageTransition from '@/components/page-transition';
import ReportCard from '@/components/reports/report-card';
import { FileText, TrendingUp, PieChart, Calculator } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function Reports() {
  const { user } = useAuth();

  const { data: transactions } = useQuery({
    queryKey: ['/api/transactions', user?.id],
    enabled: !!user?.id,
  });

  const reports = [
    {
      id: 'income-statement',
      title: 'Estado de Resultados',
      description: 'Análisis completo de ingresos y gastos por período',
      icon: FileText,
      defaultPeriod: 'monthly' as const,
      status: 'Disponible' as const,
    },
    {
      id: 'cash-flow',
      title: 'Flujo de Caja',
      description: 'Análisis de liquidez y proyecciones semanales',
      icon: TrendingUp,
      defaultPeriod: 'weekly' as const,
      status: 'Disponible' as const,
    },
    {
      id: 'expense-analysis',
      title: 'Análisis de Gastos',
      description: 'Desglose detallado por categorías y tendencias',
      icon: PieChart,
      defaultPeriod: 'monthly' as const,
      status: 'Disponible' as const,
    },
    {
      id: 'tax-summary',
      title: 'Resumen Fiscal',
      description: 'Preparación para declaraciones impositivas anuales',
      icon: Calculator,
      defaultPeriod: 'annual' as const,
      status: 'En Proceso' as const,
    },
  ];



  return (
    <PageTransition>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Mis Informes
          </h1>
          <p className="text-muted-foreground">
            Informes sencillos para entender tu negocio
          </p>
        </div>



        {/* Reportes con Filtros Individuales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              id={report.id}
              title={report.title}
              description={report.description}
              icon={report.icon}
              status={report.status}
              defaultPeriod={report.defaultPeriod}
              transactions={Array.isArray(transactions) ? transactions : []}
            />
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
