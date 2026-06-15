import { useState } from "react";
import { Badge, Checkbox, Input } from "@contexts/shared/shadcn";
import { Package, Search } from "lucide-react";
import { useShipments } from "../../../infrastructure/hooks/shipments/useShipments";

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export const ShipmentPicker = ({ selectedIds, onChange }: Props) => {
  const [search, setSearch] = useState("");

  const { shipments, isLoading } = useShipments({
    page: 1,
    limit: 100,
    filters: [{ field: "status", filterOperator: "=", value: "FULFILLED" }],
  });

  const filtered = search.trim()
    ? shipments.filter((s) => {
      const q = search.toLowerCase();
      const label = (s.label?.trackingNumber ?? s.orderId).toLowerCase();
      return label.includes(q) || s.orderId.toLowerCase().includes(q);
    })
    : shipments;

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id],
    );
  };

  const toggleAll = () => {
    onChange(
      selectedIds.length === filtered.length ? [] : filtered.map((s) => s.id),
    );
  };

  const allSelected =
    filtered.length > 0 && selectedIds.length === filtered.length;

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar por tracking o pedido…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground py-10">
          Cargando envíos listos para asignar…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground py-10">
          <Package className="size-8 opacity-30" />
          <p className="text-sm">
            {shipments.length === 0
              ? "No hay envíos con estado FULFILLED"
              : "Sin resultados para esa búsqueda"}
          </p>
        </div>
      ) : (
        <>
          {/* Select-all header */}
          <div
            className="flex items-center gap-2.5 px-2 py-1.5 border-b text-sm cursor-pointer select-none hover:bg-muted/40 rounded-t-md"
            onClick={toggleAll}
          >
            <Checkbox checked={allSelected} />
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Seleccionar todos ({filtered.length})
            </span>
          </div>

          <div className="overflow-y-auto rounded-md border divide-y flex-1 min-h-0 max-h-75">
            {filtered.map((s) => {
              const label = s.label?.trackingNumber ?? s.orderId.slice(0, 12).toUpperCase();
              const isSelected = selectedIds.includes(s.id);

              return (
                <div
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer select-none transition-colors hover:bg-muted/50 ${isSelected ? "bg-primary/5" : ""
                    }`}
                >
                  <Checkbox checked={isSelected} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium font-mono truncate">
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Pedido: {s.orderId.slice(0, 16)}
                      {s.warehouseAddress?.name
                        ? ` · ${s.warehouseAddress.name}`
                        : ""}
                    </p>
                  </div>
                  {s.provider && (
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {s.provider.providerName}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Count badge */}
      {selectedIds.length > 0 && (
        <p className="text-xs text-primary font-medium">
          {selectedIds.length} envío{selectedIds.length !== 1 ? "s" : ""}{" "}
          seleccionado{selectedIds.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
};
