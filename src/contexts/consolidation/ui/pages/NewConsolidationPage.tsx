import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import { useDrivers } from "@contexts/shipping/infrastructure/hooks/drivers/useDrivers";
import { useTrailers } from "@contexts/consolidation/infrastructure/hooks/useTrailers";
import { useConsolidations } from "@contexts/consolidation/infrastructure/hooks/useConsolidations";
import { consolidationRepository } from "@contexts/consolidation/infrastructure/services/consolidationRepository";
import { OrderPicker, type SelectedOrder } from "@contexts/consolidation/ui/components/OrderPicker";
import { StepIndicator } from "@contexts/order-flow/ui/components/shared/StepIndicator";
import { ArrowLeft, Container, MapPin, Package, Truck, User } from "lucide-react";

const steps = [
  { key: "datos", label: "Datos del consolidado" },
  { key: "ordenes", label: "Agregar órdenes" },
  { key: "revisar", label: "Revisar y crear" },
] as const;

type StepKey = (typeof steps)[number]["key"];

/**
 * Alta de un consolidado: página de 3 pasos en vez de un diálogo —demasiados
 * datos para un modal, mismo criterio que `NewHQOrderPage`. A diferencia de
 * ese flujo (varios archivos + hook propio), este wizard es más chico y se
 * resuelve en un solo archivo con estado local.
 */
