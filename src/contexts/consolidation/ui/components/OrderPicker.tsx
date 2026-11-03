import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Badge, Button, Checkbox, Input } from "@contexts/shared/shadcn";
import { Package, Search, Trash2 } from "lucide-react";
import { orderRepository } from "@contexts/sales/infrastructure/services/orders/orderRepository";
import { formatCustomerNumber } from "@contexts/shared/domain/formatCustomerNumber";
import { TruckVisual } from "@contexts/consolidation/ui/components/TruckVisual";

// ease-out fuerte, mismo valor que usa TruckVisual — entra rápido, sale aún más rápido
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export interface SelectedOrder {
  orderId: string;
  linearFeet: number;
  section: string;
}

interface Props {
  selected: SelectedOrder[];
  onChange: (selected: SelectedOrder[]) => void;
  capacityLinearFeet: number;
  /** Pies lineales ya confirmados en el consolidado (0 en el wizard de
   * creación, donde todavía no hay nada guardado). */
  usedLinearFeet?: number;
}

/**
 * Elegir qué órdenes de venta reales suben al tráiler y capturar, para cada
 * una, los pies lineales que ocupa. Antes esto elegía paquetes de bodega
 * (`warehouse.Package`) — se cambió a `sales.Order` porque un paquete de
 * bodega no tiene ningún vínculo con una orden ni con su
 * `references.orderNumber`.
 *
 * Sólo se ofrecen órdenes sin consolidado asignado y que no estén
 * canceladas. Se identifican por su número de orden/socio (mismo badge doble
 * que usa la tabla de órdenes), no por el id interno.
 */
export const OrderPicker = ({
  selected,
  onChange,
  capacityLinearFeet,
  usedLinearFeet = 0,
}: Props) => {
  const [search, setSearch] = useState("");
  const reduceMotion = useReducedMotion();

  const { data, isLoading } = useQuery({
    queryKey: ["consolidation", "available-orders"],
    queryFn: () =>
      orderRepository.find({
        filters: [
          { field: "consolidationId", filterOperator: "IS_NULL", value: null },
          { field: "status", filterOperator: "!=", value: "CANCELLED" },
        ],
        limit: 200,
        offset: 0,
      }),
  });

  const available = useMemo(
    () => (data?.data ?? []).filter((o) => !o.consolidationId),
    [data],
  );

  const ordersById = useMemo(
    () => new Map(available.map((o) => [o.id, o])),
    [available],
  );

  const filtered = search.trim()
    ? available.filter((o) => {
        const q = search.toLowerCase();
        return (
          o.destination.name.toLowerCase().includes(q) ||
          o.destination.company.toLowerCase().includes(q) ||
          o.destination.address.city?.toLowerCase().includes(q) ||
          o.store.name.toLowerCase().includes(q) ||
          o.references.orderNumber?.toLowerCase().includes(q) ||
          o.references.partnerOrderNumber?.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
        );
      })
    : available;

  const selectedIds = selected.map((s) => s.orderId);

  const toggle = (orderId: string) => {
    if (selectedIds.includes(orderId)) {
      onChange(selected.filter((s) => s.orderId !== orderId));
      return;
    }
    onChange([...selected, { orderId, linearFeet: 0, section: "" }]);
  };

  const updateSelected = (orderId: string, patch: Partial<SelectedOrder>) => {
    onChange(selected.map((s) => (s.orderId === orderId ? { ...s, ...patch } : s)));
  };

  const labelFor = (orderId: string) => {
    const order = ordersById.get(orderId);
    if (!order) return orderId.slice(0, 8).toUpperCase();
    return order.references.orderNumber ?? order.references.partnerOrderNumber ?? orderId.slice(0, 8).toUpperCase();
  };

  const pendingLinearFeet = selected.reduce((sum, s) => sum + (s.linearFeet || 0), 0);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <TruckVisual
        usedLinearFeet={usedLinearFeet}
        pendingLinearFeet={pendingLinearFeet}
        capacityLinearFeet={capacityLinearFeet}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por cliente, origen, destino o referencia…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-10 text-sm text-muted-foreground">
            Cargando órdenes disponibles…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
            <Package className="size-8 opacity-30" />
            <p className="text-sm">
              {available.length === 0
                ? "No hay órdenes disponibles para consolidar"
                : "Sin resultados para esa búsqueda"}
            </p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 divide-y overflow-y-auto rounded-md border">
            {filtered.map((o) => {
              const isSelected = selectedIds.includes(o.id);
              return (
                <div
                  key={o.id}
                  onClick={() => toggle(o.id)}
                  className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors select-none hover:bg-muted/50 ${
                    isSelected ? "bg-primary/5" : ""
                  }`}
                >
                  <Checkbox checked={isSelected} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{o.destination.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {o.destination.customerNumber != null
                        ? `#${formatCustomerNumber(o.destination.customerNumber)} · `
                        : ""}
                      {o.destination.address.city || "Sin ciudad"} · {o.store.name}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">JBG</span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {o.references.orderNumber ?? "—"}
                      </Badge>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">Agente</span>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {o.references.partnerOrderNumber ?? "—"}
                      </Badge>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex min-h-0 w-full flex-col gap-2 lg:w-[22rem] lg:shrink-0">
        <p className="text-xs font-medium text-muted-foreground">
          {selected.length === 0
            ? "Ninguna orden seleccionada"
            : `${selected.length} orden${selected.length !== 1 ? "es" : ""} seleccionada${selected.length !== 1 ? "s" : ""}`}
        </p>
        {selected.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
            Marca órdenes de la lista para agregarlas aquí y capturar sus pies
            lineales.
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            <AnimatePresence initial={false}>
              {selected.map((s) => {
                const invalid = !s.linearFeet || s.linearFeet <= 0;
                return (
                  <motion.div
                    key={s.orderId}
                    layout
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={
                      reduceMotion
                        ? { opacity: 0, transition: { duration: 0.12 } }
                        : { opacity: 0, scale: 0.95, transition: { duration: 0.12, ease: EASE_OUT } }
                    }
                    transition={{ duration: 0.18, ease: EASE_OUT }}
                    className="rounded-md border p-2.5"
                  >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-xs font-medium">
                      {labelFor(s.orderId)}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-6 shrink-0 text-destructive hover:bg-destructive/10"
                      onClick={() => toggle(s.orderId)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">
                        Pies lineales
                      </label>
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        aria-invalid={invalid}
                        className="h-8"
                        value={s.linearFeet || ""}
                        onChange={(e) =>
                          updateSelected(s.orderId, {
                            linearFeet: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">
                        Sección
                      </label>
                      <Input
                        placeholder="Ej. A1"
                        className="h-8"
                        value={s.section}
                        onChange={(e) =>
                          updateSelected(s.orderId, { section: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  {invalid && (
                    <p className="mt-1 text-[11px] text-destructive">
                      Captura cuántos pies lineales ocupa.
                    </p>
                  )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
