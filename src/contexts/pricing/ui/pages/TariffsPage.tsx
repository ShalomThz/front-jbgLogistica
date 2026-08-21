import { useMemo, useState } from "react";
import {
  ChevronsUpDown,
  Columns3,
  Download,
  Eraser,
  Gauge,
  Globe,
  Handshake,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@contexts/shared/shadcn";
import { ZonePickerDialog } from "@contexts/pricing/ui/components/zone/ZonePickerDialog";
import type { ShippingMode } from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { ShippingModeSelector } from "@contexts/order-flow/ui/components/shared/ShippingModeSelector";
import { CountrySelect } from "@contexts/shared/ui/components/CountrySelect";
import { BoxPickerCombobox } from "@contexts/inventory/ui/components/box/BoxPickerCombobox";
import { ZonePriceCellDialog } from "../components/tariff/ZonePriceCellDialog";
import { exportTariffs } from "@contexts/pricing/domain/services/exportTariffs";
import { useTariffs } from "@contexts/pricing/infrastructure/hooks/tariffs/useTariffs";
import { useZonePriceMatrix } from "@contexts/pricing/infrastructure/hooks/tariffs/useZonePriceMatrix";
import {
  SERVICE_LEVEL_COLORS,
  SERVICE_LEVEL_DOTS,
  SERVICE_LEVEL_LABELS,
  SHIPPING_MODE_LABELS,
  serviceLevels,
  type ServiceLevel,
} from "@contexts/pricing/domain/schemas/tariff/Tariff";
import type {
  ZonePriceCell,
  ZonePriceRow,
} from "@contexts/pricing/application/ZonePriceMatrix";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import type { BoxPrimitives } from "@contexts/inventory/domain/schemas/box/Box";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { pricingPolicies } from "@contexts/shared/domain/policies/pricing.policy";

interface EditingCell {
  boxId: string;
  boxName: string;
  serviceLevel: ServiceLevel;
  publicPrice: MoneyPrimitives | null;
  partnerPrice: MoneyPrimitives | null;
}

const money = (m: MoneyPrimitives) =>
  `$${m.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

/** Margen que le queda al socio si revende al precio público. */
function marginPercent(
  publicPrice: MoneyPrimitives | null,
  partnerPrice: MoneyPrimitives | null,
): number | null {
  if (!publicPrice || !partnerPrice) return null;
  if (publicPrice.currency !== partnerPrice.currency) return null;
  if (publicPrice.amount <= 0) return null;
  return ((publicPrice.amount - partnerPrice.amount) / publicPrice.amount) * 100;
}

/**
 * Una celda por caja × servicio, con los dos precios adentro.
 *
 * Es un solo bloque y no dos columnas porque **la unidad editable es la celda**:
 * el diálogo escribe público y socio juntos. Con columnas separadas, el hover
 * sugería que se editaba un precio suelto.
 */
function PriceCell({
  cell,
  canEdit,
  onEdit,
}: {
  cell: ZonePriceCell | undefined;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const publicPrice = cell?.public?.price ?? null;
  const partnerPrice = cell?.partner?.price ?? null;
  const margin = marginPercent(publicPrice, partnerPrice);
  const isEmpty = !publicPrice && !partnerPrice;

  const content = isEmpty ? (
    <span className="flex items-center justify-center gap-1 py-1 text-xs text-muted-foreground">
      {canEdit && <Plus className="size-3" />}
      Sin precio
    </span>
  ) : (
    <span className="flex flex-col gap-0.5">
      <span className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="size-3 shrink-0" />
          Público
        </span>
        <span className="font-mono tabular-nums">
          {publicPrice ? money(publicPrice) : "—"}
        </span>
      </span>
      <span className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Handshake className="size-3 shrink-0" />
          Socio
        </span>
        <span className="font-mono tabular-nums">
          {partnerPrice ? money(partnerPrice) : "—"}
        </span>
      </span>
      {margin !== null && (
        <span
          className={`text-right text-[11px] ${
            margin < 0 ? "text-amber-600 dark:text-amber-500" : "text-muted-foreground"
          }`}
        >
          margen {margin.toFixed(0)}%
        </span>
      )}
    </span>
  );

  if (!canEdit) {
    return <div className="px-1 py-1.5">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      className="w-full rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
    </button>
  );
}

export const TariffsPage = () => {
  const { user } = useAuth();
  const canViewReports = user ? pricingPolicies.viewTariffReports(user) : false;
  const canEdit = user ? pricingPolicies.editTariff(user) : false;

  // Arranca en la zona de la tienda del usuario: es la que va a consultar el
  // 90% de las veces. Sale de `store.zoneId`, que ya viene en la sesión, así
  // que no hay que esperar una llamada extra para pintar la tabla.
  const userZoneId = user?.store?.zoneId;
  const [zoneId, setZoneId] = useState<string>(userZoneId ?? "");

  // La sesión puede resolverse después del primer render (recarga de página).
  const [lastUserZoneId, setLastUserZoneId] = useState(userZoneId);
  if (userZoneId !== lastUserZoneId) {
    setLastUserZoneId(userZoneId);
    if (!zoneId && userZoneId) setZoneId(userZoneId);
  }
  // La tabla se lee de a un modo: caja × servicio ya son dos ejes, y el modo
  // como tercero daría doce columnas por caja.
  const [shippingMode, setShippingMode] = useState<ShippingMode>("GROUND");
  // A dónde va la caja. Es el tercer eje de contexto de la tabla, junto a la
  // zona y el modo: los tres se eligen arriba y la tabla queda en caja ×
  // servicio.
  const [destinationCountry, setDestinationCountry] = useState("MX");

  const { rows, zone, isLoading, refetch, setPrice, isSaving } =
    useZonePriceMatrix(zoneId || undefined, destinationCountry, shippingMode);

  const [zonePickerOpen, setZonePickerOpen] = useState(false);
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [hiddenServices, setHiddenServices] = useState<ServiceLevel[]>([]);
  const [boxFilter, setBoxFilter] = useState<BoxPrimitives | null>(null);

  // Los cuatro servicios se muestran de entrada: así se ve de una qué
  // combinaciones faltan. Ocultarlos es decisión del usuario, desde el control
  // de columnas de la tabla.
  const visibleServices = useMemo(
    () => serviceLevels.filter((s) => !hiddenServices.includes(s)),
    [hiddenServices],
  );

  const toggleService = (service: ServiceLevel) =>
    setHiddenServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : // Nunca dejar la tabla sin columnas de precio.
          prev.length === serviceLevels.length - 1
          ? prev
          : [...prev, service],
    );

  // El export reusa la lista plana: la matriz es una vista, las tarifas siguen
  // siendo filas.
  const { tariffs } = useTariffs({
    filters: zoneId
      ? [{ field: "zone.id", filterOperator: "=" as const, value: zoneId }]
      : [],
    enabled: canViewReports && !!zoneId,
  });

  /**
   * La matriz solo trae las cajas que ya tienen algún precio en la zona. Buscar
   * una que no está la agrega igual, con la fila vacía: es la única forma de
   * ponerle precio a una caja nueva.
   */
  const visibleRows = useMemo<ZonePriceRow[]>(() => {
    if (!boxFilter) return rows;

    const existing = rows.find((r) => r.box.id === boxFilter.id);
    if (existing) return [existing];

    return [
      {
        box: boxFilter,
        cells: serviceLevels.map((serviceLevel) => ({
          serviceLevel,
          public: null,
          partner: null,
        })),
      },
    ];
  }, [rows, boxFilter]);

  const openCell = (row: ZonePriceRow, serviceLevel: ServiceLevel) => {
    if (!canEdit) return;
    const cell = row.cells.find((c) => c.serviceLevel === serviceLevel);
    setEditing({
      boxId: row.box.id,
      boxName: row.box.name,
      serviceLevel,
      publicPrice: cell?.public?.price ?? null,
      partnerPrice: cell?.partner?.price ?? null,
    });
  };

  const columnCount = 1 + visibleServices.length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tarifas</h1>
          <p className="text-sm text-muted-foreground">
            Precios por zona de recolección. Una celda sin precio es una tarifa que falta.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {canViewReports && (
            <Button
              variant="outline"
              size="icon"
              title="Exportar"
              disabled={!zoneId}
              onClick={() => exportTariffs(tariffs)}
            >
              <Download className="size-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            title="Recargar"
            onClick={() => void refetch()}
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Los cuatro controles en una tarjeta, en el orden en que se piensan:
          de dónde sale la caja, a dónde va, cómo viaja, y cuál es. Los tres
          primeros son parte de la clave del precio y recargan la tabla; el
          último acota lo ya cargado. */}
      <div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full space-y-1 sm:w-80">
              <Label className="flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                Zona
              </Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between font-normal"
                onClick={() => setZonePickerOpen(true)}
              >
                {zone ? (
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate">{zone.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {[zone.state, zone.country].filter(Boolean).join(", ")}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">Elegir zona</span>
                )}
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </div>
            {zoneId && (
              <div className="w-full space-y-1 sm:w-56">
                <Label
                  htmlFor="destination"
                  className="flex items-center gap-1.5"
                >
                  <Globe className="size-3.5" />
                  País destino
                </Label>
                <CountrySelect
                  value={destinationCountry}
                  onChange={setDestinationCountry}
                />
              </div>
            )}
            {zoneId && (
              <div className="w-full sm:w-44">
                <ShippingModeSelector
                  value={shippingMode}
                  onChange={setShippingMode}
                />
              </div>
            )}
            {zoneId && (
              <div className="space-y-1">
                <Label
                  htmlFor="box-filter"
                  className="flex items-center gap-1.5"
                >
                  <Package className="size-3.5" />
                  Seleccionar caja
                </Label>
                <div className="flex items-center gap-1">
                  <BoxPickerCombobox
                    id="box-filter"
                    value={boxFilter?.id}
                    onChange={setBoxFilter}
                    placeholder="Buscar caja..."
                    className="w-full sm:w-64"
                  />
                  {boxFilter && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Ver todas las cajas"
                      onClick={() => setBoxFilter(null)}
                    >
                      <Eraser className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!zoneId ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">
            Elegí una zona para ver sus precios.
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border">
          {/* Control de columnas, arriba a la derecha de la tabla. */}
          <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
            {/* La combinación completa que se está viendo. El botón de arriba
                ya dice la zona; acá importa el resto de la clave, que es lo
                que distingue una tabla de otra. */}
            <p className="truncate text-xs text-muted-foreground">
              {zone
                ? `${zone.name} → ${destinationCountry} · ${SHIPPING_MODE_LABELS[shippingMode]}`
                : ""}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={hiddenServices.length > 0 ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 shrink-0 gap-1.5"
                  title="Mostrar u ocultar servicios"
                >
                  <Columns3 className="size-4" />
                  Columnas
                  {hiddenServices.length > 0 && (
                    <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                      {hiddenServices.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Servicios</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {serviceLevels.map((service) => (
                  <DropdownMenuCheckboxItem
                    key={service}
                    checked={!hiddenServices.includes(service)}
                    onCheckedChange={() => toggleService(service)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`size-2 rounded-full ${SERVICE_LEVEL_DOTS[service]}`}
                      />
                      {SERVICE_LEVEL_LABELS[service]}
                    </span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="[&>th]:bg-background sticky top-0 z-10">
                <TableHead className="w-48">
                  <span className="flex items-center gap-1.5">
                    <Package className="size-3.5" />
                    Caja
                  </span>
                </TableHead>
                {visibleServices.map((service) => (
                  <TableHead
                    key={service}
                    className="min-w-40 border-l text-center"
                  >
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 ${SERVICE_LEVEL_COLORS[service]}`}
                    >
                      <Gauge className="size-3.5" />
                      {SERVICE_LEVEL_LABELS[service]}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columnCount}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Cargando precios...
                  </TableCell>
                </TableRow>
              ) : visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columnCount}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {zone?.name} no tiene ningún precio configurado todavía.
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((row) => (
                  <TableRow key={row.box.id}>
                    <TableCell className="align-middle font-medium">
                      <div>{row.box.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.box.dimensions.length} × {row.box.dimensions.width} ×{" "}
                        {row.box.dimensions.height} {row.box.dimensions.unit}
                      </div>
                    </TableCell>
                    {visibleServices.map((service) => (
                      <TableCell key={service} className="border-l p-1 align-middle">
                        <PriceCell
                          cell={row.cells.find((c) => c.serviceLevel === service)}
                          canEdit={canEdit}
                          onEdit={() => openCell(row, service)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </div>
      )}

      {editing && (
        <ZonePriceCellDialog
          open
          onClose={() => setEditing(null)}
          onSave={setPrice}
          zoneId={zoneId}
          zoneName={zone?.name}
          boxId={editing.boxId}
          boxName={editing.boxName}
          serviceLevel={editing.serviceLevel}
          destinationCountry={destinationCountry}
          shippingMode={shippingMode}
          publicPrice={editing.publicPrice}
          partnerPrice={editing.partnerPrice}
          isLoading={isSaving}
        />
      )}

      <ZonePickerDialog
        open={zonePickerOpen}
        onClose={() => setZonePickerOpen(false)}
        onSelect={(z) => setZoneId(z.id)}
        current={zone}
      />
    </div>
  );
};
