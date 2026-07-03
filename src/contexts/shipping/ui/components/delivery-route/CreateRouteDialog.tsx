import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  Package,
  Truck,
  User,
} from "lucide-react";
import { useHQSettings } from "@contexts/settings/infrastructure/hooks/useSkydropxSettings";
import { useAlreadyRoutedDriverIds } from "@contexts/shipping/infrastructure/hooks/routes/useRoutes";
import type { CreateRouteRequest } from "../../../application/route/CreateRouteRequest";
import type { DriverListViewPrimitives } from "../../../domain/schemas/driver/DriverListView";
import type { RouteType } from "../../../domain/schemas/route/Route";
import { HomePickupOrderPicker } from "../picking-route/HomePickupOrderPicker";
import { OriginMapPicker, type OriginPickerValue } from "./OriginMapPicker";
import { OrderPicker } from "./OrderPicker";

const DRIVER_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Disponible",
  ON_ROUTE: "En ruta",
  OFF_DUTY: "Fuera de servicio",
};

const STEPS = [
  { id: 1, label: "Conductor", icon: User },
  { id: 2, label: "Punto de salida", icon: MapPin },
  { id: 3, label: "Órdenes", icon: Package },
] as const;

type Step = 1 | 2 | 3;

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateRouteRequest) => void;
  drivers: DriverListViewPrimitives[];
  isLoading: boolean;
  alreadyRoutedShipmentIds?: Set<string>;
  /** DELIVERY (entrega) o PICKING (recolección a domicilio) */
  routeType?: RouteType;
}

