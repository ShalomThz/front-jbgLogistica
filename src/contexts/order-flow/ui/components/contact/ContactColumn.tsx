import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  Switch,
} from "@contexts/shared/shadcn";
import { ChevronsUpDown, Check, UserPlus, Eraser } from "lucide-react";
import { useState } from "react";
import { useFormContext, useWatch, Controller, type FieldErrors } from "react-hook-form";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { useCustomers } from "@contexts/sales/infrastructure/hooks/customers/useCustomers";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { CustomerListViewPrimitives } from "@contexts/sales/domain/schemas/customer/CustomerListView";
import { AddressSection } from "@contexts/shared/ui/components/address/AddressSection";

type ContactPrefix = "sender" | "recipient";

interface ContactColumnProps {
  fieldPrefix: ContactPrefix;
  title: string;
}

function getNestedError(errors: FieldErrors<NewOrderFormValues>, prefix: ContactPrefix, field: string) {
  const contact = errors[prefix];
  if (!contact) return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nested = (contact as any)[field];
  return nested?.message as string | undefined;
}

export function ContactColumn({ fieldPrefix: prefix, title }: ContactColumnProps) {
  const form = useFormContext<NewOrderFormValues>();
  const { register, setValue, control, formState: { errors } } = form;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [addressFormKey, setAddressFormKey] = useState(0);

  const { customers: savedContacts, isLoading: isLoadingContacts } = useCustomers({ search, enabled: open });

  const contactId = useWatch({ control, name: `${prefix}.id` as "sender.id" | "recipient.id" });

  const selectedContact = savedContacts.find((c) => c.id === contactId);

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
    setSearch("");
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
    setOpen(false);
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
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between font-normal"
              >
                {selectedContact
                  ? <span className="truncate">{selectedContact.name}</span>
                  : <span className="text-muted-foreground">Buscar {title.toLowerCase()}...</span>
                }
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder={`Buscar por nombre o teléfono...`}
                  onValueChange={setSearch}
                />
                <CommandList>
                  {isLoadingContacts && (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      Buscando...
                    </div>
                  )}
                  {!isLoadingContacts && (
                    <CommandEmpty>Sin resultados</CommandEmpty>
                  )}
                  <CommandGroup>
                    {savedContacts.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={c.id}
                        onSelect={() => handleSelectSaved(c)}
                      >
                        <Check
                          className={cn(
                            "mr-2 size-4",
                            contactId === c.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.phone} · {c.address.city}</div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
