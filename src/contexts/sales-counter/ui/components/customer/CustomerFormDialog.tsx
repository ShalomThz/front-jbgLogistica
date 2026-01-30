import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/shadcn";
import type { Customer, CustomerStatus } from "./CustomerDetailDialog";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Customer, "id" | "totalOrders" | "createdAt">) => void;
  customer?: Customer | null;
}

export const CustomerFormDialog = ({ open, onClose, onSave, customer }: Props) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<CustomerStatus>("ACTIVE");

  useEffect(() => {
    if (open) {
      setName(customer?.name ?? "");
      setPhone(customer?.phone ?? "");
      setEmail(customer?.email ?? "");
      setStatus(customer?.status ?? "ACTIVE");
    }
  }, [open, customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, phone, email, status });
  };

  const isEdit = !!customer;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Cliente" : "Crear Cliente"}</DialogTitle>
          <DialogDescription>{isEdit ? "Modifica los datos del cliente." : "Ingresa los datos del nuevo cliente."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as CustomerStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="INACTIVE">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
