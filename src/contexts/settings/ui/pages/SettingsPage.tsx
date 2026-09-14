import {
  saveVolumetricDivisorSchema,
  volumetricDivisorSchema,
  VOLUMETRIC_BASIS_LABELS,
  VOLUMETRIC_DIVISOR_PRESETS,
  type VolumetricDivisor,
} from "@contexts/settings/application/VolumetricDivisor";
import { useHQSettings } from "@contexts/settings/infrastructure/hooks/useSkydropxSettings";
import { useVolumetricDivisor } from "@contexts/settings/infrastructure/hooks/useVolumetricDivisor";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { toast } from "sonner";
import { parseApiError } from "../../../shared/infrastructure/http";
import { AddressAutocompleteSection } from "../../../shared/ui/components/address";
import type { HQSkydropxAddressItemResponse } from "../../domain/schemas/HQSkydropxAddressResponse";
import {
  saveSkydropxAddressesSchema,
  type SaveSkydropxAddressesRequest,
} from "../../domain/schemas/SaveSkydropxAddressRequest";

type FormValues = SaveSkydropxAddressesRequest;

const emptyAddressItem = {
  name: "",
  company: "",
  email: "",
  phone: "",
  isSelected: false,
  address: {
    address1: "",
    address2: "",
    city: "",
    province: "",
    zip: "",
    country: "MX" as const,
    reference: "",
    geolocation: { latitude: 0, longitude: 0, placeId: null as string | null },
  },
};

function mapResponseItemToForm(item: HQSkydropxAddressItemResponse) {
  const address = item.address as HQSkydropxAddressItemResponse["address"] & {
    geolocation?: { latitude: number; longitude: number; placeId: string | null };
  };
  return {
    name: item.name,
    company: item.company,
    email: item.email,
    phone: item.phone,
    isSelected: item.isSelected,
    address: {
      address1: address.address1,
      address2: address.address2 ?? "",
      city: address.city,
      province: address.province,
      zip: address.zip,
      country: address.country,
      reference: address.reference ?? "",
      geolocation: address.geolocation ?? { latitude: 0, longitude: 0, placeId: null },
    },
  };
}

function getDefaultValues(saved: HQSkydropxAddressItemResponse[]): FormValues {
  if (saved.length === 0) {
    return { skydropxAddresses: [{ ...emptyAddressItem, isSelected: true }] };
  }
  return { skydropxAddresses: saved.map(mapResponseItemToForm) };
}

// ─── Left panel: compact list item ───────────────────────────────────────────

interface AddressListItemProps {
  index: number;
  totalCount: number;
  isEditing: boolean;
  onClick: () => void;
  onSelect: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
}

