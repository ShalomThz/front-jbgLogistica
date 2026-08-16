import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@contexts/shared/shadcn";
import { ZonePriceCellDialog } from "./ZonePriceCellDialog";
import { useZonePriceMatrix } from "@contexts/pricing/infrastructure/hooks/tariffs/useZonePriceMatrix";
import type { SetZonePriceRequest } from "@contexts/pricing/application/ZonePriceMatrix";
import type { ServiceLevel } from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { pricingPolicies } from "@contexts/shared/domain/policies/pricing.policy";

interface CreateTariffButtonProps {
  zoneId: string;
  boxId: string;
  serviceLevel: ServiceLevel;
  onCreated?: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm";
  label?: string;
}

/**
 * Da de alta la tarifa que falta sin salir de la orden. Escribe la celda
 * completa —público y socio— igual que la pantalla de administración: crear
 * solo el precio que hace falta ahora dejaría la celda a medias.
 */
export function CreateTariffButton({
  zoneId,
  boxId,
  serviceLevel,
  onCreated,
  variant = "default",
  size = "sm",
  label = "Crear tarifa",
}: CreateTariffButtonProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { rows, zone, isLoading, setPrice, isSaving } = useZonePriceMatrix(
    open ? zoneId : undefined,
  );

  // La celda puede tener ya uno de los dos precios: el que falta suele ser el
  // de socio, porque la migración solo trajo los públicos. Hay que precargarlos
  // — el diálogo interpreta un campo vacío como "borrar este precio", así que
  // abrirlo en blanco y guardar eliminaría el que existía.
  const row = rows.find((r) => r.box.id === boxId);
  const cell = row?.cells.find((c) => c.serviceLevel === serviceLevel);

  const handleSave = async (data: SetZonePriceRequest) => {
    try {
      await setPrice(data);
      toast.success("Tarifa guardada");
      onCreated?.();
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  if (!user || !pricingPolicies.createTariff(user)) return null;

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={open && isLoading}
        onClick={() => setOpen(true)}
      >
        {open && isLoading ? (
          <Loader2 className="size-3.5 mr-1 animate-spin" />
        ) : (
          <Plus className="size-3.5 mr-1" />
        )}
        {label}
      </Button>
      {/* Se espera a la matriz antes de abrir: con los precios todavía sin
          cargar, el diálogo mostraría los campos vacíos y guardar borraría. */}
      {open && !isLoading && (
        <ZonePriceCellDialog
          open
          onClose={() => setOpen(false)}
          onSave={handleSave}
          zoneId={zoneId}
          zoneName={zone?.name}
          boxId={boxId}
          boxName={row?.box.name}
          serviceLevel={serviceLevel}
          publicPrice={cell?.public?.price ?? null}
          partnerPrice={cell?.partner?.price ?? null}
          isLoading={isSaving}
        />
      )}
    </>
  );
}
