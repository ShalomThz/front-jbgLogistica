import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Switch,
} from "@contexts/shared/shadcn";
import { UserPlus, Eraser } from "lucide-react";
import { useState } from "react";
import { useFormContext, useWatch, Controller, type FieldErrors } from "react-hook-form";
import { CustomerPickerCombobox } from "@contexts/sales/ui/components/customer/CustomerPickerCombobox";
import type { BaseOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { CustomerListViewPrimitives } from "@contexts/sales/domain/schemas/customer/CustomerListView";
import { AddressSection } from "@contexts/shared/ui/components/address/AddressSection";

type ContactPrefix = "sender" | "recipient";

interface ContactColumnProps {
  fieldPrefix: ContactPrefix;
  title: string;
}

function getNestedError(errors: FieldErrors<BaseOrderFormValues>, prefix: ContactPrefix, field: string) {
  const contact = errors[prefix];
  if (!contact) return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nested = (contact as any)[field];
  return nested?.message as string | undefined;
}

export function ContactColumn({ fieldPrefix: prefix, title }: ContactColumnProps) {
  const form = useFormContext<BaseOrderFormValues>();
  const { register, setValue, control, formState: { errors } } = form;

  const [addressFormKey, setAddressFormKey] = useState(0);

  const contactId = useWatch({ control, name: `${prefix}.id` as "sender.id" | "recipient.id" });

  const handleClear = () => {
    setValue(`${prefix}.id`, null);
    setValue(`${prefix}.name`, "");
    setValue(`${prefix}.company`, "");
    setValue(`${prefix}.email`, "");
    setValue(`${prefix}.phone`, "");
    setValue(`${prefix}.address.country`, "MX");
    setValue(`${prefix}.address.address1`, "");
    setValue(`${prefix}.address.address2`, "");
    setValue(`${prefix}.address.zip`, "");
    setValue(`${prefix}.address.province`, "");
    setValue(`${prefix}.address.city`, "");
    setValue(`${prefix}.address.reference`, "");
    setValue(`${prefix}.address.geolocation`, { latitude: 0, longitude: 0, placeId: null });
    setValue(`${prefix}.save`, false);
    setAddressFormKey((k) => k + 1);
  };

  const handleSelectSaved = (c: CustomerListViewPrimitives) => {
    setValue(`${prefix}.id`, c.id);
    setValue(`${prefix}.name`, c.name);
    setValue(`${prefix}.company`, c.company);
    setValue(`${prefix}.email`, c.email);
    setValue(`${prefix}.phone`, c.phone);
    setValue(`${prefix}.address.country`, c.address.country);
    setValue(`${prefix}.address.address1`, c.address.address1);
    setValue(`${prefix}.address.address2`, c.address.address2);
    setValue(`${prefix}.address.zip`, c.address.zip);
    setValue(`${prefix}.address.province`, c.address.province);
    setValue(`${prefix}.address.city`, c.address.city);
    setValue(`${prefix}.address.reference`, c.address.reference);
    setValue(`${prefix}.address.geolocation`, c.address.geolocation ?? { latitude: 0, longitude: 0, placeId: null });
    setAddressFormKey((k) => k + 1);
  };

  return (
    <Card className="shadow-md shadow-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <UserPlus className="size-4" />
            {title}
          </span>
          {contactId && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-destructive"
              onClick={handleClear}
            >
              <Eraser className="size-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Saved contacts combobox */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-muted-foreground">
            {title}s guardados
          </Label>
          <CustomerPickerCombobox
            value={contactId ?? undefined}
            onChange={handleSelectSaved}
            placeholder={`Buscar ${title.toLowerCase()}...`}
          />
        </div>

        <Separator />

        {/* Personal data */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-muted-foreground">
            Datos personales
          </Label>
          <div className="grid grid-cols-2 gap-3 *:space-y-1">
            <div className="col-span-2">
              <Label htmlFor={`${title}-name`}>Nombre completo *</Label>
              <Input
                id={`${title}-name`}
                aria-invalid={!!getNestedError(errors, prefix, "name")}
                placeholder="Nombre completo"
                {...register(`${prefix}.name`)}
              />
              {getNestedError(errors, prefix, "name") && (
                <p className="text-sm text-destructive">{getNestedError(errors, prefix, "name")}</p>
              )}
            </div>
            <div className="col-span-2">
              <Label htmlFor={`${title}-company`}>Empresa *</Label>
              <Input
                id={`${title}-company`}
                aria-invalid={!!getNestedError(errors, prefix, "company")}
                placeholder="Nombre de empresa"
                {...register(`${prefix}.company`)}
              />
              {getNestedError(errors, prefix, "company") && (
                <p className="text-sm text-destructive">{getNestedError(errors, prefix, "company")}</p>
              )}
            </div>
            <div>
              <Label htmlFor={`${title}-email`}>Correo electrónico *</Label>
              <Input
                id={`${title}-email`}
                type="email"
                aria-invalid={!!getNestedError(errors, prefix, "email")}
                placeholder="correo@ejemplo.com"
                {...register(`${prefix}.email`)}
              />
              {getNestedError(errors, prefix, "email") && (
                <p className="text-sm text-destructive">{getNestedError(errors, prefix, "email")}</p>
              )}
            </div>
            <div>
              <Label htmlFor={`${title}-phone`}>Teléfono *</Label>
              <Input
                id={`${title}-phone`}
                aria-invalid={!!getNestedError(errors, prefix, "phone")}
                placeholder="10 dígitos"
                {...register(`${prefix}.phone`)}
              />
              {getNestedError(errors, prefix, "phone") && (
                <p className="text-sm text-destructive">{getNestedError(errors, prefix, "phone")}</p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Address */}
        <AddressSection
          key={addressFormKey}
          fieldPrefix={`${prefix}.address`}
          labelPrefix={title}
        />

        <Separator />

        {/* Save toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor={`${title}-save`} className="text-sm">
            {contactId ? `Actualizar ${title.toLowerCase()}` : `Guardar ${title.toLowerCase()}`}
          </Label>
          <Controller
            control={control}
            name={`${prefix}.save`}
            render={({ field }) => (
              <Switch
                id={`${title}-save`}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
