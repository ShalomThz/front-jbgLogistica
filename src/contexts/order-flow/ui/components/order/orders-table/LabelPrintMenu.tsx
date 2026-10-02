import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { shippingPolicies } from "@contexts/shared/domain/policies/shipping.policy";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@contexts/shared/shadcn";
import {
  availableLabelOptionsByGroup,
  type LabelSource,
} from "@contexts/shipping/ui/labels/labelOptions";
import { Printer } from "lucide-react";

interface Props {
  order: OrderListView;
  /** `cargo` es la etiqueta de JBG; `agente`, la del socio. */
  group: "cargo" | "agente";
  /** Lo que se lee al pasar el mouse: es lo que distingue los dos botones,
   * junto con la columna donde viven. Antes los separaba el color. */
  title: string;
  downloadingLabel: string | null;
  onPrintLabel: (order: OrderListView, source: LabelSource) => void;
}

/** Impresión de etiquetas de una orden, igual para el grupo cargo y el agente. */
export const LabelPrintMenu = ({
  order,
  group,
  title,
  downloadingLabel,
  onPrintLabel,
}: Props) => {
  const { user } = useAuth();
  // Sin el permiso el back rechaza la descarga: el botón solo confundiría.
  if (!user || !shippingPolicies.viewLabel(user)) return null;
  if (!order.shipment?.label) return null;

  const options = availableLabelOptionsByGroup(
    order.shipment,
    order,
    group,
    user.store.type,
  );
  // El agente no ve las de JBG: sin opciones, ni la impresora.
  if (options.length === 0) return null;

  const isDownloading = downloadingLabel === order.id;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
          disabled={isDownloading}
          title={title}
          onClick={(e) => e.stopPropagation()}
        >
          <Printer className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        {options.map((option) => (
          <DropdownMenuItem
            key={option.id}
            className={option.className}
            disabled={isDownloading}
            onClick={() => onPrintLabel(order, option.source)}
          >
            <Printer className="size-4" />
            Imprimir {option.title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
