import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import type { HQSkydropxAddressItemResponse } from "@contexts/settings/domain/schemas/HQSkydropxAddressResponse";
import { Warehouse } from "lucide-react";

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
    <div className="space-y-1">
      <Label htmlFor="warehouse-address-select" className="flex items-center gap-1.5">
        <Warehouse className="size-3.5" />
        Dirección de origen (almacén)
      </Label>
      <Select
        value={selectedIndex >= 0 ? String(selectedIndex) : ""}
        onValueChange={handleChange}
        disabled={isLoading || addresses.length === 0}
      >
        <SelectTrigger id="warehouse-address-select" className="w-full">
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
    </div>
  );
}
