import {
  Badge,
  Card,
  CardContent,
  Separator,
} from "@contexts/shared/shadcn";
import { ChevronDown, Edit, MapPin, Package, Truck, User } from "lucide-react";
import { useState } from "react";
import { useWatch } from "react-hook-form";
import type { HQOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { calculateBillableWeight } from "@contexts/order-flow/domain/services/packageCalculations";

interface ShipmentSummaryCardProps {
  onEdit: () => void;
}

export function ShipmentSummaryCard({ onEdit }: ShipmentSummaryCardProps) {
  const [open, setOpen] = useState(false);

  const sender = useWatch<HQOrderFormValues, "sender">({ name: "sender" });
  const recipient = useWatch<HQOrderFormValues, "recipient">({ name: "recipient" });
  const pkg = useWatch<HQOrderFormValues, "package">({ name: "package" });
  const selectedRate = useWatch<HQOrderFormValues, "shippingService.selectedRate">({ name: "shippingService.selectedRate" });

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Resumen de envío</span>
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="inline-flex items-center text-xs text-primary hover:text-primary/80 cursor-pointer"
          >
            <Edit className="size-3 mr-1" />
            Editar
          </span>
        </div>
        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <User className="size-3" />
              Remitente
            </div>
            <div className="text-sm font-medium">{sender.name || "Sin nombre"}</div>
            <div className="text-xs text-muted-foreground">{sender.phone}</div>
            {sender.address.address1 && (
              <div className="flex items-start gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3 mt-0.5 shrink-0" />
                <span>
                  {sender.address.address1}, {sender.address.city}, {sender.address.province} {sender.address.zip}
                </span>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <User className="size-3" />
              Destinatario
            </div>
            <div className="text-sm font-medium">{recipient.name || "Sin nombre"}</div>
            <div className="text-xs text-muted-foreground">{recipient.phone}</div>
            {recipient.address.address1 && (
              <div className="flex items-start gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3 mt-0.5 shrink-0" />
                <span>
                  {recipient.address.address1}, {recipient.address.city}, {recipient.address.province} {recipient.address.zip}
                </span>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Package className="size-3" />
              Paquete
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>{pkg.length} x {pkg.width} x {pkg.height} {pkg.dimensionUnit}</div>
              <div>Peso a cotizar: {calculateBillableWeight(pkg).toFixed(2)} kg</div>
            </div>
          </div>

          {selectedRate && (
            <>
              <Separator />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Truck className="size-3" />
                  Servicio seleccionado
                </div>
                <div className="text-sm font-medium">{selectedRate.serviceName}</div>
                {selectedRate.estimatedDays != null && (
                  <div className="text-xs text-muted-foreground">
                    {selectedRate.estimatedDays} día{selectedRate.estimatedDays !== 1 ? "s" : ""} hábil{selectedRate.estimatedDays !== 1 ? "es" : ""}
                  </div>
                )}
                {selectedRate.isOcurre && (
                  <Badge variant="secondary" className="text-xs">Ocurre</Badge>
                )}
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
