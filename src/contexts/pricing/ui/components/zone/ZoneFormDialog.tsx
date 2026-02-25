import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button, Input, Label, Textarea } from "@contexts/shared/shadcn";
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
          <DialogDescription>{isEdit ? "Modifica los datos de la zona." : "Ingresa los datos de la nueva zona."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
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
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
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
