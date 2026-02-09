import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import {
  Button,
  Input,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/shadcn";
import type { OrderPrimitives, OrderStatus } from "../../domain";
import { OrderDetailDialog } from "../components/order/OrderDetailDialog";

const STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: "Borrador",
  PENDING_HQ_PROCESS: "Pendiente",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const STATUS_VARIANT: Record<OrderStatus, "secondary" | "default" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  PENDING_HQ_PROCESS: "outline",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

const now = new Date().toISOString();

const MOCK_ORDERS: OrderPrimitives[] = [
  {
    id: "ORD-001",
    storeId: "store-001",
    origin: {
      id: null,
      name: "JBG Logística - Centro",
      company: "JBG Logística",
      email: "centro@jbg.com",
      phone: "5512340000",
      address: { address1: "Av. Central 100", address2: "", city: "CDMX", province: "CDMX", zip: "06000", country: "México", reference: "", geolocation: { latitude: 0, longitude: 0, placeId: null } },
    },
    destination: {
      id: null,
      name: "Carlos Mendoza",
      company: "",
      phone: "5512345678",
      email: "carlos@email.com",
      address: { address1: "Av. Reforma 123", address2: "Piso 4", city: "CDMX", province: "CDMX", zip: "06600", country: "México", reference: "", geolocation: { latitude: 0, longitude: 0, placeId: null } },
    },
    financials: {
      totalPrice: { amount: 350, currency: "MXN" }, isPaid: true, costBreakdown: {
        insurance: null,
        tools: null,
        additionalCost: null,
        wrap: null,
        tape: null,
      }
    },
    references: {
      orderNumber: "JBG-0001",
      partnerOrderNumber: null,
    },
    status: "COMPLETED",
    package: {
      boxId: "box-001",
      dimensions: { length: 40, width: 30, height: 20, unit: "cm" },
      ownership: "STORE",
      weight: {
        value: 5, unit: "kg"
      }
    },
    type: "HQ",
    createdAt: now,
    updatedAt: now,
  },
];

export const OrdersPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderPrimitives | null>(null);

  const filteredOrders = MOCK_ORDERS.filter((order) => {
    const matchesSearch =
      searchQuery === "" ||
      order.destination.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.references.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (order.references.partnerOrderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Órdenes</h1>
        <Button onClick={() => navigate("/orders/new")}>
          <Plus className="size-4" />
          Crear Orden
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, ID o factura..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="DRAFT">Borrador</SelectItem>
            <SelectItem value="PENDING_HQ_PROCESS">Pendiente</SelectItem>
            <SelectItem value="COMPLETED">Completada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Destinatario</TableHead>
              <TableHead className="hidden md:table-cell">Destino</TableHead>
              <TableHead className="hidden sm:table-cell">Factura</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No se encontraron órdenes.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.destination.name}</div>
                      <div className="text-xs text-muted-foreground">{order.destination.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-sm">
                      {order.destination.address.city}, {order.destination.address.province}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs">
                    {order.references.orderNumber ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[order.status]}>
                      {STATUS_LABELS[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${order.financials.totalPrice?.amount.toFixed(2) ?? "0.00"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <OrderDetailDialog
        order={selectedOrder}
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
};
