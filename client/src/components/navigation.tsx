import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, ChartLine, User, LogOut, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import NotificationPanel from "@/components/notifications/notification-panel";


export default function Navigation() {
  const [location] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();

  const { data: notificationCount } = useQuery<{count: number}>({
    queryKey: [`/api/notifications/${user?.id}/count`],
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh count every 30 seconds
  });

  const isActive = (path: string) => {
    if (path === "/" && (location === "/" || location === "/dashboard")) return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 sticky top-0 z-50 transition-all duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer transform hover:scale-105 transition-transform duration-200">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg">
                <ChartLine className="text-white" size={16} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-app-title">
                FinPyME Pro
              </h1>
            </div>
          </Link>
          <div className="hidden md:flex items-center space-x-6 ml-8">
            <Link
              href="/"
              className={`transition-all duration-200 ${isActive("/") ? "text-primary font-medium border-b-2 border-primary pb-2" : "text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100 hover:pb-1"}`}
              data-testid="link-dashboard"
            >
              Inicio
            </Link>
            <Link
              href="/cash-flow"
              className={`transition-all duration-200 ${isActive("/cash-flow") ? "text-primary font-medium border-b-2 border-primary pb-2" : "text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100 hover:pb-1"}`}
              data-testid="link-cash-flow"
            >
              Mi Dinero
            </Link>
            <Link
              href="/transactions"
              className={`transition-all duration-200 ${isActive("/transactions") ? "text-primary font-medium border-b-2 border-primary pb-2" : "text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100 hover:pb-1"}`}
              data-testid="link-transactions"
            >
              Mis Movimientos
            </Link>
            <Link
              href="/ai-analysis"
              className={`transition-all duration-200 ${isActive("/ai-analysis") ? "text-primary font-medium border-b-2 border-primary pb-2" : "text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100 hover:pb-1"}`}
              data-testid="link-ai-analysis"
            >Recomendaciones</Link>
            <Link
              href="/reports"
              className={`transition-all duration-200 ${isActive("/reports") ? "text-primary font-medium border-b-2 border-primary pb-2" : "text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100 hover:pb-1"}`}
              data-testid="link-reports"
            >
              Mis Informes
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">


          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            data-testid="button-notifications"
            onClick={() => setShowNotifications(true)}
          >
            <Bell size={20} />
            {notificationCount && notificationCount.count > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center animate-pulse">
                {notificationCount.count > 9 ? '9+' : notificationCount.count}
              </span>
            )}
          </Button>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                data-testid="button-user-menu"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-md">
                  <User size={16} className="text-white" />
                </div>
                <span className="hidden md:inline text-sm font-medium">
                  {user?.username || 'Usuario'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground">{user?.companyName}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild data-testid="menu-settings">
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600 hover:bg-red-50"
                data-testid="menu-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </nav>
  );
}
