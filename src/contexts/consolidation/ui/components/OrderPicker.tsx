import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Badge, Button, Checkbox, Input } from "@contexts/shared/shadcn";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { Eraser, Package, Search, Trash2 } from "lucide-react";
import { orderRepository } from "@contexts/sales/infrastructure/services/orders/orderRepository";
import { useDebouncedValue } from "@contexts/shared/infrastructure/hooks/useDebouncedValue";
import { formatCustomerNumber } from "@contexts/shared/domain/formatCustomerNumber";
import { TruckVisual } from "@contexts/consolidation/ui/components/TruckVisual";
import { consolidationKeys } from "@contexts/consolidation/infrastructure/hooks/consolidationKeys";
import {
  calculateLinearFeet,
  DEFAULT_LINEAR_FEET_DIVISOR,
} from "@contexts/consolidation/domain/calculateLinearFeet";

// ease-out fuerte, mismo valor que usa TruckVisual — entra rápido, sale aún más rápido
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export interface SelectedOrder {
  orderId: string;
  linearFeet: number;
  section: string;
  displayLabel?: string;
}

interface Props {
  selected: SelectedOrder[];
  onChange: (selected: SelectedOrder[]) => void;
  capacityLinearFeet: number;
  /** Pies lineales ya confirmados en el consolidado (0 en el wizard de
   * creación, donde todavía no hay nada guardado). */
  usedLinearFeet?: number;
  /** Divisor elegido al crear el consolidado para sugerir pies lineales
   * (alto×largo×ancho / divisor) en cuanto se marca una orden. */
  linearFeetDivisor?: number;
  /** Versión compacta del tráiler, para cuando el picker vive en un modal. */
  compact?: boolean;
}

/**
 * Elegir qué órdenes de venta reales suben al tráiler y capturar, para cada
 * una, los pies lineales que ocupa. Antes esto elegía paquetes de bodega
 * (`warehouse.Package`) — se cambió a `sales.Order` porque un paquete de
 * bodega no tiene ningún vínculo con una orden ni con su
 * `references.orderNumber`.
 *
 * Sólo se ofrecen órdenes completadas (ni borradores, ni pendientes de HQ,
 * ni canceladas) y sin consolidado asignado — misma regla que valida el
 * back al agregarlas. Se identifican por su número de orden/socio (mismo badge doble
 * que usa la tabla de órdenes), no por el id interno.
 */
