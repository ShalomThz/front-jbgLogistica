import { Label } from "@contexts/shared/shadcn";
import { BadgeCheck, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFormContext, useWatch, type FieldErrors } from "react-hook-form";
import type { PlaceDetailsResponse } from "@contexts/shared/domain/schemas/address/PlaceDetailsResponse";
import { AddressForm } from "../shared/AddressForm";
import { AddressSuggestions } from "./AddressSuggestions";

interface AddressAutocompleteSectionProps {
  fieldPrefix: string;
  labelPrefix: string;
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

export function AddressAutocompleteSection({ fieldPrefix, labelPrefix }: AddressAutocompleteSectionProps) {
  const form = useFormContext();
  const [addressQuery, setAddressQuery] = useState("");

  // Campos editables que definen la dirección. Si alguno cambia después de
  // verificar, la geolocation deja de corresponder y hay que invalidarla.
  const [address1, address2, city, province, zip, country] = useWatch({
    control: form.control,
    name: [
      `${fieldPrefix}.address1`,
      `${fieldPrefix}.address2`,
      `${fieldPrefix}.city`,
      `${fieldPrefix}.province`,
      `${fieldPrefix}.zip`,
      `${fieldPrefix}.country`,
    ],
  }) as (string | undefined)[];

  const geolocation = useWatch({ control: form.control, name: `${fieldPrefix}.geolocation` });
  const isAddressVerified = !!geolocation?.placeId && (geolocation.latitude !== 0 || geolocation.longitude !== 0);
  const verificationError = getFieldError(form.formState.errors, `${fieldPrefix}.geolocation`);

  // Snapshot de los campos con los que se verificó la dirección. Cualquier
  // divergencia posterior (edición manual) invalida la verificación.
  const verifiedSnapshotRef = useRef<string | null>(null);
  const currentSnapshot = JSON.stringify([address1, address2, city, province, zip, country]);

  // Inicializa el snapshot con los valores presentes en el primer render
  // (p. ej. al editar un registro ya verificado) para no invalidar al cargar.
  if (verifiedSnapshotRef.current === null) {
    verifiedSnapshotRef.current = currentSnapshot;
  }

  useEffect(() => {
    if (!isAddressVerified) return;
    if (currentSnapshot === verifiedSnapshotRef.current) return;
    // Un campo cambió después de verificar: limpiar la geolocation y re-validar
    // para que reaparezca el aviso de "verifica la dirección".
    form.setValue(`${fieldPrefix}.geolocation`, { latitude: 0, longitude: 0, placeId: null });
    form.trigger(`${fieldPrefix}.geolocation`);
    // Resetear el search: la edición es por tecla (useWatch), pero las sugerencias
    // deben volver solo tras un commit (blur/Enter). Sin esto, reaparecerían las
    // sugerencias cacheadas del search anterior en cuanto se invalida.
    setAddressQuery("");
    verifiedSnapshotRef.current = currentSnapshot;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSnapshot, isAddressVerified]);

  const commitAddressSearch = () => {
    const address1 = form.getValues(`${fieldPrefix}.address1`);
    const address2 = form.getValues(`${fieldPrefix}.address2`);
    const city = form.getValues(`${fieldPrefix}.city`);
    const province = form.getValues(`${fieldPrefix}.province`);
    const zip = form.getValues(`${fieldPrefix}.zip`);
    const country = form.getValues(`${fieldPrefix}.country`);
    setAddressQuery([address1, address2, city, province, zip, country].filter(Boolean).join(", "));
  };

  const handleSelectAddress = (details: PlaceDetailsResponse) => {
    form.setValue(`${fieldPrefix}.address1`, details.address1);
    form.setValue(`${fieldPrefix}.address2`, details.address2);
    form.setValue(`${fieldPrefix}.city`, details.city);
    form.setValue(`${fieldPrefix}.province`, details.province);
    form.setValue(`${fieldPrefix}.zip`, details.zip);
    form.setValue(`${fieldPrefix}.country`, details.country);
    form.setValue(`${fieldPrefix}.geolocation`, details.geolocation);
    // Marca estos valores como el estado verificado para que la edición posterior
    // (no la propia selección) sea lo único que invalide la verificación.
    verifiedSnapshotRef.current = JSON.stringify([
      details.address1,
      details.address2,
      details.city,
      details.province,
      details.zip,
      details.country,
    ]);
    form.trigger([
      `${fieldPrefix}.address1`,
      `${fieldPrefix}.address2`,
      `${fieldPrefix}.city`,
      `${fieldPrefix}.province`,
      `${fieldPrefix}.zip`,
      `${fieldPrefix}.country`,
      `${fieldPrefix}.geolocation`,
    ]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-muted-foreground">
          Dirección *
        </Label>
        {isAddressVerified ? (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <BadgeCheck className="size-3.5" />
            Dirección verificada
          </span>
        ) : verificationError ? (
          <span className="flex items-center gap-1 text-xs font-medium text-destructive">
            <TriangleAlert className="size-3.5" />
            {verificationError}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
            <TriangleAlert className="size-3.5" />
            Dirección no verificada por Google
          </span>
        )}
      </div>
      <AddressSuggestions
        query={addressQuery}
        country={country}
        dismissed={isAddressVerified}
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
