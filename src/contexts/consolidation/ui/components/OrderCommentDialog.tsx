import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from "@contexts/shared/shadcn";

const MAX_LENGTH = 500;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Folio de la orden, para que se sepa a qué renglón se le escribe. */
  orderLabel: string;
  initialValue: string;
  /** Deja el texto como borrador del renglón; se persiste con "Guardar
   * revisión", junto con verificador y verificación. */
  onSubmit: (value: string) => void;
}

/**
 * Comentario de revisión de una orden dentro del consolidado. El texto vive en
 * estado propio mientras el modal está abierto: "Cancelar" lo descarta sin
 * tocar el borrador de la tabla. Se monta con `key` por renglón, así que cada
 * apertura arranca del valor actual.
 */
export const OrderCommentDialog = ({
  open,
  onOpenChange,
  orderLabel,
  initialValue,
  onSubmit,
}: Props) => {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = () => {
    onSubmit(value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialValue.trim() ? "Editar comentario" : "Agregar comentario"}</DialogTitle>
          <DialogDescription>
            Orden <span className="font-mono font-medium text-foreground">{orderLabel}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          <Textarea
            autoFocus
            rows={4}
            maxLength={MAX_LENGTH}
            value={value}
            placeholder="Qué se revisó, qué faltó, qué hay que atender..."
            className="resize-none"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
          />
          <p className="text-right text-xs text-muted-foreground tabular-nums">
            {value.length}/{MAX_LENGTH}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Listo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