export const OrderPicker = ({
  selected,
  onChange,
  capacityLinearFeet,
  usedLinearFeet = 0,
  linearFeetDivisor = DEFAULT_LINEAR_FEET_DIVISOR,
  compact = false,
}: Props) => {
  const [search, setSearch] = useState("");
  const reduceMotion = useReducedMotion();
  const debouncedSearch = useDebouncedValue(search.trim());

  const {
    data, isLoading, isError, fetchNextPage, hasNextPage,
    isFetchingNextPage, refetch,
  } = useInfiniteQuery({
    // Agregar/quitar órdenes invalida también todas las búsquedas del selector.
    queryKey: consolidationKeys.availableOrders(debouncedSearch),
    // Sin los 5 minutos de caché del resto (como `useShipment`): lo que se
    // puede cargar cambia por cosas que no pasan aquí —completar una venta,
    // otro consolidado que toma una orden— y con caché se ofrecían órdenes
    // que el back ya rechaza. Se vuelve a pedir cada vez que se abre.
    staleTime: 0,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      orderRepository.find({
        filters: [
          { field: "consolidationId", filterOperator: "IS_NULL", value: null },
          { field: "status", filterOperator: "=", value: "COMPLETED" },
        ],
        search: debouncedSearch || undefined,
        limit: 50,
        offset: pageParam,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore && lastPage.data.length > 0
        ? lastPage.pagination.offset + lastPage.data.length
        : undefined,
  });

  const available = useMemo(
    () => [...new Map(
      (data?.pages.flatMap((page) => page.data) ?? [])
        .filter((o) => !o.consolidationId)
        .map((o) => [o.id, o]),
    ).values()],
    [data],
  );

  const ordersById = useMemo(
    () => new Map(available.map((o) => [o.id, o])),
    [available],
  );

  const selectedIds = selected.map((s) => s.orderId);

  const toggle = (orderId: string) => {
    if (selectedIds.includes(orderId)) {
      onChange(selected.filter((s) => s.orderId !== orderId));
      return;
    }
    // Se sugiere con la fórmula alto×largo×ancho / divisor, pero sigue
    // siendo un campo editable — si la caja no trae dimensiones usables
    // (0 es inválido para `calculateLinearFeet`), se deja en 0 como antes.
    const order = ordersById.get(orderId);
    const suggestedLinearFeet = order
      ? calculateLinearFeet(order.package.dimensions, linearFeetDivisor)
      : 0;
    onChange([
      ...selected,
      {
        orderId, linearFeet: suggestedLinearFeet, section: "",
        displayLabel: order?.references.orderNumber ?? order?.references.partnerOrderNumber ?? orderId.slice(0, 8).toUpperCase(),
      },
    ]);
  };

  const updateSelected = (orderId: string, patch: Partial<SelectedOrder>) => {
    onChange(
      selected.map((s) => (s.orderId === orderId ? { ...s, ...patch } : s)),
    );
  };

  const labelFor = (orderId: string) => {
    const order = ordersById.get(orderId);
    if (!order) return selected.find((s) => s.orderId === orderId)?.displayLabel ?? orderId.slice(0, 8).toUpperCase();
    return (
      order.references.orderNumber ??
      order.references.partnerOrderNumber ??
      orderId.slice(0, 8).toUpperCase()
    );
  };

  const pendingLinearFeet = selected.reduce(
    (sum, s) => sum + (s.linearFeet || 0),
    0,
  );

  return (
    // Container query: las dos columnas dependen del ancho donde vive el
    // picker (modal o página), no del viewport.
    <div className="@container flex h-full min-h-0 flex-col gap-3">
      <TruckVisual
        usedLinearFeet={usedLinearFeet}
        pendingLinearFeet={pendingLinearFeet}
        capacityLinearFeet={capacityLinearFeet}
        compact={compact}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-4 @3xl:flex-row">
        {/* `min-w-0`: sin él, el ancho mínimo de la columna es el texto completo
          de cada fila (`truncate` es `nowrap`) y empuja a las seleccionadas
          fuera del contenedor. */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por cliente, número de cliente, referencia o guía…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          {isLoading ? (
            <div className="flex flex-1 items-center justify-center py-10 text-sm text-muted-foreground">
              Cargando órdenes disponibles…
            </div>
          ) : isError && available.length === 0 ? (
            <div className="py-10 text-center text-sm text-destructive">
              <p>No se pudieron cargar las órdenes.</p>
              <Button type="button" variant="outline" onClick={() => void refetch()}>Reintentar</Button>
            </div>
          ) : available.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
              <Package className="size-8 opacity-30" />
              <p className="text-sm">
                {!debouncedSearch
                  ? "No hay órdenes disponibles para consolidar"
                  : "Sin resultados para esa búsqueda"}
              </p>
            </div>
          ) : (
            <div className="min-h-0 flex-1 divide-y overflow-y-auto rounded-md border">
              {available.map((o) => {
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
                      <p className="truncate text-sm font-medium">
                        {o.destination.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {o.destination.customerNumber != null
                          ? `#${formatCustomerNumber(o.destination.customerNumber)} · `
                          : ""}
                        {o.destination.address.city || "Sin ciudad"} ·{" "}
                        {o.store.name}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">
                          JBG
                        </span>
                        <Badge
                          variant="outline"
                          className="font-mono text-sm font-semibold"
                        >
                          {o.references.orderNumber ?? "—"}
                        </Badge>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">
                          Agente
                        </span>
                        <Badge
                          variant="secondary"
                          className="font-mono text-sm font-semibold"
                        >
                          {o.references.partnerOrderNumber ?? "—"}
                        </Badge>
                      </span>
                    </div>
                  </div>
                );
              })}
              {hasNextPage && (
                <div className="p-3 text-center">
                  {isError && <p className="text-sm text-destructive">No se pudieron cargar más órdenes.</p>}
                  <Button type="button" variant="outline" disabled={isFetchingNextPage} onClick={() => void fetchNextPage()}>
                    {isFetchingNextPage ? "Cargando…" : "Cargar más órdenes"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Apilado, se reparte la altura con la lista en cuanto hay algo
          seleccionado; lado a lado, ancho fijo. */}
        <div
          className={cn(
            "flex min-h-0 w-full flex-col gap-2 @3xl:w-[22rem] @3xl:flex-none",
            selected.length > 0 && "flex-1",
          )}
        >
          <div className="flex h-6 items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {selected.length === 0
                ? "Ninguna orden seleccionada"
                : `${selected.length} orden${selected.length !== 1 ? "es" : ""} seleccionada${selected.length !== 1 ? "s" : ""}`}
            </p>
            {selected.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 gap-1 px-2 text-xs"
                onClick={() => onChange([])}
              >
                <Eraser className="size-3.5" />
                Limpiar
              </Button>
            )}
          </div>
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
                      initial={
                        reduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, scale: 0.95 }
                      }
                      animate={{ opacity: 1, scale: 1 }}
                      exit={
                        reduceMotion
                          ? { opacity: 0, transition: { duration: 0.12 } }
                          : {
                              opacity: 0,
                              scale: 0.95,
                              transition: { duration: 0.12, ease: EASE_OUT },
                            }
                      }
                      transition={{ duration: 0.18, ease: EASE_OUT }}
                      className="rounded-md border p-2.5"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="truncate font-mono text-sm font-semibold">
                          {labelFor(s.orderId)}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-6 shrink-0 text-destructive hover:bg-destructive/10"
                          aria-label={`Quitar la orden ${labelFor(s.orderId)}`}
                          onClick={() => toggle(s.orderId)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label
                            htmlFor={`linear-feet-${s.orderId}`}
                            className="text-[11px] text-muted-foreground"
                          >
                            Pies lineales
                          </label>
                          <Input
                            id={`linear-feet-${s.orderId}`}
                            type="number"
                            min={0}
                            step="0.01"
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
                          <label
                            htmlFor={`section-${s.orderId}`}
                            className="text-[11px] text-muted-foreground"
                          >
                            Sección
                          </label>
                          <Input
                            id={`section-${s.orderId}`}
                            placeholder="Ej. A1"
                            className="h-8"
                            value={s.section}
                            onChange={(e) =>
                              updateSelected(s.orderId, {
                                section: e.target.value,
                              })
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
