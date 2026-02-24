import { Label } from "@contexts/shared/shadcn";
import { BadgeCheck } from "lucide-react";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { AddressSuggestions } from "./AddressSuggestions";
import { AddressForm } from "./AddressForm";

interface AddressSectionProps {
  fieldPrefix: string;
  labelPrefix: string;
}

export function AddressSection({ fieldPrefix, labelPrefix }: AddressSectionProps) {
  const form = useFormContext();
  const [addressQuery, setAddressQuery] = useState("");

  const geolocation = useWatch({ control: form.control, name: `${fieldPrefix}.geolocation` });
  const isAddressVerified = !!geolocation?.placeId && (geolocation.latitude !== 0 || geolocation.longitude !== 0);

  const commitAddressSearch = () => {
    const address1 = form.getValues(`${fieldPrefix}.address1`);
    const address2 = form.getValues(`${fieldPrefix}.address2`);
    const city = form.getValues(`${fieldPrefix}.city`);
    const province = form.getValues(`${fieldPrefix}.province`);
    const zip = form.getValues(`${fieldPrefix}.zip`);
    const country = form.getValues(`${fieldPrefix}.country`);
    setAddressQuery([address1, address2, city, province, zip, country].filter(Boolean).join(", "));
  };

  const handleSelectAddress = (details: { address1: string; address2: string; city: string; province: string; zip: string; country: string; geolocation: { latitude: number; longitude: number; placeId: string | null } }) => {
    form.setValue(`${fieldPrefix}.address1`, details.address1);
    form.setValue(`${fieldPrefix}.address2`, details.address2);
    form.setValue(`${fieldPrefix}.city`, details.city);
    form.setValue(`${fieldPrefix}.province`, details.province);
    form.setValue(`${fieldPrefix}.zip`, details.zip);
    form.setValue(`${fieldPrefix}.country`, details.country);
    form.setValue(`${fieldPrefix}.geolocation`, details.geolocation);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-muted-foreground">
          Dirección
        </Label>
        {isAddressVerified && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <BadgeCheck className="size-3.5" />
            Dirección verificada
          </span>
        )}
      </div>
      <AddressSuggestions
        query={addressQuery}
        onSelect={handleSelectAddress}
      />
      <AddressForm
        fieldPrefix={fieldPrefix}
        labelPrefix={labelPrefix}
        onFieldCommit={commitAddressSearch}
      />
    </div>
  );
}
