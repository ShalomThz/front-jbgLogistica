import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/shadcn";
import type { WarehousePackagePrimitives, WarehousePackageStatus } from "../../../domain";
import { warehousePackageStatuses } from "../../../domain";

const STATUS_LABELS: Record<WarehousePackageStatus, string> = {
  WAREHOUSE: "En bodega",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  REPACKED: "Reempacado",
  AUTHORIZED: "Autorizado",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<WarehousePackagePrimitives, "id" | "createdAt" | "updatedAt">) => void;
  pkg?: WarehousePackagePrimitives | null;
}

export const WarehouseFormDialog = ({ open, onClose, onSave, pkg }: Props) => {
  const [customerId, setCustomerId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [officialInvoice, setOfficialInvoice] = useState("");
  const [providerId, setProviderId] = useState("");
  const [providerDeliveryPerson, setProviderDeliveryPerson] = useState("");
  const [boxId, setBoxId] = useState("");
  const [weightInKg, setWeightInKg] = useState<number>(0);
  const [packer, setPacker] = useState("");
  const [status, setStatus] = useState<WarehousePackageStatus>("WAREHOUSE");

  useEffect(() => {
    if (open) {
      if (pkg) {
        setCustomerId(pkg.customerId);
        setStoreId(pkg.storeId);
        setOfficialInvoice(pkg.officialInvoice);
        setProviderId(pkg.providerId);
        setProviderDeliveryPerson(pkg.providerDeliveryPerson);
        setBoxId(pkg.boxId);
        setWeightInKg(pkg.weightInKg);
        setPacker(pkg.packer);
        setStatus(pkg.status);
      } else {
        setCustomerId("");
        setStoreId("");
        setOfficialInvoice("");
        setProviderId("");
        setProviderDeliveryPerson("");
        setBoxId("");
        setWeightInKg(0);
        setPacker("");
        setStatus("WAREHOUSE");
      }
    }
  }, [open, pkg]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      customerId,
      storeId,
      officialInvoice,
      providerId,
      providerDeliveryPerson,
      boxId,
      weightInKg,
      packer,
      status,
    });
  };

  const isEdit = !!pkg;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Paquete" : "Registrar Paquete"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifica los datos del paquete." : "Ingresa los datos del nuevo paquete en bodega."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="officialInvoice">Factura oficial *</Label>
              <Input
                id="officialInvoice"
                value={officialInvoice}
                onChange={(e) => setOfficialInvoice(e.target.value)}
                placeholder="FAC-2025-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weightInKg">Peso (kg) *</Label>
              <Input
                id="weightInKg"
                type="number"
                step="0.01"
                min="0.01"
                value={weightInKg || ""}
                onChange={(e) => setWeightInKg(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerId">ID Cliente *</Label>
              <Input
                id="customerId"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeId">ID Tienda *</Label>
              <Input
                id="storeId"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="providerId">ID Proveedor *</Label>
              <Input
                id="providerId"
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="providerDeliveryPerson">Repartidor del proveedor *</Label>
              <Input
                id="providerDeliveryPerson"
                value={providerDeliveryPerson}
                onChange={(e) => setProviderDeliveryPerson(e.target.value)}
                placeholder="Nombre del repartidor"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="boxId">ID Caja *</Label>
            <Input
              id="boxId"
              value={boxId}
              onChange={(e) => setBoxId(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="packer">Empacador *</Label>
              <Input
                id="packer"
                value={packer}
                onChange={(e) => setPacker(e.target.value)}
                placeholder="Nombre del empacador"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as WarehousePackageStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {warehousePackageStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
