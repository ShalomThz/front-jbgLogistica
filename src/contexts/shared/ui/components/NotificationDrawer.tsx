import { Bell, Check, Package, AlertTriangle, Truck, Warehouse } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    Button,
    Badge,
} from "@contexts/shared/shadcn/components";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { useNotifications } from "@contexts/notifications/infrastructure/hooks/useNotifications";
import type { Notification } from "@contexts/notifications/domain/schemas/Notification";
import type { NotificationEntityType } from "@contexts/notifications/domain/schemas/Notification";

const ENTITY_ICON: Record<NotificationEntityType, typeof Package> = {
    order: Package,
    shipment: Truck,
    route: Truck,
    inventory: Package,
    warehouse: Warehouse,
};

const ENTITY_COLOR: Record<NotificationEntityType, string> = {
    order: "text-blue-500",
    shipment: "text-green-500",
    route: "text-teal-600",
    inventory: "text-amber-500",
    warehouse: "text-purple-500",
};

export function NotificationDrawer() {
    const { user } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    const getIcon = (notification: Notification) => {
        if (notification.severity === "warning") {
            return <AlertTriangle className="h-4 w-4 text-amber-500" />;
        }

        const Icon = ENTITY_ICON[notification.entityType];
        return <Icon className={cn("h-4 w-4", ENTITY_COLOR[notification.entityType])} />;
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group p-2 hover:bg-primary-foreground/15 hover:text-primary-foreground text-primary-foreground">
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white border-2 border-primary"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col">
                <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b gap-4">
                    <div className="flex flex-col gap-1">
                        <SheetTitle>Notificaciones</SheetTitle>
                        <SheetDescription>
                            Tienes {unreadCount} notificaciones sin leer.
                        </SheetDescription>
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs flex gap-1">
                            <Check className="h-3 w-3" />
                            Marcar todas como leídas
                        </Button>
                    )}
                </SheetHeader>

                <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4">
                    <div className="flex flex-col space-y-4">
                        {notifications.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No tienes notificaciones.
                            </p>
                        )}
                        {notifications.map((notification) => {
                            const isRead = Boolean(user && notification.readBy.includes(user.id));

                            return (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 rounded-lg border flex gap-4 transition-colors cursor-pointer hover:bg-muted/50",
                                        !isRead ? "bg-muted/30 border-primary/20" : "bg-transparent border-border"
                                    )}
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    <div className="mt-1 bg-background p-2 rounded-full border shadow-sm h-fit">
                                        {getIcon(notification)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-start justify-between">
                                            <p className={cn("text-sm font-medium leading-none", !isRead && "font-semibold")}>
                                                {notification.title}
                                            </p>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                {formatDistanceToNow(new Date(notification.occurredOn), {
                                                    addSuffix: true,
                                                    locale: es,
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {notification.body}
                                        </p>
                                    </div>
                                    {!isRead && (
                                        <div className="flex items-center justify-center">
                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
