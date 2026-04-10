import { useMemo, useState } from "react";
import { CalendarDays, DollarSign, Download, FileText, TrendingUp } from "lucide-react";
import { exportOrderReport } from "./exportOrderReport";
import {
  Button,
  Calendar,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@contexts/shared/shadcn";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VARIANT } from "@contexts/sales/domain/schemas/order/OrderStatusConfig";
import type { OrderStatus } from "@contexts/sales/domain/schemas/order/Order";
import { orderStatuses } from "@contexts/sales/domain/schemas/order/OrderStatuses";

type DatePreset = "all" | "today" | "week" | "month" | "3months" | "custom";

const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  all: "Todo",
  today: "Hoy",
  week: "Ultima semana",
  month: "Ultimo mes",
  "3months": "Ultimos 3 meses",
  custom: "Rango personalizado",
};

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDate(value: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value + "T00:00:00");
  return isNaN(d.getTime()) ? undefined : d;
}

function DatePickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const selected = parseDate(value);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[180px] justify-start text-left font-normal"
          >
            <CalendarDays className="mr-2 size-4 text-muted-foreground" />
            {selected ? (
              selected.toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            ) : (
              <span className="text-muted-foreground">Seleccionar fecha</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => onChange(date ? formatDate(date) : "")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface Props {
  orders: OrderListView[];
}

export const OrderReport = ({ orders }: Props) => {
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">("all");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      const now = new Date();

      let matchesDate = true;
      if (datePreset === "today") {
        matchesDate = orderDate.toDateString() === now.toDateString();
      } else if (datePreset === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesDate = orderDate >= weekAgo;
      } else if (datePreset === "month") {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchesDate = orderDate >= monthAgo;
      } else if (datePreset === "3months") {
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        matchesDate = orderDate >= threeMonthsAgo;
      } else if (datePreset === "custom") {
        if (dateFrom && orderDate < new Date(dateFrom + "T00:00:00")) matchesDate = false;
        if (dateTo && orderDate > new Date(dateTo + "T23:59:59")) matchesDate = false;
      }

      const matchesPayment =
        paymentFilter === "all" ||
        (paymentFilter === "paid" && order.financials.isPaid) ||
        (paymentFilter === "unpaid" && !order.financials.isPaid);

      return matchesDate && matchesPayment;
    });
  }, [orders, datePreset, dateFrom, dateTo, paymentFilter]);

  const stats = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const paid = filteredOrders.filter((o) => o.financials.isPaid);
    const unpaid = filteredOrders.filter((o) => !o.financials.isPaid);

    const totalRevenue = filteredOrders.reduce(
      (sum, o) => sum + (o.financials.totalPrice?.amount ?? 0),
      0,
    );
    const paidRevenue = paid.reduce(
      (sum, o) => sum + (o.financials.totalPrice?.amount ?? 0),
      0,
    );
    const unpaidRevenue = unpaid.reduce(
      (sum, o) => sum + (o.financials.totalPrice?.amount ?? 0),
      0,
    );

    const byStatus = orderStatuses.reduce(
      (acc, status) => {
        const matching = filteredOrders.filter((o) => o.status === status);
        acc[status] = {
          count: matching.length,
          total: matching.reduce((s, o) => s + (o.financials.totalPrice?.amount ?? 0), 0),
        };
        return acc;
      },
      {} as Record<string, { count: number; total: number }>,
    );

    const byStore = new Map<string, { name: string; count: number; total: number; paid: number; unpaid: number }>();
    for (const order of filteredOrders) {
      const existing = byStore.get(order.store.id) ?? {
        name: order.store.name,
        count: 0,
        total: 0,
        paid: 0,
        unpaid: 0,
      };
      existing.count++;
      existing.total += order.financials.totalPrice?.amount ?? 0;
      if (order.financials.isPaid) {
        existing.paid += order.financials.totalPrice?.amount ?? 0;
      } else {
        existing.unpaid += order.financials.totalPrice?.amount ?? 0;
      }
      byStore.set(order.store.id, existing);
    }

    return {
      totalOrders,
      totalRevenue,
      paidCount: paid.length,
      paidRevenue,
      unpaidCount: unpaid.length,
      unpaidRevenue,
      byStatus,
      byStore: Array.from(byStore.values()).sort((a, b) => b.total - a.total),
    };
  }, [filteredOrders]);

  const fmt = (amount: number) =>
    `$${amount.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            Periodo
          </Label>
          <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DATE_PRESET_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {datePreset === "custom" && (
          <>
            <DatePickerField label="Desde" value={dateFrom} onChange={setDateFrom} />
            <DatePickerField label="Hasta" value={dateTo} onChange={setDateTo} />
          </>
        )}

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <DollarSign className="size-3.5" />
            Pago
          </Label>
          <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as "all" | "paid" | "unpaid")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="paid">Pagados</SelectItem>
              <SelectItem value="unpaid">No pagados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          className="self-end"
          disabled={filteredOrders.length === 0}
          onClick={() => exportOrderReport(filteredOrders, stats)}
        >
          <Download className="mr-1.5 size-4" />
          Exportar XLSX
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Ordenes</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">{fmt(stats.totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pagadas</CardTitle>
            <DollarSign className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paidCount}</div>
            <p className="text-xs text-muted-foreground">{fmt(stats.paidRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">No Pagadas</CardTitle>
            <DollarSign className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.unpaidCount}</div>
            <p className="text-xs text-muted-foreground">{fmt(stats.unpaidRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Cobro</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalOrders > 0
                ? `${Math.round((stats.paidCount / stats.totalOrders) * 100)}%`
                : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.paidCount} de {stats.totalOrders} ordenes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* By status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Por Estatus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {orderStatuses.map((status) => {
              const data = stats.byStatus[status];
              return (
                <div key={status} className="space-y-1">
                  <Badge variant={ORDER_STATUS_VARIANT[status as OrderStatus]}>
                    {ORDER_STATUS_LABELS[status as OrderStatus]}
                  </Badge>
                  <p className="text-lg font-semibold">{data.count}</p>
                  <p className="text-xs text-muted-foreground font-mono">{fmt(data.total)}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* By store */}
      {stats.byStore.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por Tienda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tienda</TableHead>
                    <TableHead className="text-center">Ordenes</TableHead>
                    <TableHead className="text-right">Pagado</TableHead>
                    <TableHead className="text-right">Pendiente</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.byStore.map((store) => (
                    <TableRow key={store.name}>
                      <TableCell className="font-medium">{store.name}</TableCell>
                      <TableCell className="text-center">{store.count}</TableCell>
                      <TableCell className="text-right font-mono text-green-600">{fmt(store.paid)}</TableCell>
                      <TableCell className="text-right font-mono text-red-600">{fmt(store.unpaid)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">{fmt(store.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
