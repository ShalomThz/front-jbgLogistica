import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@contexts/shared/shadcn";
import { Columns3, RotateCcw } from "lucide-react";
import type { OrderColumn } from "./orderTableColumns";

interface Props {
  /** Las que se pueden ofrecer: ya filtradas por permiso. */
  columns: OrderColumn[];
  isHidden: (columnId: string) => boolean;
  hiddenCount: number;
  onToggle: (columnId: string) => void;
  onShowAll: () => void;
}

export const OrderColumnsMenu = ({
  columns,
  isHidden,
  hiddenCount,
  onToggle,
  onShowAll,
}: Props) => {
  // Las fijas no se ofrecen: sin ellas no queda forma de operar la fila.
  const toggleable = columns.filter((column) => !column.fixed);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Columns3 className="size-4" />
          Columnas
          {hiddenCount > 0 && (
            <span className="text-xs text-muted-foreground">
              ({hiddenCount} oculta{hiddenCount !== 1 ? "s" : ""})
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {toggleable.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={!isHidden(column.id)}
            // El menú se queda abierto: elegir columnas es tildar varias, y
            // cerrarse en cada clic obliga a reabrirlo una vez por columna.
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={() => onToggle(column.id)}
          >
            {column.label}
          </DropdownMenuCheckboxItem>
        ))}
        {hiddenCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onShowAll}>
              <RotateCcw className="size-4" />
              Mostrar todas
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
