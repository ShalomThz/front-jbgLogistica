import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@contexts/shared/shadcn";
import { AlertTriangle, Loader2, PackageCheck } from "lucide-react";

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
  onRetry: () => void;
  onChangeCarrier: () => void;
}

export function FulfillmentLoadingDialog({
  open,
  phase,
  error,
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
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-5" />
                No se pudo generar la guía
              </DialogTitle>
              <DialogDescription>
                Hubo un problema al generar la guía con la paquetería. Puedes
                volver a intentarlo o elegir otra paquetería.
              </DialogDescription>
            </DialogHeader>
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground break-words">
              {error}
            </p>
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
              <p className="text-sm text-muted-foreground">
                No cierres esta ventana.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
