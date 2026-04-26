import { cn } from "@contexts/shared/shadcn/lib/utils";
import { Checkbox } from "@contexts/shared/shadcn";
import { Box, Images, Package } from "lucide-react";
import type {
  PackageListViewPrimitives,
  WarehousePackageStatus,
} from "@/contexts/warehouse/domain/WarehousePackageSchema";

export const STATUS_CONFIG: Record<
  WarehousePackageStatus,
  { label: string; badgeClass: string; borderClass: string }
> = {
  WAREHOUSE: {
    label: "En bodega",
    badgeClass: "bg-blue-100 text-blue-700 border border-blue-200",
    borderClass: "border-l-blue-400",
  },
  AUTHORIZED: {
    label: "Autorizado",
    badgeClass: "bg-blue-100 text-blue-700 border border-blue-200",
    borderClass: "border-l-blue-400",
  },
  SHIPPED: {
    label: "Enviado",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    borderClass: "border-l-emerald-400",
  },
  DELIVERED: {
    label: "Entregado",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    borderClass: "border-l-emerald-400",
  },
  REPACKED: {
    label: "Reempacado",
    badgeClass: "bg-gray-100 text-gray-600 border border-gray-200",
    borderClass: "border-l-gray-300",
  },
};

interface PackageCardProps {
  pkg: PackageListViewPrimitives;
  selectionMode: boolean;
  isSelected: boolean;
  isSelectable: boolean;
  onSelect: (checked: boolean) => void;
  onClick: () => void;
  isCreatingPackageGroup: boolean;
}

export const PackageCard = ({
  pkg,
  selectionMode,
  isSelected,
  isSelectable,
  onSelect,
  onClick,
  isCreatingPackageGroup,
}: PackageCardProps) => {
  const config = STATUS_CONFIG[pkg.status];
  const totalWeight = pkg.boxes.reduce((acc, b) => acc + Number(b.weight.value), 0);
  const weightUnit = pkg.boxes[0]?.weight.unit ?? "lb";
  const boxLabel = pkg.boxes.length === 1 ? "1 caja" : `${pkg.boxes.length} cajas`;
  const photo = pkg.photos[0];

  const canSelect = selectionMode && isSelectable;
  const isDisabled = selectionMode && !isSelectable;

  const handleClick = () => {
    if (selectionMode) {
      if (canSelect) onSelect(!isSelected);
    } else {
      onClick();
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden transition-all duration-150",
        "border-l-4",
        config.borderClass,
        !selectionMode && "cursor-pointer hover:shadow-md hover:border-muted-foreground/40",
        canSelect && !isSelected && "cursor-pointer hover:ring-2 hover:ring-primary/30",
        canSelect && isSelected && "ring-2 ring-primary cursor-pointer",
        isDisabled && "opacity-40 cursor-not-allowed pointer-events-none",
      )}
      onClick={handleClick}
    >
      {canSelect && (
        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={(v) => onSelect(v === true)}
            disabled={isCreatingPackageGroup}
            className="h-5 w-5 border-2 bg-background shadow"
          />
        </div>
      )}

      <div className="relative h-36 w-full bg-muted/50">
        {photo ? (
          <img
            src={photo}
            alt="Foto del paquete"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="size-14 text-muted-foreground/25" />
          </div>
        )}

        <div className="absolute bottom-2 left-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              config.badgeClass,
            )}
          >
            {config.label}
          </span>
        </div>

        {pkg.photos.length > 1 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
            <Images className="size-2.5" />
            {pkg.photos.length}
          </div>
        )}
      </div>

      <div className="p-3 space-y-1.5">
        <p className="font-mono text-sm font-semibold truncate leading-tight">
          {pkg.officialInvoice ?? `#${pkg.id.slice(0, 8)}`}
        </p>
        <p className="text-xs text-muted-foreground truncate">{pkg.provider.name}</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Box className="size-3 shrink-0" />
          <span>
            {boxLabel} · {totalWeight.toFixed(1)} {weightUnit}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(pkg.createdAt).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
};