function AddressListItem({
  index,
  totalCount,
  isEditing,
  onClick,
  onSelect,
  onRemove,
}: AddressListItemProps) {
  const { control } = useFormContext<FormValues>();
  const name = useWatch({ control, name: `skydropxAddresses.${index}.name` });
  const company = useWatch({ control, name: `skydropxAddresses.${index}.company` });
  const isSelected = useWatch({ control, name: `skydropxAddresses.${index}.isSelected` });
  const canRemove = totalCount > 1 && !isSelected;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${isEditing
        ? "bg-accent border-accent-foreground/20"
        : "border-transparent hover:bg-muted"
        }`}
    >
      <span
        onClick={onSelect}
        className="shrink-0 flex items-center"
        title={isSelected ? "Dirección predeterminada" : "Establecer como predeterminada"}
      >
        {isSelected ? (
          <CheckCircle2 className="size-4 text-primary" />
        ) : (
          <Circle className="size-4 text-muted-foreground" />
        )}
      </span>

      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium truncate">
          {name || <span className="italic text-muted-foreground">Sin nombre</span>}
        </span>
        <span className="block text-xs text-muted-foreground truncate">
          {company || "—"}
        </span>
      </span>

      {canRemove && (
        <span
          onClick={onRemove}
          className="shrink-0 p-1 rounded hover:bg-destructive/10 transition-colors"
          title="Eliminar dirección"
        >
          <Trash2 className="size-3.5 text-destructive" />
        </span>
      )}
    </button>
  );
}

// ─── Right panel: edit form for the active address ───────────────────────────

function AddressEditForm({ index }: { index: number }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormValues>();

  const fieldErrors = errors.skydropxAddresses?.[index] ?? {};

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nombre</Label>
          <Input
            aria-invalid={!!fieldErrors.name}
            {...register(`skydropxAddresses.${index}.name`)}
          />
          {fieldErrors.name && (
            <p className="text-xs text-destructive">{fieldErrors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Empresa</Label>
          <Input
            aria-invalid={!!fieldErrors.company}
            {...register(`skydropxAddresses.${index}.company`)}
          />
          {fieldErrors.company && (
            <p className="text-xs text-destructive">{fieldErrors.company.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            aria-invalid={!!fieldErrors.email}
            {...register(`skydropxAddresses.${index}.email`)}
          />
          {fieldErrors.email && (
            <p className="text-xs text-destructive">{fieldErrors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Teléfono</Label>
          <Input
            aria-invalid={!!fieldErrors.phone}
            {...register(`skydropxAddresses.${index}.phone`)}
          />
          {fieldErrors.phone && (
            <p className="text-xs text-destructive">{fieldErrors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="border-t pt-4">
        <AddressAutocompleteSection
          fieldPrefix={`skydropxAddresses.${index}.address`}
          labelPrefix="Dirección"
        />
      </div>
    </div>
  );
}

// ─── Volumetric divisor ───────────────────────────────────────────────────────

/**
 * El divisor que convierte el volumen de un bulto en peso.
 *
 * Vive acá y no en cada tarifa porque es un solo número para toda la operación,
 * y tenerlo repetido por fila garantiza que un día dejen de coincidir. Lo usan
 * las tarifas por peso, que cobran el mayor entre el peso real y el volumétrico.
 */
function VolumetricDivisorCard() {
  const { volumetricDivisor, isLoading, saveVolumetricDivisor, isSaving } =
    useVolumetricDivisor();

  const form = useForm<VolumetricDivisor>({
    resolver: zodResolver(volumetricDivisorSchema),
    defaultValues: { value: 166, basis: "in3/lb" },
  });

  const { register, control, handleSubmit, reset, setValue, formState } = form;

  useEffect(() => {
    if (volumetricDivisor) reset(volumetricDivisor);
  }, [volumetricDivisor, reset]);

  const basis = useWatch({ control, name: "basis" });

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Se manda con la forma del request y no el objeto pelado: el back espera
      // `{ volumetricDivisor }`, y `saveVolumetricDivisorSchema` lo comprueba
      // acá en vez de descubrirlo con un 400.
      await saveVolumetricDivisor(
        saveVolumetricDivisorSchema.parse({ volumetricDivisor: data }),
      );
      toast.success("Divisor volumétrico actualizado");
    } catch (error) {
      toast.error(parseApiError(error));
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Divisor volumétrico</CardTitle>
        <CardDescription>
          Cuánto volumen equivale a una unidad de peso. Las tarifas por peso
          cobran el mayor entre el peso real y el volumétrico, así que este
          número decide la mayoría de esos cobros.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Divisor</Label>
              <Input
                type="number"
                step="any"
                aria-invalid={!!formState.errors.value}
                {...register("value", { valueAsNumber: true })}
              />
              {formState.errors.value && (
                <p className="text-xs text-destructive">
                  {formState.errors.value.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Escala</Label>
              <Select
                value={basis}
                onValueChange={(next) =>
                  setValue("basis", next as VolumetricDivisor["basis"], {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VOLUMETRIC_BASIS_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* La escala no es cosmética: 166 in³/lb y 6000 cm³/kg son el mismo
              divisor, pero 166 leído como cm³/kg no se parece a nada. */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Valores usuales:</span>
            {VOLUMETRIC_DIVISOR_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => reset(preset.divisor, { keepDefaultValues: true })}
              >
                {preset.label}: {preset.divisor.value}
              </Button>
            ))}
          </div>

          <div className="border-t pt-4">
            <Button type="submit" disabled={isLoading || isSaving}>
              {isSaving ? "Guardando..." : "Guardar divisor"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { skydropxAddresses, isLoading, saveAddresses, isSaving } = useHQSettings();
  const [editingIndex, setEditingIndex] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(saveSkydropxAddressesSchema),
    defaultValues: getDefaultValues([]),
  });

  const { control, handleSubmit, reset, formState: { errors } } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "skydropxAddresses",
  });

  useEffect(() => {
    if (!isLoading) {
      reset(getDefaultValues(skydropxAddresses));
    }
  }, [isLoading, skydropxAddresses, reset]);

  const handleSelect = async (selectedIndex: number) => {
    fields.forEach((_, i) => {
      form.setValue(`skydropxAddresses.${i}.isSelected`, i === selectedIndex);
    });

    const isValid = await form.trigger();
    if (!isValid) return;

    try {
      await saveAddresses(form.getValues());
      toast.success("Dirección predeterminada actualizada");
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  const handleRemove = (index: number) => {
    const isSelectedAddress = form.getValues(`skydropxAddresses.${index}.isSelected`);
    remove(index);

    const nextEditing = editingIndex >= index ? Math.max(0, editingIndex - 1) : editingIndex;
    setEditingIndex(nextEditing);

    if (isSelectedAddress) {
      setTimeout(() => {
        form.setValue(`skydropxAddresses.${nextEditing}.isSelected`, true, {
          shouldValidate: true,
        });
      }, 0);
    }
  };

  const handleAddAddress = () => {
    append({ ...emptyAddressItem, isSelected: false });
    setEditingIndex(fields.length);
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      await saveAddresses(data);
      toast.success("Direcciones actualizadas");
    } catch (error) {
      toast.error(parseApiError(error));
    }
  });

  const listError = (
    errors.skydropxAddresses as { root?: { message?: string }; message?: string } | undefined
  )?.root?.message ?? (errors.skydropxAddresses as { message?: string } | undefined)?.message;

  // Clamp during render: if data reloads with fewer items than our current index,
  // we display the last available item without needing a setState in an effect.
  const safeEditingIndex = Math.min(editingIndex, Math.max(0, fields.length - 1));
  const activeAddress = fields[safeEditingIndex];

  return (
    <div className="container mx-auto max-w-5xl space-y-6">
      

      <FormProvider {...form}>
        <form onSubmit={onSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">

            {/* ── Left: address list ── */}
            <div className="space-y-2">
              <div className="px-1 mb-3">
                <h2 className="text-sm font-semibold">Direcciones de origen</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Skydropx · selecciona la predeterminada
                </p>
              </div>

              {listError && (
                <p className="text-xs text-destructive px-1">{listError}</p>
              )}

              <div className="space-y-0.5">
                {fields.map((field, index) => (
                  <AddressListItem
                    key={field.id}
                    index={index}
                    totalCount={fields.length}
                    isEditing={safeEditingIndex === index}
                    onClick={() => setEditingIndex(index)}
                    onSelect={(e) => { e.stopPropagation(); handleSelect(index); }}
                    onRemove={(e) => { e.stopPropagation(); handleRemove(index); }}
                  />
                ))}
              </div>

              <div className="pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground hover:text-foreground"
                  onClick={handleAddAddress}
                >
                  <Plus className="size-4 mr-2" />
                  Agregar dirección
                </Button>
              </div>
            </div>

            {/* ── Right: edit form ── */}
            {activeAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Editar dirección</CardTitle>
                  <CardDescription>
                    Los cambios se aplicarán al guardar.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <AddressEditForm key={activeAddress.id} index={safeEditingIndex} />

                  <div className="flex items-center justify-between border-t pt-4">
                    <Button type="submit" disabled={isLoading || isSaving}>
                      {isSaving ? "Guardando..." : "Guardar cambios"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {fields.length} dirección{fields.length !== 1 ? "es" : ""} guardada{fields.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </form>
      </FormProvider>

      {/* Fuera del form de arriba: dos formularios anidados no son HTML válido,
          y además éste se guarda por su cuenta. */}
      <VolumetricDivisorCard />
    </div>
  );
}
