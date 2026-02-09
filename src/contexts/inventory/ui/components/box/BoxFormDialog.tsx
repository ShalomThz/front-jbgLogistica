import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/shadcn";
import type { BoxPrimitives, CreateBoxRequestPrimitives } from "../../../domain";

type DimensionUnit = "cm" | "in";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateBoxRequestPrimitives) => void;
  box?: BoxPrimitives | null;
  isLoading?: boolean;
}

export const BoxFormDialog = ({ open, onClose, onSave, box, isLoading }: Props) => {
  const [name, setName] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [unit, setUnit] = useState<DimensionUnit>("cm");
  const [stock, setStock] = useState("");

  useEffect(() => {
    if (open) {
      setName(box?.name ?? "");
      setLength(box?.dimensions.length?.toString() ?? "");
      setWidth(box?.dimensions.width?.toString() ?? "");
      setHeight(box?.dimensions.height?.toString() ?? "");
      setUnit((box?.dimensions.unit as DimensionUnit) ?? "cm");
      setStock(box?.stock?.toString() ?? "");
    }
  }, [open, box]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      dimensions: { length: Number(length), width: Number(width), height: Number(height), unit },
      stock: Number(stock),
    });
  };

  const isEdit = !!box;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Caja" : "Crear Caja"}</DialogTitle>
          <DialogDescription>{isEdit ? "Modifica los datos de la caja." : "Ingresa los datos de la nueva caja."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Caja Pequeña" required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="length">Largo</Label>
              <Input id="length" type="number" min="0.1" step="0.1" value={length} onChange={(e) => setLength(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="width">Ancho</Label>
              <Input id="width" type="number" min="0.1" step="0.1" value={width} onChange={(e) => setWidth(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Alto</Label>
              <Input id="height" type="number" min="0.1" step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as DimensionUnit)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cm">Centímetros</SelectItem>
                  <SelectItem value="in">Pulgadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" type="number" min="1" value={stock} onChange={(e) => setStock(e.target.value)} required />
            </div>
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
