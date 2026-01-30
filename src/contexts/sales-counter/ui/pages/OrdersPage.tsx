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
import type { ShipmentOrder, ShipmentOrderStatus } from "../../domain/entities/ShipmentOrder";
import { OrderDetailDialog } from "../components/OrderDetailDialog";

const STATUS_LABELS: Record<ShipmentOrderStatus, string> = {
  DRAFT: "Borrador",
  PENDING_HQ_PROCESS: "Pendiente",
  COMPLETED: "Completada",
};

const STATUS_VARIANT: Record<ShipmentOrderStatus, "secondary" | "default" | "outline"> = {
  DRAFT: "secondary",
  PENDING_HQ_PROCESS: "outline",
  COMPLETED: "default",
};

const MOCK_ORDERS: ShipmentOrder[] = [
  {
    id: "ord-001",
    origin: "sucursal-centro",
    customer: { name: "Carlos Mendoza", phone: "5512345678", email: "carlos@email.com" },
    destination: { street: "Av. Reforma 123", colony: "Juárez", city: "CDMX", state: "CDMX", zipCode: "06600", country: "México" },
    financials: { id: crypto.randomUUID(), totalPrice: { amount: 350, currency: "MXN" }, isPaid: true, paidAt: new Date("2025-01-15") },
    references: { partnerInvoiceNumber: "INV-2025-001", officialInvoiceNumber: null },
    status: "COMPLETED",
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-01-15"),
  },
  {
    id: "ord-002",
    origin: "sucursal-norte",
    customer: { name: "María López", phone: "5587654321" },
    destination: { street: "Calle Hidalgo 456", colony: "Centro", city: "Monterrey", state: "Nuevo León", zipCode: "64000", country: "México" },
    financials: { id: crypto.randomUUID(), totalPrice: { amount: 520, currency: "MXN" }, isPaid: false },
    references: { partnerInvoiceNumber: "INV-2025-002", officialInvoiceNumber: null },
    status: "PENDING_HQ_PROCESS",
    createdAt: new Date("2025-01-18"),
    updatedAt: new Date("2025-01-18"),
  },
  {
    id: "ord-003",
    origin: "sucursal-centro",
    customer: { name: "Juan Pérez", phone: "5598765432", email: "juan@email.com" },
    destination: { street: "Blvd. García 789", colony: "Polanco", city: "Guadalajara", state: "Jalisco", zipCode: "44100", country: "México" },
    financials: { id: crypto.randomUUID(), totalPrice: { amount: 280, currency: "MXN" }, isPaid: false },
    references: { partnerInvoiceNumber: null, officialInvoiceNumber: null },
    status: "DRAFT",
    createdAt: new Date("2025-01-20"),
    updatedAt: new Date("2025-01-20"),
  },
  {
    id: "ord-004",
    origin: "sucursal-sur",
    customer: { name: "Ana García", phone: "5576543210" },
    destination: { street: "Av. Universidad 321", colony: "Del Valle", city: "CDMX", state: "CDMX", zipCode: "03100", country: "México" },
    financials: { id: crypto.randomUUID(), totalPrice: { amount: 410, currency: "MXN" }, isPaid: true, paidAt: new Date("2025-01-22") },
    references: { partnerInvoiceNumber: "INV-2025-004", officialInvoiceNumber: "OF-001" },
    status: "COMPLETED",
    createdAt: new Date("2025-01-22"),
    updatedAt: new Date("2025-01-22"),
  },
  {
    id: "ord-005",
    origin: "sucursal-norte",
    customer: { name: "Roberto Sánchez", phone: "5565432109", email: "roberto@email.com" },
    destination: { street: "Calle Madero 654", colony: "Obrera", city: "Puebla", state: "Puebla", zipCode: "72000", country: "México" },
    financials: { id: crypto.randomUUID(), totalPrice: { amount: 600, currency: "MXN" }, isPaid: false },
    references: { partnerInvoiceNumber: "INV-2025-005", officialInvoiceNumber: null },
    status: "PENDING_HQ_PROCESS",
    createdAt: new Date("2025-01-25"),
    updatedAt: new Date("2025-01-25"),
  },
];

export const OrdersPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<ShipmentOrder | null>(null);

  const filteredOrders = MOCK_ORDERS.filter((order) => {
    const matchesSearch =
      searchQuery === "" ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.references.partnerInvoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

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
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Destino</TableHead>
              <TableHead className="hidden sm:table-cell">Factura</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="hidden lg:table-cell">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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
                  <TableCell className="font-mono text-xs">{order.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customer.name}</div>
                      <div className="text-xs text-muted-foreground">{order.customer.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-sm">
                      {order.destination.city}, {order.destination.state}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs">
                    {order.references.partnerInvoiceNumber ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[order.status]}>
                      {STATUS_LABELS[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${order.financials.totalPrice.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {order.createdAt.toLocaleDateString("es-MX")}
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
