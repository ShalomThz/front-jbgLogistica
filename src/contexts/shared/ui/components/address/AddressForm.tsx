import { Input, Label } from "@contexts/shared/shadcn";
import { useFormContext, Controller, useWatch, type FieldErrors } from "react-hook-form";
import { CountrySelect } from "@contexts/shared/ui/components/CountrySelect";

interface AddressFormProps {
  fieldPrefix: string;
  labelPrefix: string;
  onFieldCommit: () => void;
}

const MX_LABELS = {
  province: "Estado",
  address1: "Calle y número",
  address2: "Colonia",
  zip: "Código postal",
  city: "Ciudad/Municipio",
  provincePlaceholder: "Estado",
  address1Placeholder: "Calle y número exterior",
  address2Placeholder: "Núm. interior, colonia, etc.",
  zipPlaceholder: "5 dígitos",
  cityPlaceholder: "Ciudad",
};

const GENERIC_LABELS = {
  province: "Provincia",
  address1: "Dirección 1",
  address2: "Dirección 2",
  zip: "Código postal",
  city: "Ciudad",
  provincePlaceholder: "Provincia",
  address1Placeholder: "Dirección",
  address2Placeholder: "Dirección adicional",
  zipPlaceholder: "Código postal",
  cityPlaceholder: "Ciudad",
};

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
  const labels = country === "MX" ? MX_LABELS : GENERIC_LABELS;

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
        <Label htmlFor={`${labelPrefix}-province`}>{labels.province} *</Label>
        <Input
          id={`${labelPrefix}-province`}
          aria-invalid={!!getFieldError(errors, `${fieldPrefix}.province`)}
          placeholder={labels.provincePlaceholder}
          {...register(`${fieldPrefix}.province`, {
            onBlur: onFieldCommit,
          })}
          onKeyDown={handleKeyDown}
        />
        {getFieldError(errors, `${fieldPrefix}.province`) && (
          <p className="text-sm text-destructive">{getFieldError(errors, `${fieldPrefix}.province`)}</p>
        )}
      </div>
      <div>
        <Label htmlFor={`${labelPrefix}-address1`}>{labels.address1} *</Label>
        <Input
          id={`${labelPrefix}-address1`}
          aria-invalid={!!getFieldError(errors, `${fieldPrefix}.address1`)}
          placeholder={labels.address1Placeholder}
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
        <Label htmlFor={`${labelPrefix}-address2`}>{labels.address2}</Label>
        <Input
          id={`${labelPrefix}-address2`}
          placeholder={labels.address2Placeholder}
          {...register(`${fieldPrefix}.address2`, {
            onBlur: onFieldCommit,
          })}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div>
        <Label htmlFor={`${labelPrefix}-zip`}>{labels.zip} *</Label>
        <Input
          id={`${labelPrefix}-zip`}
          aria-invalid={!!getFieldError(errors, `${fieldPrefix}.zip`)}
          placeholder={labels.zipPlaceholder}
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
        <Label htmlFor={`${labelPrefix}-city`}>{labels.city} *</Label>
        <Input
          id={`${labelPrefix}-city`}
          aria-invalid={!!getFieldError(errors, `${fieldPrefix}.city`)}
          placeholder={labels.cityPlaceholder}
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
