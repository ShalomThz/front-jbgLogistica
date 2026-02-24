import {
  Button,
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
} from "@contexts/shared/shadcn";
import { ChevronsUpDown, Check } from "lucide-react";
import { useState } from "react";
import { useFormContext, useWatch, Controller, type FieldErrors } from "react-hook-form";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { useCountries } from "@contexts/shared/infrastructure/hooks/useCountries";
import { MEXICO_STATES } from "@contexts/shared/domain/catalogs/MexicoStates";

interface AddressFormProps {
  fieldPrefix: string;
  labelPrefix: string;
  onFieldCommit: () => void;
}

function getFieldError(errors: FieldErrors, path: string): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = errors;
  for (const part of path.split(".")) {
    if (!current) return undefined;
    current = current[part];
  }
  return current?.message as string | undefined;
}

export function AddressForm({ fieldPrefix, labelPrefix, onFieldCommit }: AddressFormProps) {
  const { register, setValue, control, formState: { errors } } = useFormContext();

  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  const { countries } = useCountries({ search: countrySearch });

  const country = useWatch({ control, name: `${fieldPrefix}.country` });
  const province = useWatch({ control, name: `${fieldPrefix}.province` });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onFieldCommit();
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 *:space-y-1">
      <div>
        <Label>País</Label>
        <Controller
          control={control}
          name={`${fieldPrefix}.country`}
          render={({ field }) => {
            const selected = countries.find((c) => c.code === field.value);
            return (
              <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={countryOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selected
                      ? <span className="truncate">{selected.name}</span>
                      : <span className="text-muted-foreground">Seleccionar país</span>
                    }
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar país..."
                      onValueChange={setCountrySearch}
                    />
                    <CommandList>
                      <CommandEmpty>Sin resultados</CommandEmpty>
                      <CommandGroup>
                        {countries.map((c) => (
                          <CommandItem
                            key={c.code}
                            value={c.code}
                            onSelect={() => {
                              field.onChange(c.code);
                              setValue(`${fieldPrefix}.province`, "");
                              setCountryOpen(false);
                              setCountrySearch("");
                              onFieldCommit();
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 size-4",
                                field.value === c.code ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {c.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            );
          }}
        />
      </div>
      <div>
        <Label>Estado *</Label>
        <Controller
          control={control}
          name={`${fieldPrefix}.province`}
          render={({ field }) => (
            <Select value={field.value} onValueChange={(val) => { field.onChange(val); onFieldCommit(); }}>
              <SelectTrigger aria-invalid={!!getFieldError(errors, `${fieldPrefix}.province`)}>
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
        {getFieldError(errors, `${fieldPrefix}.province`) && (
          <p className="text-sm text-destructive">{getFieldError(errors, `${fieldPrefix}.province`)}</p>
        )}
      </div>
      <div>
        <Label htmlFor={`${labelPrefix}-address1`}>Calle y número *</Label>
        <Input
          id={`${labelPrefix}-address1`}
          aria-invalid={!!getFieldError(errors, `${fieldPrefix}.address1`)}
          placeholder="Calle y número exterior"
          {...register(`${fieldPrefix}.address1`, {
            onBlur: onFieldCommit,
          })}
          onKeyDown={handleKeyDown}
        />
        {getFieldError(errors, `${fieldPrefix}.address1`) && (
          <p className="text-sm text-destructive">{getFieldError(errors, `${fieldPrefix}.address1`)}</p>
        )}
      </div>
      <div>
        <Label htmlFor={`${labelPrefix}-address2`}>Colonia</Label>
        <Input
          id={`${labelPrefix}-address2`}
          placeholder="Núm. interior, colonia, etc."
          {...register(`${fieldPrefix}.address2`, {
            onBlur: onFieldCommit,
          })}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div>
        <Label htmlFor={`${labelPrefix}-zip`}>Código postal *</Label>
        <Input
          id={`${labelPrefix}-zip`}
          aria-invalid={!!getFieldError(errors, `${fieldPrefix}.zip`)}
          placeholder="5 dígitos"
          {...register(`${fieldPrefix}.zip`, {
            onBlur: onFieldCommit,
          })}
          onKeyDown={handleKeyDown}
        />
        {getFieldError(errors, `${fieldPrefix}.zip`) && (
          <p className="text-sm text-destructive">{getFieldError(errors, `${fieldPrefix}.zip`)}</p>
        )}
      </div>
      <div>
        <Label htmlFor={`${labelPrefix}-city`}>Ciudad/Municipio *</Label>
        <Input
          id={`${labelPrefix}-city`}
          aria-invalid={!!getFieldError(errors, `${fieldPrefix}.city`)}
          placeholder="Ciudad"
          {...register(`${fieldPrefix}.city`, {
            onBlur: onFieldCommit,
          })}
          onKeyDown={handleKeyDown}
        />
        {getFieldError(errors, `${fieldPrefix}.city`) && (
          <p className="text-sm text-destructive">{getFieldError(errors, `${fieldPrefix}.city`)}</p>
        )}
      </div>
      <div>
        <Label htmlFor={`${labelPrefix}-ref`}>Referencias *</Label>
        <Input
          id={`${labelPrefix}-ref`}
          aria-invalid={!!getFieldError(errors, `${fieldPrefix}.reference`)}
          placeholder="Ej: Entre calles, color de fachada... (máx. 25)"
          {...register(`${fieldPrefix}.reference`)}
        />
        {getFieldError(errors, `${fieldPrefix}.reference`) && (
          <p className="text-sm text-destructive">{getFieldError(errors, `${fieldPrefix}.reference`)}</p>
        )}
      </div>
    </div>
  );
}
