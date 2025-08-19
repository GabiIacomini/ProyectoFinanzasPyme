import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Bot, TrendingUp, Target, Lightbulb, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function AiAnalysis() {
  const [filter, setFilter] = useState<string>("all");

  // Mock user ID - in a real app this would come from authentication
  const userId = "demo-user-id";

  const { data: insights, isLoading, error } = useQuery({
    queryKey: ['/api/ai-insights', userId],
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern':
        return <TrendingUp className="h-5 w-5" />;
      case 'opportunity':
        return <Target className="h-5 w-5" />;
      case 'recommendation':
        return <Lightbulb className="h-5 w-5" />;
      case 'alert':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Bot className="h-5 w-5" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'pattern':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
      case 'opportunity':
        return 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
      case 'recommendation':
        return 'bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800';
      case 'alert':
        return 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
    }
  };

  const getInsightTitle = (type: string) => {
    switch (type) {
      case 'pattern':
        return 'Patrón Detectado';
      case 'opportunity':
        return 'Oportunidad';
      case 'recommendation':
        return 'Recomendación';
      case 'alert':
        return 'Alerta';
      default:
        return 'Análisis';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Alta Prioridad</Badge>;
      case 'medium':
        return <Badge variant="secondary">Media Prioridad</Badge>;
      case 'low':
        return <Badge variant="outline">Baja Prioridad</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Hoy';
    } else if (diffInDays === 1) {
      return 'Ayer';
    } else if (diffInDays < 7) {
      return `Hace ${diffInDays} días`;
    } else {
      return date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
    }
  };

  const filteredInsights = Array.isArray(insights) ? insights.filter((insight: any) => {
    if (filter === "all") return true;
    if (filter === "unread") return !insight.isRead;
    return insight.type === filter;
  }) : [];

  const unreadCount = Array.isArray(insights) ? insights.filter((insight: any) => !insight.isRead).length : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              Error al cargar el análisis de IA.
            </AlertDescription>
          </Alert>
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Consejos Inteligentes</h2>
              <p className="text-muted-foreground mt-1">
                Recomendaciones automáticas para mejorar tus finanzas
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Button variant="outline" data-testid="button-export-insights">
                <i className="fas fa-download mr-2"></i>
                Exportar
              </Button>
              <Button data-testid="button-refresh-analysis">
                <Bot className="h-4 w-4 mr-2" />
                Actualizar Análisis
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200" data-testid="card-total-insights">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Insights</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-total-insights">
                    {Array.isArray(insights) ? insights.length : 0}
                  </p>
                </div>
                <Bot className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200" data-testid="card-unread-insights">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sin Leer</p>
                  <p className="text-2xl font-bold text-orange-600" data-testid="text-unread-insights">
                    {unreadCount}
                  </p>
                </div>
                <EyeOff className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200" data-testid="card-high-priority">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Alta Prioridad</p>
                  <p className="text-2xl font-bold text-red-600" data-testid="text-high-priority">
                    {Array.isArray(insights) ? insights.filter((i: any) => i.priority === 'high').length : 0}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200" data-testid="card-opportunities">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Oportunidades</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="text-opportunities">
                    {Array.isArray(insights) ? insights.filter((i: any) => i.type === 'opportunity').length : 0}
                  </p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              data-testid="filter-all"
            >
              Todos
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              onClick={() => setFilter("unread")}
              data-testid="filter-unread"
            >
              Sin Leer ({unreadCount})
            </Button>
            <Button
              variant={filter === "alert" ? "default" : "outline"}
              onClick={() => setFilter("alert")}
              data-testid="filter-alerts"
            >
              Alertas
            </Button>
            <Button
              variant={filter === "opportunity" ? "default" : "outline"}
              onClick={() => setFilter("opportunity")}
              data-testid="filter-opportunities"
            >
              Oportunidades
            </Button>
            <Button
              variant={filter === "recommendation" ? "default" : "outline"}
              onClick={() => setFilter("recommendation")}
              data-testid="filter-recommendations"
            >
              Recomendaciones
            </Button>
            <Button
              variant={filter === "pattern" ? "default" : "outline"}
              onClick={() => setFilter("pattern")}
              data-testid="filter-patterns"
            >
              Patrones
            </Button>
          </div>
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInsights.map((insight: any) => (
            <Card
              key={insight.id}
              className={`bg-white border ${!insight.isRead ? 'border-blue-300 shadow-md' : 'border-gray-200'}`}
              data-testid={`insight-card-${insight.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${getInsightColor(insight.type)}`}>
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex items-center space-x-2">
                    {getPriorityBadge(insight.priority)}
                    {!insight.isRead && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        Nuevo
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-gray-900">
                    {getInsightTitle(insight.type)}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(insight.createdAt)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="font-medium text-gray-900 mb-2" data-testid={`insight-title-${insight.id}`}>
                  {insight.title}
                </h4>
                <p className="text-sm text-muted-foreground mb-4" data-testid={`insight-description-${insight.id}`}>
                  {insight.description}
                </p>
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary"
                    data-testid={`button-view-details-${insight.id}`}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Detalles
                  </Button>
                  {insight.type === 'recommendation' && (
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid={`button-apply-recommendation-${insight.id}`}
                    >
                      Aplicar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredInsights.length === 0 && (
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-12 text-center">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay insights disponibles
              </h3>
              <p className="text-muted-foreground">
                {filter === "all"
                  ? "El análisis de IA está procesando tus datos. Vuelve en unos minutos."
                  : `No hay insights del tipo "${filter}" disponibles actualmente.`
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
