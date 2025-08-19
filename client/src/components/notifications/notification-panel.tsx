import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  X,
  Check,
  AlertTriangle,
  Info,
  TrendingUp,
  DollarSign,
  Calendar,
  Target,
  Lightbulb,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/queryClient";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: any;
  createdAt: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const notificationIcons = {
  expense_alert: AlertTriangle,
  business_tip: Lightbulb,
  cash_flow_warning: TrendingUp,
  payment_reminder: Calendar,
  goal_achievement: Target,
  default: Info,
};

const priorityColors = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: [`/api/notifications`, user?.id],
    enabled: !!user?.id && isOpen,
    refetchInterval: 30000, // Refresh every 30 seconds when open
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications`, user?.id] });
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}/count`] });
    },
  });



  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications`, user?.id] });
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}/count`] });
    },
  });

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsReadMutation.mutateAsync(notification.id);
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Hace menos de 1 hora';
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    }
  };

  const getNotificationIcon = (type: string) => {
    const IconComponent = notificationIcons[type as keyof typeof notificationIcons] || notificationIcons.default;
    return IconComponent;
  };

  const getPriorityColor = (priority: string) => {
    return priorityColors[priority as keyof typeof priorityColors] || priorityColors.medium;
  };

  if (!isOpen) return null;

  const unreadCount = (notifications as Notification[]).filter((n: Notification) => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div
        className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-xl border-l border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="h-full rounded-none border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-gray-800">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="h-[calc(100vh-80px)] overflow-y-auto">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (notifications as Notification[]).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mb-4 opacity-50" />
                  <h3 className="font-medium mb-1">No tienes notificaciones</h3>
                  <p className="text-sm">Cuando tengas alertas o consejos aparecerán aquí</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {(notifications as Notification[]).map((notification: Notification) => {
                    const IconComponent = getNotificationIcon(notification.type);
                    const priorityColor = getPriorityColor(notification.priority);

                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer relative",
                          !notification.isRead && "bg-blue-50/50 dark:bg-blue-950/20"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {/* Priority indicator */}
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1", priorityColor)} />

                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              !notification.isRead ? "bg-primary text-primary-foreground" : "bg-gray-100 dark:bg-gray-800 text-muted-foreground"
                            )}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4 className={cn(
                                "text-sm font-medium",
                                !notification.isRead ? "text-foreground" : "text-muted-foreground"
                              )}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center gap-1 ml-2">
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-primary rounded-full" />
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:bg-red-100 dark:hover:bg-red-900/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotificationMutation.mutate(notification.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            </div>

                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>

                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatDate(notification.createdAt)}
                              </span>

                              {notification.actionText && (
                                <Badge variant="outline" className="text-xs">
                                  {notification.actionText}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
