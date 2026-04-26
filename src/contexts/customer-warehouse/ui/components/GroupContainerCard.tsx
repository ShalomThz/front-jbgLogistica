import { useState } from "react";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { Button } from "@contexts/shared/shadcn";
import { ChevronDown, ChevronUp, Package } from "lucide-react";
import type { PackageListViewPrimitives } from "@/contexts/warehouse/domain/WarehousePackageSchema";
import { PackageCard, STATUS_CONFIG } from "./PackageCard";

interface GroupContainerCardProps {
  groupKey: string;
  groupItems: PackageListViewPrimitives[];
  invoiceLabel?: string;
  onEditGroup: () => void;
  onCardClick: (pkg: PackageListViewPrimitives) => void;
}

export const GroupContainerCard = ({
  groupKey,
  groupItems,
  invoiceLabel,
  onEditGroup,
  onCardClick,
}: GroupContainerCardProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const allSameStatus = groupItems.every((p) => p.status === groupItems[0].status);
  const groupStatus = allSameStatus ? groupItems[0].status : null;
  const config = groupStatus ? STATUS_CONFIG[groupStatus] : null;
  const label = invoiceLabel ?? `Grupo ${groupKey.slice(0, 6).toUpperCase()}`;

  return (
    <div className="rounded-xl border border-dashed bg-muted/20 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          className="flex items-center gap-2 text-left hover:opacity-70 transition-opacity min-w-0"
          onClick={() => setIsOpen((v) => !v)}
        >
          {isOpen ? (
            <ChevronUp className="size-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground shrink-0" />
          )}
          <Package className="size-4 text-muted-foreground shrink-0" />
          <span className="font-mono font-semibold text-sm truncate">{label}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            · {groupItems.length} paquete{groupItems.length !== 1 ? "s" : ""}
          </span>
          {config && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
                config.badgeClass,
              )}
            >
              {config.label}
            </span>
          )}
        </button>

        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs shrink-0"
          onClick={onEditGroup}
        >
          Editar grupo
        </Button>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-1">
          {groupItems.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              selectionMode={false}
              isSelected={false}
              isSelectable={false}
              onSelect={() => {}}
              onClick={() => onCardClick(pkg)}
              isCreatingPackageGroup={false}
            />
          ))}
        </div>
      )}
    </div>
  );
};
