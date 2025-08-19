import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";

interface AiInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
}

interface AiInsightsProps {
  insights?: AiInsight[];
}

export default function AiInsights({ insights }: AiInsightsProps) {
  const getInsightColor = (type: string) => {
    switch (type) {
      case 'pattern':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'opportunity':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'recommendation':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const getInsightTitle = (type: string) => {
    switch (type) {
      case 'pattern':
        return 'Patrón Detectado';
      case 'opportunity':
        return 'Oportunidad de Ahorro';
      case 'recommendation':
        return 'Recomendación';
      default:
        return 'Análisis';
    }
  };

  // Default insights if no data provided
  const defaultInsights = [
    {
      id: '1',
      type: 'pattern',
      title: 'Patrón Detectado',
      description: 'Tus gastos en insumos aumentan 15% cada trimestre. Considera negociar contratos a largo plazo.',
      priority: 'medium'
    },
    {
      id: '2',
      type: 'opportunity',
      title: 'Oportunidad de Ahorro',
      description: 'Optimizando gastos operativos podrías ahorrar $284.750 mensualmente.',
      priority: 'high'
    },
    {
      id: '3',
      type: 'recommendation',
      title: 'Recomendación',
      description: 'Diversifica en USD: 25% de tus reservas para protegerte de la inflación.',
      priority: 'high'
    }
  ];

  const displayInsights = insights || defaultInsights;

  return (
    <Card className="bg-white border border-gray-200" data-testid="card-ai-insights">
      <CardHeader>
        <div className="flex items-center">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
            <Bot className="text-purple-600 h-4 w-4" />
          </div>
          <CardTitle className="text-lg font-semibold text-gray-900">Análisis IA</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayInsights.slice(0, 3).map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
              data-testid={`insight-${insight.type}`}
            >
              <h4 className="text-sm font-medium mb-2">
                {getInsightTitle(insight.type)}
              </h4>
              <p className="text-sm">
                {insight.description}
              </p>
            </div>
          ))}
        </div>
        <Button
          className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
          data-testid="button-view-full-analysis"
        >
          Ver Análisis Completo
        </Button>
      </CardContent>
    </Card>
  );
}