export const NewConsolidationPage = () => {
  const navigate = useNavigate();
  const { createConsolidation, isCreating } = useConsolidations();
  const { drivers } = useDrivers({ filters: [] });
  const { trailers } = useTrailers();

  const [step, setStep] = useState<StepKey>("datos");

  const [folio, setFolio] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [trailerId, setTrailerId] = useState<string>("");
  const [driverId, setDriverId] = useState<string>("");
  const [capacityLinearFeet, setCapacityLinearFeet] = useState("53");

  const [orders, setOrders] = useState<SelectedOrder[]>([]);

  const activeTrailers = trailers.filter((t) => t.isActive);

  const datosComplete =
    !!folio.trim() &&
    !!origin.trim() &&
    !!destination.trim() &&
    !!trailerId &&
    Number(capacityLinearFeet) > 0;

  const hasInvalidOrder = orders.some((o) => !o.linearFeet || o.linearFeet <= 0);
  const ordenesComplete = orders.length === 0 || !hasInvalidOrder;

  const totalLinearFeet = orders.reduce((sum, o) => sum + (o.linearFeet || 0), 0);
  const overCapacity = totalLinearFeet > Number(capacityLinearFeet || 0);
  const selectedDriver = drivers.find((d) => d.id === driverId);
  const selectedTrailer = trailers.find((t) => t.id === trailerId);

  const handleSelectTrailer = (id: string) => {
    setTrailerId(id);
    const trailer = trailers.find((t) => t.id === id);
    if (trailer) setCapacityLinearFeet(String(trailer.capacityLinearFeet));
  };

  const handleCreate = async () => {
    try {
      const consolidation = await createConsolidation({
        folio: folio.trim(),
        origin: { label: origin.trim(), geolocation: null },
        destination: { label: destination.trim(), geolocation: null },
        trailerId: trailerId || null,
        driverId: driverId || null,
        capacityLinearFeet: Number(capacityLinearFeet),
      });

      if (orders.length > 0) {
        await consolidationRepository.addOrders(consolidation.id, {
          orders: orders.map((o) => ({
            orderId: o.orderId,
            linearFeet: o.linearFeet,
            section: o.section || null,
          })),
        });
      }

      toast.success(`Consolidado ${consolidation.folio} creado`);
      navigate(`/consolidations/${consolidation.id}`, { replace: true });
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  const goNext = () => setStep(steps[steps.findIndex((s) => s.key === step) + 1].key);
  const goPrev = () => setStep(steps[steps.findIndex((s) => s.key === step) - 1].key);

  const nextDisabled =
    (step === "datos" && !datosComplete) || (step === "ordenes" && !ordenesComplete);

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate("/consolidations")}>
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-2xl font-bold">Nuevo consolidado</h1>
      </div>

      <div className="flex justify-center">
        <StepIndicator steps={[...steps]} currentStep={step} onStepClick={setStep} />
      </div>

      {step === "datos" && (
        <div className="mx-auto w-full max-w-2xl space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Container className="size-4 text-muted-foreground" />
                Identificación
              </div>
              <div className="space-y-2">
                <Label htmlFor="folio">Folio</Label>
                <Input
                  id="folio"
                  placeholder="Ej. MX-0927-01"
                  value={folio}
                  onChange={(e) => setFolio(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="size-4 text-muted-foreground" />
                Ruta
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="origin">Origen</Label>
                  <Input
                    id="origin"
                    placeholder="Ej. Los Ángeles, CA"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destino</Label>
                  <Input
                    id="destination"
                    placeholder="Ej. Ciudad de México, CDMX"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Truck className="size-4 text-muted-foreground" />
                Unidad y conductor
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tráiler</Label>
                  <Select value={trailerId} onValueChange={handleSelectTrailer}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Elige una unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTrailers.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No hay tráilers activos —{" "}
                          <a href="/trailers" className="underline">
                            da de alta uno
                          </a>
                          .
                        </div>
                      ) : (
                        activeTrailers.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.unitNumber} · {t.type} · {t.plates}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Conductor</Label>
                  <Select value={driverId} onValueChange={setDriverId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.user.name} · {d.licenseNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidad (pies lineales)</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  value={capacityLinearFeet}
                  onChange={(e) => setCapacityLinearFeet(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === "ordenes" && (
        <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-3">
          <div className="min-h-0 flex-1">
            <OrderPicker selected={orders} onChange={setOrders} />
          </div>
          {orders.length > 0 && (
            <p
              className={`text-center text-sm ${overCapacity ? "font-medium text-destructive" : "text-muted-foreground"}`}
            >
              {totalLinearFeet.toFixed(1)} / {capacityLinearFeet} pies lineales usados
              {overCapacity && " — por encima de la capacidad declarada"}
            </p>
          )}
        </div>
      )}

      {step === "revisar" && (
        <div className="mx-auto w-full max-w-2xl space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-lg font-semibold">{folio}</p>
                <Badge variant="outline">{origin} → {destination}</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="size-4 shrink-0 text-muted-foreground" />
                  <span>
                    {selectedTrailer
                      ? `${selectedTrailer.unitNumber} · ${selectedTrailer.type} · ${selectedTrailer.plates}`
                      : "Sin tráiler asignado"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="size-4 shrink-0 text-muted-foreground" />
                  <span>{selectedDriver ? `${selectedDriver.user.name} · ${selectedDriver.licenseNumber}` : "Sin conductor asignado"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <div className="rounded-full bg-muted p-2.5 text-primary">
                  <Package className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Órdenes</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">Capacidad</p>
                <p
                  className={`text-2xl font-bold ${overCapacity ? "text-destructive" : ""}`}
                >
                  {totalLinearFeet.toFixed(1)}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / {capacityLinearFeet} ft
                  </span>
                </p>
                {overCapacity && (
                  <p className="text-xs font-medium text-destructive">
                    Por encima de la capacidad
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="mx-auto mt-auto flex w-full max-w-2xl justify-between border-t pt-4">
        <Button variant="outline" onClick={() => (step === "datos" ? navigate("/consolidations") : goPrev())}>
          {step === "datos" ? "Cancelar" : "Anterior"}
        </Button>
        {step !== "revisar" ? (
          <Button disabled={nextDisabled} onClick={goNext}>
            Siguiente
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? "Creando..." : "Crear consolidado"}
          </Button>
        )}
      </div>
    </div>
  );
};
