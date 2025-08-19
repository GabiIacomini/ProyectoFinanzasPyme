import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { CurrencyProvider } from "@/contexts/currency-context";
import { ThemeProvider } from "@/contexts/theme-context";
import ProtectedRoute from "@/components/protected-route";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import CashFlow from "@/pages/cash-flow";
import Transactions from "@/pages/transactions";
import AiAnalysis from "@/pages/ai-analysis";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Login from "@/pages/login";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/cash-flow">
        <ProtectedRoute>
          <CashFlow />
        </ProtectedRoute>
      </Route>
      <Route path="/transactions">
        <ProtectedRoute>
          <Transactions />
        </ProtectedRoute>
      </Route>
      <Route path="/ai-analysis">
        <ProtectedRoute>
          <AiAnalysis />
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CurrencyProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </CurrencyProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
