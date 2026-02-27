import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@contexts/shared/shadcn";
import { useFormContext } from "react-hook-form";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { ContactColumn } from "./ContactColumn";

export function PartnerContactStep() {
  const { register, formState: { errors } } = useFormContext<NewOrderFormValues>();

  return (
    <>
      <Card className="mb-6 shadow-md shadow-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Información de la Orden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-1">
            <Label htmlFor="partner-number">Número de Socio/Partner *</Label>
            <Input
              id="partner-number"
              aria-invalid={!!errors.orderData?.partnerOrderNumber}
              placeholder="Ej: PART-567890"
              {...register("orderData.partnerOrderNumber")}
            />
            {errors.orderData?.partnerOrderNumber && (
              <p className="text-sm text-destructive">{errors.orderData.partnerOrderNumber.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContactColumn fieldPrefix="sender" title="Remitente" />
        <ContactColumn fieldPrefix="recipient" title="Destinatario" />
      </div>
    </>
  );
}
