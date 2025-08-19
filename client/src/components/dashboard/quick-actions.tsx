import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, FileText, Gem } from "lucide-react";

export default function QuickActions() {
  return (
    <Card className="bg-white border border-gray-200" data-testid="card-quick-actions">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="flex flex-col items-center p-4 h-auto border border-gray-200 hover:border-primary hover:bg-blue-50 transition-colors"
            data-testid="button-add-income"
          >
            <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center mb-2">
              <Plus className="text-secondary h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-900">Agregar Ingreso</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center p-4 h-auto border border-gray-200 hover:border-primary hover:bg-blue-50 transition-colors"
            data-testid="button-add-expense"
          >
            <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center mb-2">
              <Minus className="text-destructive h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-900">Registrar Gasto</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center p-4 h-auto border border-gray-200 hover:border-primary hover:bg-blue-50 transition-colors"
            data-testid="button-generate-report"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <FileText className="text-primary h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-900">Generar Reporte</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center p-4 h-auto border border-gray-200 hover:border-primary hover:bg-blue-50 transition-colors"
            data-testid="button-view-projections"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-2">
              <Gem className="text-purple-600 h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-900">Ver Proyecciones</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