export const CreateRouteDialog = ({
  open,
  onClose,
  onSave,
  drivers,
  isLoading,
  alreadyRoutedShipmentIds,
  routeType = "DELIVERY",
}: Props) => {
  const [step, setStep] = useState<Step>(1);
  const [driverId, setDriverId] = useState("");
  const [origin, setOrigin] = useState<OriginPickerValue | null>(null);
  const [warehouseFlyTo, setWarehouseFlyTo] = useState<[number, number] | null>(null);
  const [selectedWarehouseIdx, setSelectedWarehouseIdx] = useState(-1);
  const [shipmentIds, setShipmentIds] = useState<string[]>([]);

  const { skydropxAddresses, isLoading: isLoadingAddresses } = useHQSettings();
  const routedDriverIds = useAlreadyRoutedDriverIds();

  const availableDrivers = drivers.filter(
    (d) => d.status === "AVAILABLE" && !routedDriverIds.has(d.id),
  );
  const busyDrivers = drivers.filter(
    (d) => d.status !== "AVAILABLE" || routedDriverIds.has(d.id),
  );

  const selectedDriver = drivers.find((d) => d.id === driverId);

  const reset = () => {
    setStep(1);
    setDriverId("");
    setOrigin(null);
    setWarehouseFlyTo(null);
    setSelectedWarehouseIdx(-1);
    setShipmentIds([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!driverId || !origin) return;
    onSave({
      driverId,
      origin: {
        latitude: origin.latitude,
        longitude: origin.longitude,
        placeId: origin.placeId,
      },
      shipmentIds,
      type: routeType,
    });
    reset();
  };

  const isPicking = routeType === "PICKING";

  const canAdvance =
    (step === 1 && !!driverId) ||
    (step === 2 && !!origin) ||
    step === 3;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[95vw] sm:max-w-[90vw] lg:max-w-[1100px] max-h-[92vh] overflow-y-auto transition-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="size-5 text-primary" />
            {isPicking ? "Crear ruta de recolección" : "Crear nueva ruta"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 &&
              (isPicking
                ? "Selecciona el conductor que recolectará los paquetes a domicilio."
                : "Selecciona el conductor que realizará las entregas.")}
            {step === 2 && "Define el punto de salida: busca una dirección o haz clic en el mapa."}
            {step === 3 &&
              (isPicking
                ? "Elige las órdenes \"aplica recolección a domicilio\" por recolectar (opcional)."
                : "Elige las órdenes con envío FULFILLED para incluir en esta ruta (opcional).")}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-0 my-1">
          {STEPS.map((s, idx) => {
            const isDone = s.id < step;
            const isActive = s.id === step;
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors ${
                      isDone
                        ? "border-primary bg-primary text-primary-foreground"
                        : isActive
                        ? "border-primary bg-background text-primary"
                        : "border-muted-foreground/30 bg-background text-muted-foreground/50"
                    }`}
                  >
                    {isDone ? <Check className="size-3.5" /> : s.id}
                  </div>
                  <span
                    className={`text-[10px] font-medium whitespace-nowrap ${
                      isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground/50"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-2 mb-4 transition-colors ${
                      step > s.id ? "bg-primary" : "bg-muted-foreground/20"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content — conditionally mounted so Maps/network only load when reached */}

        {/* Step 1: Driver */}
        {step === 1 && (
          <div className="space-y-3 py-1">
            <Label className="flex items-center gap-1.5 text-sm">
              <User className="size-3.5" />
              Conductor
            </Label>
            {availableDrivers.length === 0 ? (
              <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-700">
                <AlertCircle className="size-4 shrink-0" />
                No hay conductores disponibles en este momento.
              </div>
            ) : (
              <Select value={driverId} onValueChange={setDriverId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Seleccionar conductor…" />
                </SelectTrigger>
                <SelectContent>
                  {availableDrivers.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Disponibles
                      </div>
                      {availableDrivers.map((d) => (
                        <SelectItem key={d.id} value={d.id} className="py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-7 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold shrink-0">
                              {d.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium">{d.user.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {d.licenseNumber}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {busyDrivers.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">
                        No disponibles
                      </div>
                      {busyDrivers.map((d) => (
                        <SelectItem key={d.id} value={d.id} disabled className="py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold shrink-0">
                              {d.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-muted-foreground">{d.user.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {routedDriverIds.has(d.id) ? "En ruta" : (DRIVER_STATUS_LABELS[d.status] ?? d.status)} · {d.licenseNumber}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            )}

            {/* Selected driver preview */}
            {selectedDriver && (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3 mt-1">
                <div className="flex size-9 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold">
                  {selectedDriver.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">{selectedDriver.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Licencia: {selectedDriver.licenseNumber}
                  </p>
                </div>
                <div className="ml-auto">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    Disponible
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Origin — warehouse select + map picker */}
        {step === 2 && (
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm">
                <MapPin className="size-3.5" />
                Almacén de salida
              </Label>
              <Select
                value={selectedWarehouseIdx >= 0 ? String(selectedWarehouseIdx) : ""}
                onValueChange={(val) => {
                  const idx = Number(val);
                  const addr = skydropxAddresses[idx];
                  if (!addr) return;
                  const { latitude, longitude, placeId } = addr.address.geolocation;
                  setSelectedWarehouseIdx(idx);
                  setOrigin({ latitude, longitude, placeId });
                  setWarehouseFlyTo([latitude, longitude]);
                }}
                disabled={isLoadingAddresses || skydropxAddresses.length === 0}
              >
                <SelectTrigger className="h-11">
                  <SelectValue
                    placeholder={
                      isLoadingAddresses ? "Cargando almacenes…" : "Seleccionar almacén…"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {skydropxAddresses.map((addr, idx) => (
                    <SelectItem key={idx} value={String(idx)}>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">
                          {addr.name} — {addr.company}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {addr.address.address1}, {addr.address.city},{" "}
                          {addr.address.province} {addr.address.zip}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                O ajusta el punto manualmente en el mapa
              </p>
            </div>
            <OriginMapPicker
              value={origin}
              onChange={(v) => { setOrigin(v); if (!v) setSelectedWarehouseIdx(-1); }}
              externalFlyTo={warehouseFlyTo}
            />
          </div>
        )}

        {/* Step 3: Order picker — only mounts here, lazy-loads network call */}
        {step === 3 && (
          <div className="py-1 min-h-[300px]">
            {isPicking ? (
              <HomePickupOrderPicker
                selectedShipmentIds={shipmentIds}
                onChange={setShipmentIds}
                excludedShipmentIds={alreadyRoutedShipmentIds}
              />
            ) : (
              <OrderPicker selectedShipmentIds={shipmentIds} onChange={setShipmentIds} excludedShipmentIds={alreadyRoutedShipmentIds} />
            )}
          </div>
        )}

        <DialogFooter className="border-t pt-4 mt-2 flex-row items-center">
          {/* Summary chips */}
          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0 mr-2">
            {selectedDriver && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground truncate max-w-[180px]">
                <User className="size-3 shrink-0" />
                {selectedDriver.user.name}
              </span>
            )}
            {origin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground font-mono">
                <MapPin className="size-3 shrink-0" />
                {origin.latitude.toFixed(4)}, {origin.longitude.toFixed(4)}
              </span>
            )}
            {shipmentIds.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs">
                <Package className="size-3 shrink-0" />
                {shipmentIds.length} envío{shipmentIds.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={step === 1 ? handleClose : () => setStep((s) => (s - 1) as Step)}
              disabled={isLoading}
              className="gap-1.5"
            >
              {step === 1 ? (
                "Cancelar"
              ) : (
                <>
                  <ArrowLeft className="size-3.5" />
                  Anterior
                </>
              )}
            </Button>

            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep((s) => (s + 1) as Step)}
                disabled={!canAdvance}
                className="gap-1.5"
              >
                Siguiente
                <ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!driverId || !origin || isLoading}
                className="gap-1.5"
              >
                {isLoading ? (
                  "Creando…"
                ) : (
                  <>
                    <Check className="size-3.5" />
                    {isPicking ? "Crear ruta de recolección" : "Crear ruta"}
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
