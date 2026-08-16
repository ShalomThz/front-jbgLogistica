import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button, Input, Label, Textarea } from "@contexts/shared/shadcn";
import { CountrySelect } from "@contexts/shared/ui/components/CountrySelect";
import { AlignLeft, Globe, Map, Tag } from "lucide-react";
import {
  createZoneRequestSchema,
  type CreateZoneRequestPrimitives,
} from "@contexts/pricing/domain/schemas/zone/Zone";
import type { ZonePrimitives } from "@contexts/pricing/domain/schemas/zone/Zone";

type FormInput = z.input<typeof createZoneRequestSchema>;

function getDefaults(zone?: ZonePrimitives | null): FormInput {
  return {
    name: zone?.name ?? "",
    description: zone?.description ?? "",
    country: zone?.country ?? "MX",
    state: zone?.state ?? "",
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateZoneRequestPrimitives) => void;
  zone?: ZonePrimitives | null;
  isLoading?: boolean;
}

export const ZoneFormDialog = ({ open, onClose, onSave, zone, isLoading }: Props) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(createZoneRequestSchema),
    defaultValues: getDefaults(zone),
  });

  useEffect(() => {
    if (open) reset(getDefaults(zone));
  }, [open, zone, reset]);

  const onSubmit = handleSubmit((values) => onSave(values as CreateZoneRequestPrimitives));

  const isEdit = !!zone;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Zona" : "Crear Zona"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifica los datos de la zona."
              : "Una zona es el territorio donde se recoge la caja. Un estado puede dividirse en varias."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-1.5">
              <Tag className="size-3.5" />
              Nombre
            </Label>
            <Input
              id="name"
              placeholder="Ej: Zona Centro"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="country" className="flex items-center gap-1.5">
                <Globe className="size-3.5" />
                País
              </Label>
              <Controller
                control={control}
                name="country"
                render={({ field }) => (
                  <CountrySelect value={field.value} onChange={field.onChange} />
                )}
              />
              {errors.country && (
                <p className="text-xs text-destructive">{errors.country.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="flex items-center gap-1.5">
                <Map className="size-3.5" />
                Estado
              </Label>
              <Input
                id="state"
                placeholder="Ej: Nuevo León"
                aria-invalid={!!errors.state}
                {...register("state")}
              />
              {errors.state && (
                <p className="text-xs text-destructive">{errors.state.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-1.5">
              <AlignLeft className="size-3.5" />
              Descripción
            </Label>
            <Textarea
              id="description"
              placeholder="Descripción de la zona..."
              rows={3}
              aria-invalid={!!errors.description}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
