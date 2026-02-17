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
} from "@contexts/shared/shadcn";
import type { CustomerPrimitives } from "@contexts/sales/domain/schemas/customer/Customer";
import type { AddressPrimitives } from "@contexts/shared/domain/schemas/address/Address";
import { useStores } from "@contexts/iam/infrastructure/hooks/stores/useStores";

const COUNTRIES = [
  { code: "MX", name: "México" },
  { code: "US", name: "Estados Unidos" },
  { code: "GT", name: "Guatemala" },
  { code: "CA", name: "Canadá" },
  { code: "ES", name: "España" },
  { code: "CO", name: "Colombia" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<CustomerPrimitives, "id" | "createdAt" | "updatedAt">) => void;
  customer?: CustomerPrimitives | null;
  isLoading?: boolean;
}

const emptyAddress: AddressPrimitives = {
  address1: "",
  address2: "",
  city: "",
  province: "",
  zip: "",
  country: "MX",
  reference: "",
  geolocation: { latitude: 0, longitude: 0, placeId: null },
};

export const CustomerFormDialog = ({ open, onClose, onSave, customer, isLoading }: Props) => {
  const { stores } = useStores({ page: 1, limit: 100 });

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [registeredByStoreId, setRegisteredByStoreId] = useState("");
  const [address, setAddress] = useState<AddressPrimitives>(emptyAddress);

  useEffect(() => {
    if (open) {
      if (customer) {
        setName(customer.name);
        setCompany(customer.company);
        setEmail(customer.email);
        setPhone(customer.phone);
        setRegisteredByStoreId(customer.registeredByStoreId);
        setAddress(customer.address);
      } else {
        setName("");
        setCompany("");
        setEmail("");
        setPhone("");
        setRegisteredByStoreId("");
        setAddress(emptyAddress);
      }
    }
  }, [open, customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      company,
      email,
      phone,
      registeredByStoreId,
      address,
    });
  };

  const updateAddress = (field: keyof AddressPrimitives, value: string | number) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const updateGeolocation = (field: "latitude" | "longitude", value: number) => {
    setAddress((prev) => ({
      ...prev,
      geolocation: { ...prev.geolocation, [field]: value },
    }));
  };

  const isEdit = !!customer;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Cliente" : "Crear Cliente"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifica los datos del cliente." : "Ingresa los datos del nuevo cliente."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa *</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tienda</Label>
            <Select value={registeredByStoreId} onValueChange={setRegisteredByStoreId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tienda" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 rounded-md border p-4">
            <h4 className="text-sm font-semibold">Dirección</h4>
            <div className="space-y-2">
              <Label htmlFor="address1">Dirección *</Label>
              <Input
                id="address1"
                value={address.address1}
                onChange={(e) => updateAddress("address1", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address2">Dirección 2</Label>
              <Input
                id="address2"
                value={address.address2}
                onChange={(e) => updateAddress("address2", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad *</Label>
                <Input
                  id="city"
                  value={address.city}
                  onChange={(e) => updateAddress("city", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Provincia/Estado *</Label>
                <Input
                  id="province"
                  value={address.province}
                  onChange={(e) => updateAddress("province", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="zip">Código Postal *</Label>
                <Input
                  id="zip"
                  value={address.zip}
                  onChange={(e) => updateAddress("zip", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>País *</Label>
                <Select value={address.country} onValueChange={(v) => updateAddress("country", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar país" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Referencia</Label>
              <Input
                id="reference"
                value={address.reference}
                onChange={(e) => updateAddress("reference", e.target.value)}
                placeholder="Ej: Casa azul, junto a la tienda"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitud</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={address.geolocation.latitude}
                  onChange={(e) => updateGeolocation("latitude", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitud</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={address.geolocation.longitude}
                  onChange={(e) => updateGeolocation("longitude", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
