import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import type { HQSkydropxAddressItemResponse } from "@contexts/settings/domain/schemas/HQSkydropxAddressResponse";
import { MapPin } from "lucide-react";

interface WarehouseAddressSelectorProps {
  addresses: HQSkydropxAddressItemResponse[];
  selectedAddress: HQSkydropxAddressItemResponse | null;
  onSelect: (address: HQSkydropxAddressItemResponse) => void;
  isLoading: boolean;
}

export function WarehouseAddressSelector({
  addresses,
  selectedAddress,
  onSelect,
  isLoading,
}: WarehouseAddressSelectorProps) {
  const selectedIndex = selectedAddress
    ? addresses.findIndex((a) => a.email === selectedAddress.email && a.name === selectedAddress.name)
    : -1;

  const handleChange = (value: string) => {
    const idx = Number(value);
    if (!Number.isNaN(idx) && addresses[idx]) onSelect(addresses[idx]);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="size-4" />
          Dirección de origen (almacén)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Selecciona la dirección desde donde se envía el paquete
        </p>
      </CardHeader>
      <CardContent>
        <Select
          value={selectedIndex >= 0 ? String(selectedIndex) : ""}
          onValueChange={handleChange}
          disabled={isLoading || addresses.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder={isLoading ? "Cargando direcciones..." : "Seleccionar dirección"} />
          </SelectTrigger>
          <SelectContent>
            {addresses.map((addr, idx) => (
              <SelectItem key={idx} value={String(idx)}>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">
                    {addr.name} — {addr.company}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {addr.address.address1}, {addr.address.city}, {addr.address.province} {addr.address.zip}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
