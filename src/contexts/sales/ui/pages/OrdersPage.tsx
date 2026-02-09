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
import type { ShipmentOrderPrimitives, ShipmentOrderStatus } from "../../domain";
import { OrderDetailDialog } from "../components/order/OrderDetailDialog";

const STATUS_LABELS: Record<ShipmentOrderStatus, string> = {
  DRAFT: "Borrador",
  PENDING_HQ_PROCESS: "Pendiente",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const STATUS_VARIANT: Record<ShipmentOrderStatus, "secondary" | "default" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  PENDING_HQ_PROCESS: "outline",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

const now = new Date().toISOString();

const MOCK_ORDERS: ShipmentOrderPrimitives[] = [
  {
    id: "ORD-001",
    storeId: "store-001",
    origin: {
      name: "JBG Logística - Centro",
      company: "JBG Logística",
      email: "centro@jbg.com",
      phone: "5512340000",
      address: { address1: "Av. Central 100", address2: "", city: "CDMX", province: "CDMX", zip: "06000", country: "México", reference: "", geolocation: { latitude: 0, longitude: 0 } },
    },
    destination: {
      name: "Carlos Mendoza",
      company: "",
      phone: "5512345678",
      email: "carlos@email.com",
      address: { address1: "Av. Reforma 123", address2: "Piso 4", city: "CDMX", province: "CDMX", zip: "06600", country: "México", reference: "", geolocation: { latitude: 0, longitude: 0 } },
    },
    financials: { totalPrice: { amount: 350, currency: "MXN" }, isPaid: true },
    references: { partnerInvoice: "INV-2025-001", officialInvoice: null, partnerInvoiceUrl: null, officialInvoiceUrl: null },
    status: "COMPLETED",
    package: { boxId: null, boxName: "Caja Mediana", dimensions: { length: 40, width: 30, height: 20, unit: "cm" }, ownership: "OWN", goodsWeight: 5, weightUnit: "kg" },
    shippingDetails: { provider: null, labelUrl: null, trackingUrl: null, trackingNumber: null },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ORD-002",
    storeId: "store-002",
    origin: {
      name: "JBG Logística - Norte",
      company: "JBG Logística",
      email: "norte@jbg.com",
      phone: "5512340001",
      address: { address1: "Blvd. Industrial 200", address2: "A", city: "Monterrey", province: "Nuevo León", zip: "64000", country: "México", reference: "", geolocation: { latitude: 0, longitude: 0 } },
    },
    destination: {
      name: "María López",
      company: "",
      phone: "5587654321",
      email: "maria@email.com",
      address: { address1: "Calle Hidalgo 456", address2: "", city: "Monterrey", province: "Nuevo León", zip: "64000", country: "México", reference: "", geolocation: { latitude: 0, longitude: 0 } },
    },
    financials: { totalPrice: { amount: 520, currency: "MXN" }, isPaid: false },
    references: { partnerInvoice: "INV-2025-002", officialInvoice: null, partnerInvoiceUrl: null, officialInvoiceUrl: null },
    status: "PENDING_HQ_PROCESS",
    package: { boxId: null, boxName: "Caja Grande", dimensions: { length: 60, width: 40, height: 30, unit: "cm" }, ownership: "STORE", goodsWeight: 12, weightUnit: "kg" },
    shippingDetails: { provider: null, labelUrl: null, trackingUrl: null, trackingNumber: null },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ORD-003",
    storeId: "store-001",
    origin: {
      name: "JBG Logística - Centro",
      company: "JBG Logística",
      email: "centro@jbg.com",
      phone: "5512340000",
      address: { address1: "Av. Central 100", address2: "", city: "CDMX", province: "CDMX", zip: "06000", country: "México", reference: "", geolocation: { latitude: 0, longitude: 0 } },
    },
    destination: {
      name: "Juan Pérez",
      company: "",
      phone: "5598765432",
      email: "juan@email.com",
      address: { address1: "Blvd. García 789", address2: "", city: "Guadalajara", province: "Jalisco", zip: "44100", country: "México", reference: "", geolocation: { latitude: 0, longitude: 0 } },
    },
    financials: { totalPrice: { amount: 280, currency: "MXN" }, isPaid: false },
    references: { partnerInvoice: null, officialInvoice: null, partnerInvoiceUrl: null, officialInvoiceUrl: null },
    status: "DRAFT",
    package: { boxId: null, boxName: "Caja Chica", dimensions: { length: 25, width: 20, height: 15, unit: "cm" }, ownership: "OWN", goodsWeight: 2, weightUnit: "kg" },
    shippingDetails: { provider: null, labelUrl: null, trackingUrl: null, trackingNumber: null },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ORD-004",
    storeId: "store-003",
    origin: {
      name: "JBG Logística - Sur",
      company: "JBG Logística",
      email: "sur@jbg.com",
      phone: "5512340002",
      address: { address1: "Av. Insurgentes Sur 500", address2: "", city: "CDMX", province: "CDMX", zip: "03100", country: "México", reference: "", geolocation: { latitude: 0, longitude: 0 } },
    },
    destination: {
      name: "Ana García",
      company: "",
      phone: "5576543210",
      email: "",
      address: { address1: "Av. Universidad 321", address2: "", city: "CDMX", province: "CDMX", zip: "03100", country: "México", reference: "Edificio rojo", geolocation: { latitude: 0, longitude: 0 } },
    },
    financials: { totalPrice: { amount: 410, currency: "MXN" }, isPaid: true },
    references: { partnerInvoice: "INV-2025-004", officialInvoice: "OF-001", partnerInvoiceUrl: null, officialInvoiceUrl: null },
    status: "COMPLETED",
    package: { boxId: null, boxName: "Caja Mediana", dimensions: { length: 40, width: 30, height: 20, unit: "cm" }, ownership: "STORE", goodsWeight: 8, weightUnit: "kg" },
    shippingDetails: { provider: null, labelUrl: null, trackingUrl: null, trackingNumber: null },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ORD-005",
    storeId: "store-002",
    origin: {
      name: "JBG Logística - Norte",
      company: "JBG Logística",
      email: "norte@jbg.com",
      phone: "5512340001",
      address: { address1: "Blvd. Industrial 200", address2: "A", city: "Monterrey", province: "Nuevo León", zip: "64000", country: "México", reference: "", geolocation: { latitude: 0, longitude: 0 } },
    },
    destination: {
      name: "Roberto Sánchez",
      company: "",
      phone: "5565432109",
      email: "roberto@email.com",
      address: { address1: "Calle Madero 654", address2: "", city: "Puebla", province: "Puebla", zip: "72000", country: "México", reference: "", geolocation: { latitude: 0, longitude: 0 } },
    },
    financials: { totalPrice: { amount: 600, currency: "MXN" }, isPaid: false },
    references: { partnerInvoice: "INV-2025-005", officialInvoice: null, partnerInvoiceUrl: null, officialInvoiceUrl: null },
    status: "PENDING_HQ_PROCESS",
    package: { boxId: null, boxName: "Caja Extra Grande", dimensions: { length: 80, width: 50, height: 40, unit: "cm" }, ownership: "OWN", goodsWeight: 20, weightUnit: "kg" },
    shippingDetails: { provider: null, labelUrl: null, trackingUrl: null, trackingNumber: null },
    createdAt: now,
    updatedAt: now,
  },
];

export const OrdersPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<ShipmentOrderPrimitives | null>(null);

  const filteredOrders = MOCK_ORDERS.filter((order) => {
    const matchesSearch =
      searchQuery === "" ||
      order.destination.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.references.partnerInvoice?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

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
                    {order.references.partnerInvoice ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[order.status]}>
                      {STATUS_LABELS[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${order.financials.totalPrice.amount.toFixed(2)}
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
