import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@contexts/shared/shadcn";
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
    description:
      "Verificando la creación del envío y obteniendo la guía con la paquetería. Esto puede tardar unos segundos.",
  },
};

interface FulfillmentLoadingDialogProps {
  open: boolean;
  phase: FulfillmentPhase;
  error: string | null;
  /** Carrier creation sub-status (e.g. "Generando la guía…"), live. */
  providerStatus?: string | null;
  /** Offer a manual cancel (carrier stalled in creation_waiting). */
  canCancel?: boolean;
  onCancel?: () => void;
  /** The error state is a user-initiated cancellation, not a failure. */
  cancelled?: boolean;
  onRetry: () => void;
  onChangeCarrier: () => void;
}

export function FulfillmentLoadingDialog({
  open,
  phase,
  error,
  providerStatus,
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
          <>
            <DialogHeader>
              <DialogTitle
                className={`flex items-center gap-2 ${cancelled ? "" : "text-destructive"}`}
              >
                {cancelled ? (
                  <Ban className="size-5" />
                ) : (
                  <AlertTriangle className="size-5" />
                )}
                {cancelled ? "Creación cancelada" : "No se pudo generar la guía"}
              </DialogTitle>
              <DialogDescription>
                {cancelled
                  ? "Cancelaste la creación de la guía. Puedes reintentar o elegir otra paquetería."
                  : "Hubo un problema al generar la guía con la paquetería. Puedes volver a intentarlo o elegir otra paquetería."}
              </DialogDescription>
            </DialogHeader>
            {!cancelled && (
              <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground break-words">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={onChangeCarrier}>
                Elegir otra paquetería
              </Button>
              <Button onClick={onRetry}>Reintentar</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Loader2 className="size-5 animate-spin" />
                {copy.title}
              </DialogTitle>
              <DialogDescription>{copy.description}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <PackageCheck className="size-10 text-muted-foreground" />
              {providerStatus && (
                <p className="text-sm font-medium">{providerStatus}</p>
              )}
              <p className="text-sm text-muted-foreground">
                No cierres esta ventana.
              </p>
            </div>
            {canCancel && (
              <DialogFooter>
                <Button variant="outline" onClick={onCancel}>
                  Cancelar creación
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
