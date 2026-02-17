import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from "@contexts/shared/shadcn";
import { Edit } from "lucide-react";
import { useWatch } from "react-hook-form";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";

interface ShippingSummaryProps {
  onEditContacts: () => void;
}

export function ShippingSummary({ onEditContacts }: ShippingSummaryProps) {
  const sender = useWatch<NewOrderFormValues, "sender">({ name: "sender" });
  const recipient = useWatch<NewOrderFormValues, "recipient">({ name: "recipient" });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Resumen de envío</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Sender Summary */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">Remitente</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditContacts}
              className="h-auto p-0 text-xs text-primary hover:text-primary/80"
            >
              <Edit className="size-3 mr-1" />
              Editar
            </Button>
          </div>
          <div className="text-sm space-y-1">
            <div className="font-medium">{sender.name || "Sin nombre"}</div>
            <div className="text-muted-foreground">{sender.phone || "Sin teléfono"}</div>
            {sender.address.address1 && (
              <div className="text-muted-foreground text-xs">
                {sender.address.address1}
                {sender.address.address2 && `, ${sender.address.address2}`}
                <br />
                {sender.address.zip} {sender.address.city}, {sender.address.province}
                <br />
                {sender.address.country}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Recipient Summary */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">Destinatario</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditContacts}
              className="h-auto p-0 text-xs text-primary hover:text-primary/80"
            >
              <Edit className="size-3 mr-1" />
              Editar
            </Button>
          </div>
          <div className="text-sm space-y-1">
            <div className="font-medium">{recipient.name || "Sin nombre"}</div>
            <div className="text-muted-foreground">{recipient.phone || "Sin teléfono"}</div>
            {recipient.address.address1 && (
              <div className="text-muted-foreground text-xs">
                {recipient.address.address1}
                {recipient.address.address2 && `, ${recipient.address.address2}`}
                <br />
                {recipient.address.zip} {recipient.address.city}, {recipient.address.province}
                <br />
                {recipient.address.country}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
