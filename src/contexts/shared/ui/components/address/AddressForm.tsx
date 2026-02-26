import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import { useFormContext, useWatch, Controller, type FieldErrors } from "react-hook-form";
import { CountrySelect } from "@contexts/shared/ui/components/CountrySelect";
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
          render={({ field }) => (
            <CountrySelect
              value={field.value}
              onChange={(code) => {
                field.onChange(code);
                setValue(`${fieldPrefix}.province`, "");
                onFieldCommit();
              }}
            />
          )}
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
