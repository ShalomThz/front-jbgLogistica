import type { UseFormReturn } from "react-hook-form";
import type { HQOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { SignaturePad } from "@contexts/shared/ui/components/SignaturePad";
import { Button } from "../../../../shared/shadcn";
 
interface HQSignatureStepProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: UseFormReturn<HQOrderFormValues, any, undefined>;
    onComplete: () => Promise<void>;
    isCompleting: boolean;
    onBack: () => void;
}

export function HQSignatureStep({
    form,
    onComplete,
    isCompleting,
    onBack,
}: HQSignatureStepProps) {
    const customerSignature = form.watch("customerSignature");

    return (
        <div className="space-y-6">
            <div className="bg-muted/30 p-6 rounded-lg border">
                <h3 className="text-lg font-medium mb-4">
                    Firma del Cliente (Opcional)
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Si el cliente está presente, pide que firme en el recuadro inferior antes
                    de completar la orden.
                </p>

                <div className="border bg-white rounded-md overflow-hidden aspect-video relative max-w-2xl">
                    <SignaturePad
                        onSignatureChange={(sig) => form.setValue("customerSignature", sig)}
                    />
                    {!customerSignature && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                            <span className="text-2xl font-semibold italic text-slate-400 rotate-[-15deg] select-none">
                                Firma aquí
                            </span>
                        </div>
                    )}
                </div>
                <div className="mt-2 flex justify-end">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => form.setValue("customerSignature", null)}
                        disabled={!customerSignature}
                    >
                        Limpiar firma
                    </Button>
                </div>
            </div>

            <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={onBack}>
                    Volver a cotización
                </Button>
                <Button onClick={onComplete} disabled={isCompleting}>
                    {isCompleting ? "Guardando..." : "Completar Orden"}
                </Button>
            </div>
        </div>
    );
}
