import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@contexts/shared/shadcn";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { OrderType } from "@contexts/sales/domain/schemas/order/Order";
import { ContactColumn } from "./ContactColumn";

export function ContactStep() {
  const { register, control, formState: { errors } } = useFormContext<NewOrderFormValues>();

  const orderType = useWatch<NewOrderFormValues, "orderType">({ name: "orderType" });

  return (
    <>
      {/* Order Information */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Información de la Orden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* Order Type Selector */}
          <div>
            <Label className="text-sm mb-2 block">Tipo de orden</Label>
            <Controller
              control={control}
              name="orderType"
              render={({ field }) => (
                <div className="flex gap-2">
                  {(["HQ", "PARTNER"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                        field.value === type
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-input text-muted-foreground hover:bg-accent"
                      }`}
                      onClick={() => field.onChange(type as OrderType)}
                    >
                      {type === "HQ" ? "HQ (Matriz)" : "Partner (Socio)"}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Order References */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orderType === "HQ" && (
              <div>
                <Label htmlFor="order-number">Número de Orden</Label>
                <Input
                  id="order-number"
                  placeholder="Ej: ORD-001234"
                  {...register("orderData.orderNumber")}
                />
              </div>
            )}
            <div>
              <Label htmlFor="partner-number">
                Número de Socio/Partner {orderType === "PARTNER" && "*"}
              </Label>
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
