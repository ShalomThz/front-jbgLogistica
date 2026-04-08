import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from "@contexts/shared/shadcn";
import { MapPin, Package, User } from "lucide-react";
import { useWatch } from "react-hook-form";
import type { PartnerOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";

export function PartnerOrderSummaryCard() {
  const sender = useWatch<PartnerOrderFormValues, "sender">({ name: "sender" });
  const recipient = useWatch<PartnerOrderFormValues, "recipient">({ name: "recipient" });
  const pkg = useWatch<PartnerOrderFormValues, "package">({ name: "package" });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Resumen de orden</CardTitle>
      </CardHeader>
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
            {pkg.packageType && <div>Caja: {pkg.packageType}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
