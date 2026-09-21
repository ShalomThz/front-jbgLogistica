import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@contexts/shared/shadcn";
import { Loader2, Mail, Send } from "lucide-react";

interface SendInvoiceEmailDialogProps {
  order: OrderListView | null;
  open: boolean;
  isSending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const SendInvoiceEmailDialog = ({
  order,
  open,
  isSending,
  onClose,
  onConfirm,
}: SendInvoiceEmailDialogProps) => {
  if (!order) return null;

  const email = order.origin.email;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && !isSending && onClose()}
    >
      <DialogContent
        className={isSending ? "sm:max-w-md [&>button]:hidden" : "sm:max-w-md"}
        onInteractOutside={(event) => isSending && event.preventDefault()}
        onEscapeKeyDown={(event) => isSending && event.preventDefault()}
      >
        {isSending ? (
          <div
            className="flex flex-col items-center gap-4 py-2"
            role="status"
            aria-live="polite"
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Loader2 className="size-7 animate-spin" />
            </div>
            <DialogHeader className="space-y-1.5 sm:text-center">
              <DialogTitle className="text-center">
                Enviando factura…
              </DialogTitle>
              <DialogDescription className="text-center">
                Estamos generando el PDF y enviándolo al correo del cliente.
              </DialogDescription>
            </DialogHeader>
            <RecipientEmail name={order.origin.name} email={email} />
            <p className="text-center text-xs text-muted-foreground">
              No cierres esta ventana ni vuelvas a intentar el envío.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Enviar factura por correo</DialogTitle>
              <DialogDescription>
                Confirma que la factura se enviará al cliente que originó la
                orden.
              </DialogDescription>
            </DialogHeader>
            <RecipientEmail name={order.origin.name} email={email} />
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={onConfirm} disabled={!email}>
                <Send className="size-4" />
                Enviar factura
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const RecipientEmail = ({
  name,
  email,
}: {
  name: string;
  email: string | null;
}) => (
  <div className="flex w-full items-start gap-3 rounded-md border bg-muted/40 p-3">
    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-background text-primary shadow-sm">
      <Mail className="size-4" />
    </div>
    <div className="min-w-0">
      <p className="text-sm font-medium">{name}</p>
      <p className="break-all text-sm text-muted-foreground">
        {email ?? "Sin correo electrónico"}
      </p>
    </div>
  </div>
);
