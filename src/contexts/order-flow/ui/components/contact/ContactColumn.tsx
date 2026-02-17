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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
} from "@contexts/shared/shadcn";
import { COUNTRIES } from "@contexts/shared/domain/schemas/address/Country";
import { ChevronsUpDown, Check, UserPlus } from "lucide-react";
import { useState } from "react";
import { useFormContext, useWatch, Controller, type FieldErrors } from "react-hook-form";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { useCustomers } from "@contexts/sales/infrastructure/hooks/customers/useCustomers";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { CustomerPrimitives } from "@contexts/sales/domain/schemas/customer/Customer";
import { MEXICO_STATES } from "@contexts/order-flow/domain/catalogs/MexicoStates";

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

function getAddressError(errors: FieldErrors<NewOrderFormValues>, prefix: ContactPrefix, field: string) {
  const contact = errors[prefix];
  if (!contact) return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const address = (contact as any).address;
  if (!address) return undefined;
  return address[field]?.message as string | undefined;
}

export function ContactColumn({ fieldPrefix: prefix, title }: ContactColumnProps) {
  const { register, setValue, control, formState: { errors } } = useFormContext<NewOrderFormValues>();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { customers: savedContacts, isLoading: isLoadingContacts } = useCustomers({ search });

  const contactId = useWatch({ control, name: `${prefix}.id` as "sender.id" | "recipient.id" });
  const country = useWatch({ control, name: `${prefix}.address.country` as "sender.address.country" | "recipient.address.country" });
  const province = useWatch({ control, name: `${prefix}.address.province` as "sender.address.province" | "recipient.address.province" });

  const selectedContact = savedContacts.find((c) => c.id === contactId);

  const handleSelectSaved = (c: CustomerPrimitives) => {
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
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="size-4" />
          {title}
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
          <div className="grid grid-cols-2 gap-3">
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
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-muted-foreground">
            Dirección
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>País</Label>
              <Controller
                control={control}
                name={`${prefix}.address.country`}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      setValue(`${prefix}.address.province`, "");
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar país" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label>Estado / Provincia *</Label>
              <Controller
                control={control}
                name={`${prefix}.address.province`}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={!!getAddressError(errors, prefix, "province")}>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {country === "MX"
                        ? (
                          <>
                            {province && !MEXICO_STATES.includes(province) && (
                              <SelectItem value={province}>{province}</SelectItem>
                            )}
                            {MEXICO_STATES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </>
                        )
                        : (
                          <>
                            {province && province !== "otro" && (
                              <SelectItem value={province}>{province}</SelectItem>
                            )}
                            <SelectItem value="otro">Otro</SelectItem>
                          </>
                        )
                      }
                    </SelectContent>
                  </Select>
                )}
              />
              {getAddressError(errors, prefix, "province") && (
                <p className="text-sm text-destructive">{getAddressError(errors, prefix, "province")}</p>
              )}
            </div>
            <div>
              <Label htmlFor={`${title}-address1`}>Dirección línea 1 *</Label>
              <Input
                id={`${title}-address1`}
                aria-invalid={!!getAddressError(errors, prefix, "address1")}
                placeholder="Calle y número exterior"
                {...register(`${prefix}.address.address1`)}
              />
              {getAddressError(errors, prefix, "address1") && (
                <p className="text-sm text-destructive">{getAddressError(errors, prefix, "address1")}</p>
              )}
            </div>
            <div>
              <Label htmlFor={`${title}-address2`}>Dirección línea 2</Label>
              <Input
                id={`${title}-address2`}
                placeholder="Núm. interior, colonia, etc."
                {...register(`${prefix}.address.address2`)}
              />
            </div>
            <div>
              <Label htmlFor={`${title}-zip`}>Código postal *</Label>
              <Input
                id={`${title}-zip`}
                aria-invalid={!!getAddressError(errors, prefix, "zip")}
                placeholder="5 dígitos"
                {...register(`${prefix}.address.zip`)}
              />
              {getAddressError(errors, prefix, "zip") && (
                <p className="text-sm text-destructive">{getAddressError(errors, prefix, "zip")}</p>
              )}
            </div>
            <div>
              <Label htmlFor={`${title}-city`}>Ciudad *</Label>
              <Input
                id={`${title}-city`}
                aria-invalid={!!getAddressError(errors, prefix, "city")}
                placeholder="Ciudad"
                {...register(`${prefix}.address.city`)}
              />
              {getAddressError(errors, prefix, "city") && (
                <p className="text-sm text-destructive">{getAddressError(errors, prefix, "city")}</p>
              )}
            </div>
            <div>
              <Label htmlFor={`${title}-ref`}>Referencias</Label>
              <Input
                id={`${title}-ref`}
                placeholder="Referencias de la dirección"
                {...register(`${prefix}.address.reference`)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Save toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor={`${title}-save`} className="text-sm">
            Guardar {title.toLowerCase()}
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
