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
import { AlertTriangle, Ban, Loader2, PackageCheck } from "lucide-react";

export type FulfillmentPhase = "selecting" | "fulfilling";

const PHASE_COPY: Record<
  FulfillmentPhase,
  { title: string; description: string }
> = {
  selecting: {
    title: "Creando envío…",
    description: "Registrando el proveedor y la tarifa seleccionada.",
  },
  fulfilling: {
    title: "Generando guía…",
    description: "Esto puede tardar unos segundos.",
  },
};

interface FulfillmentLoadingDialogProps {
  open: boolean;
  phase: FulfillmentPhase;
  error: string | null;
  /** Offer a manual cancel (the creation has been waiting for a while). */
  canCancel?: boolean;
  onCancel?: () => void;
  /** The error state is a user-initiated cancellation, not a failure. */
  cancelled?: boolean;
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
  canCancel,
  onCancel,
  cancelled,
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
            <StatusBadge
              icon={cancelled ? Ban : AlertTriangle}
              variant={cancelled ? "neutral" : "error"}
            />
            <DialogHeader className="space-y-1.5 sm:text-center">
              <DialogTitle className="text-center">
                {cancelled
                  ? "Creación cancelada"
                  : "No se pudo generar la guía"}
              </DialogTitle>
              <DialogDescription className="text-center">
                {cancelled
                  ? "Cancelaste la creación de la guía. Puedes reintentar o elegir otra paquetería."
                  : "Hubo un problema al generar la guía con la paquetería. Puedes volver a intentarlo o elegir otra paquetería."}
              </DialogDescription>
            </DialogHeader>
            {!cancelled && (
              <p className="w-full break-words rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
                {error}
              </p>
            )}
            <DialogFooter className="w-full gap-2 sm:justify-center">
              <Button variant="outline" onClick={onChangeCarrier}>
                Elegir otra paquetería
              </Button>
              <Button onClick={onRetry}>Reintentar</Button>
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

            {canCancel && (
              <div className="w-full space-y-3 border-t pt-4">
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>
                    La paquetería parece tener problemas para crear el envío.
                    Después de elegir otra paquetería, se recomienda verificar la
                    cancelación de este envío con esta paquetería en Skydropx.
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onCancel}
                >
                  Cancelar creación
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
