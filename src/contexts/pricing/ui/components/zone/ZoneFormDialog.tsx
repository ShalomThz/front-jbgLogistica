import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button, Input, Label, Textarea } from "@/shared/shadcn";
import type { ZonePrimitives } from "../../../domain";

type CreateZoneData = Omit<ZonePrimitives, "id" | "createdAt" | "updatedAt">;

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateZoneData) => void;
  zone?: ZonePrimitives | null;
  isLoading?: boolean;
}

export const ZoneFormDialog = ({ open, onClose, onSave, zone, isLoading }: Props) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setName(zone?.name ?? "");
      setDescription(zone?.description ?? "");
    }
  }, [open, zone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description });
  };

  const isEdit = !!zone;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Zona" : "Crear Zona"}</DialogTitle>
          <DialogDescription>{isEdit ? "Modifica los datos de la zona." : "Ingresa los datos de la nueva zona."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Zona Centro" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} placeholder="Descripción de la zona..." rows={3} />
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
