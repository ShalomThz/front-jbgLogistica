import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@contexts/shared/shadcn";
import { TariffFormDialog } from "./TariffFormDialog";
import { useTariffs } from "@contexts/pricing/infrastructure/hooks/tariffs/useTariffs";
import type { CreateTariffRequestPrimitives } from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";

interface CreateTariffButtonProps {
  zoneId: string;
  destinationCountry: string;
  boxId: string;
  onCreated?: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm";
  label?: string;
}

export function CreateTariffButton({
  zoneId,
  destinationCountry,
  boxId,
  onCreated,
  variant = "default",
  size = "sm",
  label = "Crear tarifa",
}: CreateTariffButtonProps) {
  const [open, setOpen] = useState(false);
  const { createTariff, isCreating } = useTariffs();

  const handleSave = async (data: CreateTariffRequestPrimitives) => {
    try {
      await createTariff(data);
      setOpen(false);
      toast.success("Tarifa creada");
      onCreated?.();
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  return (
    <>
      <Button type="button" variant={variant} size={size} onClick={() => setOpen(true)}>
        <Plus className="size-3.5 mr-1" />
        {label}
      </Button>
      <TariffFormDialog
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        initialValues={{ originZoneId: zoneId, destinationCountry, boxId }}
        isLoading={isCreating}
      />
    </>
  );
}
