import { Card, CardContent, Label, Textarea } from "@contexts/shared/shadcn";
import { useFormContext } from "react-hook-form";
import type { BaseOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";

/**
 * La nota que se imprime en la factura, bajo "Comentarios e instrucciones
 * especiales".
 *
 * Vive junto a `SignatureCard` y con su misma forma porque son lo mismo: los
 * dos campos del formulario que no significan nada para la orden y existen solo
 * para el papel. Y como el papel es el mismo para HQ y para el socio, los dos
 * pasos de cobro montan esta card.
 *
 * Vacía no imprime nada — ni la nota ni un encabezado vacío.
 */
export function InvoiceNotesCard() {
  const { register } = useFormContext<BaseOrderFormValues>();

  return (
    <Card>
      <div className="px-6 py-4">
        <span className="text-sm font-semibold">Nota para la factura</span>
        <p className="text-sm text-muted-foreground">
          Opcional. Se imprime en la factura; si la dejas vacía no aparece.
        </p>
      </div>
      <CardContent className="pt-0 pb-4">
        <Label htmlFor="invoice-notes" className="sr-only">
          Nota para la factura
        </Label>
        <Textarea
          id="invoice-notes"
          rows={3}
          placeholder="Instrucciones especiales, referencias del cliente, aclaraciones del cobro…"
          {...register("notes")}
        />
      </CardContent>
    </Card>
  );
}
