import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
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
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { ChevronDown, Container, Truck } from "lucide-react";
import type { NewConsolidationFormValues } from "@contexts/consolidation/domain/schemas/consolidation/NewConsolidationForm";
import type { TrailerPrimitives } from "@contexts/consolidation/domain/schemas/trailer/Trailer";
import type { DriverListViewPrimitives } from "@contexts/shipping/domain/schemas/driver/DriverListView";
import { TrailerCardList } from "@contexts/consolidation/ui/components/TrailerCardList";
import { TRAILER_FIELD_ID } from "@contexts/consolidation/ui/hooks/useNewConsolidationFlow";

const NO_DRIVER = "none";

interface Props {
  trailers: TrailerPrimitives[];
  drivers: DriverListViewPrimitives[];
  onSelectTrailer: (id: string) => void;
}

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-xs text-destructive">{message}</p> : null;

/** Paso 1: a dónde va (ruta) y en qué va (unidad). */
export const ConsolidationDetailsStep = ({ trailers, drivers, onSelectTrailer }: Props) => {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<NewConsolidationFormValues>();
  const [trailerId, driverId, capacity] = useWatch({
    control,
    name: ["trailerId", "driverId", "capacityLinearFeet"],
  });
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const activeTrailers = trailers.filter((t) => t.isActive);
  const selectedTrailer = trailers.find((t) => t.id === trailerId);
  const capacityChanged =
    !!selectedTrailer && Number(capacity) !== selectedTrailer.capacityLinearFeet;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Card className="h-fit">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Container className="size-4 text-muted-foreground" />
            Ruta
          </div>
          <div className="space-y-2">
            <Label htmlFor="folio">Folio</Label>
            <Input
              id="folio"
              placeholder="Ej. MX-0927-01"
              aria-invalid={!!errors.folio}
              {...register("folio")}
            />
            <FieldError message={errors.folio?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="origin">Origen</Label>
            <Input
              id="origin"
              placeholder="Ej. Los Ángeles, CA"
              aria-invalid={!!errors.origin}
              {...register("origin")}
            />
            <FieldError message={errors.origin?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination">Destino</Label>
            <Input
              id="destination"
              placeholder="Ej. Ciudad de México, CDMX"
              aria-invalid={!!errors.destination}
              {...register("destination")}
            />
            <FieldError message={errors.destination?.message} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Truck className="size-4 text-muted-foreground" />
            Unidad
          </div>

          <div id={TRAILER_FIELD_ID} className="scroll-mt-4 space-y-2">
            <Label id="new-consolidation-trailer-label">Tráiler</Label>
            <div
              className={cn(
                "rounded-lg",
                errors.trailerId && "ring-1 ring-destructive ring-offset-2 ring-offset-background",
              )}
            >
              <TrailerCardList
                trailers={activeTrailers}
                selectedId={trailerId}
                onSelect={onSelectTrailer}
                labelledBy="new-consolidation-trailer-label"
              />
            </div>
            <FieldError message={errors.trailerId?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-consolidation-driver">Conductor</Label>
              <Select
                value={driverId || NO_DRIVER}
                onValueChange={(v) => setValue("driverId", v === NO_DRIVER ? "" : v)}
              >
                <SelectTrigger id="new-consolidation-driver" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_DRIVER}>Sin asignar</SelectItem>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.user.name} · {d.licenseNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidad (pies lineales)</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                aria-invalid={!!errors.capacityLinearFeet}
                {...register("capacityLinearFeet")}
              />
              <FieldError message={errors.capacityLinearFeet?.message} />
              {selectedTrailer && (
                <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  Capacidad de la unidad: {selectedTrailer.capacityLinearFeet} ft
                  {capacityChanged && (
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-xs"
                      onClick={() =>
                        setValue(
                          "capacityLinearFeet",
                          String(selectedTrailer.capacityLinearFeet),
                          { shouldValidate: true },
                        )
                      }
                    >
                      Usar la de la unidad
                    </Button>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Opciones avanzadas (colapsable), mismo patrón que las métricas. */}
          <div className="space-y-2 border-t pt-3">
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform",
                  !advancedOpen && !errors.linearFeetDivisor && "-rotate-90",
                )}
              />
              Opciones avanzadas
            </button>
            {(advancedOpen || !!errors.linearFeetDivisor) && (
              <div className="space-y-2">
                <Label htmlFor="linear-feet-divisor">Divisor para pies lineales</Label>
                <Input
                  id="linear-feet-divisor"
                  type="number"
                  min={1}
                  className="sm:max-w-48"
                  aria-invalid={!!errors.linearFeetDivisor}
                  {...register("linearFeetDivisor")}
                />
                <FieldError message={errors.linearFeetDivisor?.message} />
                <p className="text-xs text-muted-foreground">
                  Al agregar una orden se sugieren sus pies lineales con
                  alto×largo×ancho (pulgadas) de su caja ÷ este número. Siempre
                  se pueden editar después.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
