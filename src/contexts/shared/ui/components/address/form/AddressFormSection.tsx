import { Label } from "@contexts/shared/shadcn";
import { AddressForm } from "../shared/AddressForm";

interface AddressFormSectionProps {
  fieldPrefix: string;
  labelPrefix: string;
}

export function AddressFormSection({ fieldPrefix, labelPrefix }: AddressFormSectionProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-muted-foreground">
        Dirección *
      </Label>
      <AddressForm fieldPrefix={fieldPrefix} labelPrefix={labelPrefix} />
    </div>
  );
}
