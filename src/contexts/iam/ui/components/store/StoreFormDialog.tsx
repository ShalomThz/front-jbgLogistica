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
import type {
  StorePrimitives,
  CreateStoreRequestPrimitives,
} from "@/contexts/iam/domain";
import { useZones } from "@/contexts/pricing/infrastructure/hooks";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateStoreRequestPrimitives) => void;
  store?: StorePrimitives | null;
  isLoading?: boolean;
}

export const StoreFormDialog = ({
  open,
  onClose,
  onSave,
  store,
  isLoading,
}: Props) => {
  const { zones, isLoading: isLoadingZones } = useZones();
  const [name, setName] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [phone, setPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("MX");
  const [reference, setReference] = useState("");

  useEffect(() => {
    if (open) {
      setName(store?.name ?? "");
      setZoneId(store?.zoneId ?? "");
      setPhone(store?.phone ?? "");
      setContactEmail(store?.contactEmail ?? "");
      setAddress1(store?.address.address1 ?? "");
      setAddress2(store?.address.address2 ?? "");
      setCity(store?.address.city ?? "");
      setProvince(store?.address.province ?? "");
      setZip(store?.address.zip ?? "");
      setCountry(store?.address.country ?? "MX");
      setReference(store?.address.reference ?? "");
    }
  }, [open, store]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      zoneId,
      phone,
      contactEmail,
      address: {
        address1,
        address2,
        city,
        province,
        zip,
        country,
        reference,
        geolocation: store?.address.geolocation ?? {
          latitude: 0,
          longitude: 0,
          placeId: null,
        },
      },
    });
  };

  const isEdit = !!store;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Tienda" : "Crear Tienda"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifica los datos de la tienda."
              : "Ingresa los datos de la nueva tienda."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Sucursal Centro"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Zona</Label>
              <Select value={zoneId} onValueChange={setZoneId} required disabled={isLoadingZones}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingZones ? "Cargando..." : "Seleccionar zona"} />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((z) => (
                    <SelectItem key={z.id} value={z.id}>
                      {z.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="5512345678"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email de contacto</Label>
            <Input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="tienda@ejemplo.com"
              required
            />
          </div>
          <div className="border-t pt-4 space-y-3">
            <h4 className="text-sm font-semibold">Dirección</h4>
            <div className="space-y-2">
              <Label htmlFor="address1">Dirección</Label>
              <Input
                id="address1"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                placeholder="Calle y número"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address2">Dirección 2 (opcional)</Label>
              <Input
                id="address2"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                placeholder="Colonia, interior, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Estado</Label>
                <Input
                  id="province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="zip">Código Postal</Label>
                <Input
                  id="zip"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>País</Label>
                <Select value={country} onValueChange={setCountry} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar país" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MX">México</SelectItem>
                    <SelectItem value="US">Estados Unidos</SelectItem>
                    <SelectItem value="GT">Guatemala</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Referencia (opcional)</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Entre calles, cerca de..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
