import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import { Building2, Info, User } from "lucide-react";
import boxIsometricSvg from "@/assets/box-isometric.svg";
import type { PartnerOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { BoxSelector } from "../../shared/BoxSelector";
import { ShippingSummary } from "../../shared/ShippingSummary";
import { ZoneSelector } from "../../shared/ZoneSelector";

interface PartnerPackageStepProps {
  onEditContacts: () => void;
  originZoneId: string | undefined;
  /** Presente solo si el usuario tiene permiso para cambiar la zona. */
  onZoneChange?: (zoneId: string) => void;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <p className="text-sm font-medium tabular-nums">{value || "—"}</p>
    </div>
  );
}

export function PartnerPackageStep({ onEditContacts, originZoneId, onZoneChange }: PartnerPackageStepProps) {
  const { control } = useFormContext<PartnerOrderFormValues>();
  const pkg = useWatch<PartnerOrderFormValues, "package">({ name: "package" });
  const destinationCountry = useWatch<PartnerOrderFormValues, "recipient.address.country">({
    name: "recipient.address.country",
  });

  const hasVolume = !!(pkg.length && pkg.width && pkg.height);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left column */}
      <Card className="flex-3 shadow-none transition-shadow focus-within:shadow-lg focus-within:shadow-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dimensiones del paquete</CardTitle>
          <p className="text-sm text-muted-foreground">
            Medidas del paquete
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* Ownership select */}
          <div className="space-y-2">
            <Label>Propiedad de la caja *</Label>
            <div className="flex items-center gap-3">
              <Controller
                control={control}
                name="package.ownership"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOMER">
                        <span className="flex items-center gap-2">
                          <User className="size-4" />
                          Caja del cliente
                        </span>
                      </SelectItem>
                      <SelectItem value="STORE">
                        <span className="flex items-center gap-2">
                          <Building2 className="size-4" />
                          Caja de la tienda
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {pkg.ownership === "STORE" && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 whitespace-nowrap">
                  <Info className="size-3.5 shrink-0" />
                  Se descontará del inventario al terminar la orden
                </p>
              )}
              {pkg.ownership === "CUSTOMER" && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                  <Info className="size-3.5 shrink-0" />
                  No se descontará del inventario
                </p>
              )}
            </div>
          </div>

          {/* Inner 2-col grid: form | image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sub-col 1: box selector + dimensions */}
            <div className="space-y-4">
              {onZoneChange && (
                <ZoneSelector zoneId={originZoneId} onZoneChange={onZoneChange} />
              )}
              <BoxSelector zoneScope={{ zoneId: originZoneId, destinationCountry }} />

              {/* Inline dimensions — always derived from the selected box */}
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <div className="grid grid-cols-4 gap-3">
                  <ReadOnlyField label="Largo" value={pkg.length} />
                  <ReadOnlyField label="Ancho" value={pkg.width} />
                  <ReadOnlyField label="Alto" value={pkg.height} />
                  <ReadOnlyField label="Unidad" value={pkg.dimensionUnit} />
                </div>
              </div>
            </div>

            {/* Sub-col 2: image (dimensions only, no weight calculations) */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-muted/30 py-6">
                <img src={boxIsometricSvg} alt="Caja" className="w-32 h-auto" />
                <p className="text-sm text-muted-foreground">
                  {pkg.packageType || "Sin caja seleccionada"}
                </p>
                {hasVolume && (
                  <p className="text-xs text-muted-foreground">
                    {pkg.length} × {pkg.width} × {pkg.height} {pkg.dimensionUnit}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right column: shipping summary */}
      <div className="flex-1 space-y-4">
        <ShippingSummary onEditContacts={onEditContacts} />
      </div>
    </div>
  );
}
