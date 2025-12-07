import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  Heart,
  MessageCircle,
  Gift,
  Crown,
  ShoppingCart,
  UserPlus,
  FileText,
  AlertCircle,
  Check,
  Trash2,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";

const TYPE_CONFIG = {
  follow: { icon: UserPlus, color: "text-blue-500" },
  like: { icon: Heart, color: "text-pink-500" },
  comment: { icon: MessageCircle, color: "text-green-500" },
  tip: { icon: Gift, color: "text-primary" },
  subscription: { icon: Crown, color: "text-purple-500" },
  purchase: { icon: ShoppingCart, color: "text-blue-600" },
  new_post: { icon: FileText, color: "text-orange-500" },
  system: { icon: AlertCircle, color: "text-gray-500" },
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: unreadCount } = trpc.notification.getUnreadCount.useQuery();
  const { data: notifications, isLoading } = trpc.notification.getNotifications.useQuery(
    { limit: 20 },
    { enabled: isOpen }
  );

  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getUnreadCount.invalidate();
      utils.notification.getNotifications.invalidate();
    },
  });

  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getUnreadCount.invalidate();
      utils.notification.getNotifications.invalidate();
    },
  });

  const deleteNotificationMutation = trpc.notification.deleteNotification.useMutation({
    onSuccess: () => {
      utils.notification.getUnreadCount.invalidate();
      utils.notification.getNotifications.invalidate();
    },
  });

  const handleNotificationClick = (id: number, isRead: number, link?: string | null) => {
    if (isRead === 0) {
      markAsReadMutation.mutate({ ids: [id] });
    }
    if (link) {
      setIsOpen(false);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "たった今";
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return new Date(date).toLocaleDateString("ja-JP");
  };

  const count = unreadCount?.count || 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">通知</h3>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  すべて既読
                </>
              )}
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => {
                const config = TYPE_CONFIG[notification.type];
                const Icon = config.icon;
                return (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-muted/50 transition-colors ${
                      notification.isRead === 0 ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${config.color} bg-current/10`}
                      >
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {notification.link ? (
                          <Link
                            href={notification.link}
                            onClick={() =>
                              handleNotificationClick(
                                notification.id,
                                notification.isRead,
                                notification.link
                              )
                            }
                          >
                            <p className="text-sm font-medium leading-tight hover:underline">
                              {notification.title}
                            </p>
                          </Link>
                        ) : (
                          <p
                            className="text-sm font-medium leading-tight cursor-pointer"
                            onClick={() =>
                              handleNotificationClick(
                                notification.id,
                                notification.isRead,
                                notification.link
                              )
                            }
                          >
                            {notification.title}
                          </p>
                        )}
                        {notification.message && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          deleteNotificationMutation.mutate({ id: notification.id })
                        }
                        disabled={deleteNotificationMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">通知はありません</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
