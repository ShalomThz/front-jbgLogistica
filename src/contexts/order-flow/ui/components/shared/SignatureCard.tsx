import { Card, CardContent } from "@contexts/shared/shadcn";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { SignaturePad } from "@contexts/shared/ui/components/SignaturePad";
import type { BaseOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";

interface SignatureCardProps {
  collapsible?: boolean;
}

export function SignatureCard({ collapsible = true }: SignatureCardProps) {
  const { control } = useFormContext<BaseOrderFormValues>();
  const [open, setOpen] = useState(true);

  return (
    <Card>
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between px-6 py-4 text-left"
        >
          <span className="text-sm font-semibold">Firma del cliente</span>
          <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      ) : (
        <div className="px-6 py-4">
          <span className="text-sm font-semibold">Firma del cliente</span>
          <p className="text-sm text-muted-foreground">
            Firma opcional del cliente aceptando las condiciones del envío.
          </p>
        </div>
      )}
      {open && (
        <CardContent className="pt-0 pb-4">
          <Controller
            control={control}
            name="customerSignature"
            render={({ field }) => (
              <SignaturePad onSignatureChange={field.onChange} />
            )}
          />
        </CardContent>
      )}
    </Card>
  );
}
