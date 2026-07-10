import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@contexts/shared/shadcn";
import { TariffFormDialog } from "./TariffFormDialog";
import { useTariffs } from "@contexts/pricing/infrastructure/hooks/tariffs/useTariffs";
import type { CreateTariffRequestPrimitives } from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { pricingPolicies } from "@contexts/shared/domain/policies/pricing.policy";

interface CreateTariffButtonProps {
  zoneId: string;
  destinationCountry: string;
  boxId: string;
  /** Default currency for the new tariff (e.g. the order's costs currency). */
  priceCurrency?: string;
  onCreated?: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm";
  label?: string;
}

export function CreateTariffButton({
  zoneId,
  destinationCountry,
  boxId,
  priceCurrency,
  onCreated,
  variant = "default",
  size = "sm",
  label = "Crear tarifa",
}: CreateTariffButtonProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  // enabled:false — only need the mutation, don't fire the list query.
  const { createTariff, isCreating } = useTariffs({ enabled: false });

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

  if (!user || !pricingPolicies.createTariff(user)) return null;

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
        initialValues={{
          originZoneId: zoneId,
          destinationCountry,
          boxId,
          ...(priceCurrency && { price: { amount: 0, currency: priceCurrency } }),
        }}
        isLoading={isCreating}
      />
    </>
  );
}
