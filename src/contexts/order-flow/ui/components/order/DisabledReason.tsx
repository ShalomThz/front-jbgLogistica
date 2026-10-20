import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@contexts/shared/shadcn";
import type { ReactNode } from "react";

/** Por qué no se puede completar, editar ni cancelar mientras tanto. */
export const LABEL_PENDING_REASON =
  "Espera a que la paquetería termine de generar la guía.";

/** Por qué el agente ya no edita su orden: HQ eligió la paquetería. */
export const SALE_PROCESSED_REASON =
  'HQ ya procesó la venta: los cambios se hacen desde "Completar venta".';

/**
 * Dice al pasar el mouse por qué una acción está desactivada. Un botón
 * desactivado no recibe el mouse, así que el aviso va en un envoltorio. Sin
 * `reason`, deja la acción tal cual.
 */
export function DisabledReason({
  reason,
  className = "inline-flex",
  children,
}: {
  reason: string | null;
  className?: string;
  children: ReactNode;
}) {
  if (!reason) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className={className}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}
