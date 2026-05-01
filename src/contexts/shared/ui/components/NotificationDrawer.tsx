import { useState } from "react";
import { Bell, Check, Package, AlertTriangle, Truck, Warehouse } from "lucide-react";
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

// Mock Data
type NotificationType = "order" | "alert" | "shipping" | "warehouse";

interface Notification {
    id: string;
    title: string;
    description: string;
    date: string;
    read: boolean;
    type: NotificationType;
}

const initialNotifications: Notification[] = [
    {
        id: "1",
        title: "Nueva venta creada",
        description: "Orden con factura #1204 ha sido creada por Shalom.",
        date: "Hace 10 minutos",
        read: false,
        type: "order",
    },
    {
        id: "2",
        title: "Alerta de inventario",
        description: "El stock para el artículo '16x16x16' está agotándose.",
        date: "Hace 1 hora",
        read: false,
        type: "alert",
    },
    {
        id: "3",
        title: "Entrega realizada",
        description: "El envío con referencia #TRK-8822 ha sido entregado al cliente.",
        date: "Hace 2 horas",
        read: true,
        type: "shipping",
    },
    {
        id: "4",
        title: "Solicitud de envío en bodega",
        description: "El cliente 'Shalom' ha solicitado un envío de 3 paquetes de la bodega.",
        date: "Hace 1 día",
        read: true,
        type: "warehouse",
    },
];

export function NotificationDrawer() {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAllAsRead = () => {
        setNotifications(
            notifications.map((n) => ({ ...n, read: true }))
        );
    };

    const markAsRead = (id: string) => {
        setNotifications(
            notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case "order":
                return <Package className="h-4 w-4 text-blue-500" />;
            case "alert":
                return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case "shipping":
                return <Truck className="h-4 w-4 text-green-500" />;
            case "warehouse":
                return <Warehouse className="h-4 w-4 text-purple-500" />;
        }
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
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    "p-4 rounded-lg border flex gap-4 transition-colors cursor-pointer hover:bg-muted/50",
                                    !notification.read ? "bg-muted/30 border-primary/20" : "bg-transparent border-border"
                                )}
                                onClick={() => markAsRead(notification.id)}
                            >
                                <div className="mt-1 bg-background p-2 rounded-full border shadow-sm h-fit">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-start justify-between">
                                        <p className={cn("text-sm font-medium leading-none", !notification.read && "font-semibold")}>
                                            {notification.title}
                                        </p>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                            {notification.date}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {notification.description}
                                    </p>
                                </div>
                                {!notification.read && (
                                    <div className="flex items-center justify-center">
                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
