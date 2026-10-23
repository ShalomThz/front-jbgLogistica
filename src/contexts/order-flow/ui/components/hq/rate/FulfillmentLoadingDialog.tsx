import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@contexts/shared/shadcn";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { AlertTriangle, Loader2, PackageCheck } from "lucide-react";

export type FulfillmentPhase = "selecting" | "fulfilling";

/** Ya no se espera a la paquetería: los dos pasos son peticiones rápidas. */
const PHASE_COPY: Record<
  FulfillmentPhase,
  { title: string; description: string }
> = {
  selecting: {
    title: "Registrando la venta…",
    description: "Guardando la tarifa, los datos de la orden y los abonos.",
  },
  fulfilling: {
    title: "Solicitando la guía…",
    description: "Esto tarda unos segundos.",
  },
};

interface FulfillmentLoadingDialogProps {
  open: boolean;
  phase: FulfillmentPhase;
  error: string | null;
  /** La paquetería rechazó la guía: con la misma tarifa daría lo mismo, así que
   * solo se ofrece elegir otra. */
  rejected?: boolean;
  onRetry: () => void;
  onChangeCarrier: () => void;
}

/** Centered icon "hero" with a state-tinted circular background. */
function StatusBadge({
  icon: Icon,
  variant,
  spin,
}: {
  icon: typeof Loader2;
  variant: "loading" | "error" | "neutral";
  spin?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex size-14 items-center justify-center rounded-full",
        variant === "loading" && "bg-primary/10 text-primary",
        variant === "error" && "bg-destructive/10 text-destructive",
        variant === "neutral" && "bg-muted text-muted-foreground",
      )}
    >
      <Icon className={cn("size-7", spin && "animate-spin")} />
    </div>
  );
}

export function FulfillmentLoadingDialog({
  open,
  phase,
  error,
  rejected = false,
  onRetry,
  onChangeCarrier,
}: FulfillmentLoadingDialogProps) {
  const copy = PHASE_COPY[phase];

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {error ? (
          <div className="flex flex-col items-center gap-4">
            <StatusBadge icon={AlertTriangle} variant="error" />
            <DialogHeader className="space-y-1.5 sm:text-center">
              {/* Si falló al pedir la guía, la venta y los abonos ya quedaron. */}
              <DialogTitle className="text-center">
                {phase === "fulfilling"
                  ? "La venta quedó registrada, pero no salió la guía"
                  : "No se pudo registrar la venta"}
              </DialogTitle>
              <DialogDescription className="text-center">
                {rejected
                  ? "La paquetería rechazó la guía con esta tarifa. Elige otra paquetería; lo que ya se registró no se repite."
                  : "Puedes volver a intentarlo o elegir otra paquetería. Lo que ya se registró no se repite."}
              </DialogDescription>
            </DialogHeader>
            <p className="w-full break-words rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
              {error}
            </p>
            <DialogFooter className="w-full gap-2 sm:justify-center">
              <Button variant="outline" onClick={onChangeCarrier}>
                Elegir otra paquetería
              </Button>
              {!rejected && <Button onClick={onRetry}>Reintentar</Button>}
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <StatusBadge icon={Loader2} variant="loading" spin />
            <DialogHeader className="space-y-1.5 sm:text-center">
              <DialogTitle className="text-center">{copy.title}</DialogTitle>
              <DialogDescription className="text-center">
                {copy.description}
              </DialogDescription>
            </DialogHeader>

            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <PackageCheck className="size-3.5" />
              No cierres esta ventana.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
