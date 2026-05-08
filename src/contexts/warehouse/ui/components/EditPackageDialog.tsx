import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";
import { boxRepository } from "@contexts/inventory/infrastructure/services/boxes/boxRepository";
import { BoxPickerCombobox } from "@contexts/inventory/ui/components/box/BoxPickerCombobox";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Camera, Eraser, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PhotosInput } from "./PhotosInput";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import { z } from "zod";
import { dimensionsSchema, dimensionUnits } from "../../../shared/domain/schemas/Dimensions";
import { weightSchema, weightUnits } from "../../../shared/domain/schemas/Weight";
import {
  warehousePackageStatuses,
  type PackageListViewPrimitives,
  type UpdatePackageRequest,
  type WarehousePackageStatus,
} from "../../domain/WarehousePackageSchema";
import type { BoxPrimitives } from "@contexts/inventory/domain/schemas/box/Box";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<WarehousePackageStatus, string> = {
  WAREHOUSE: "En bodega",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  REPACKED: "Reempacado",
  AUTHORIZED: "Autorizado",
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const boxEntrySchema = z.object({
  boxId: z.string().nullable(),
  boxName: z.string().min(1, "Nombre de la caja requerido"),
  dimensions: dimensionsSchema.extend({ unit: z.enum(dimensionUnits) }),
  weight: weightSchema.extend({ unit: z.enum(weightUnits) }),
});

const editFormSchema = z.object({
  providerName: z.string().min(1, "Nombre del proveedor requerido"),
  officialInvoice: z.string().optional(),
  providerDeliveryPerson: z.string().min(1, "Nombre del repartidor requerido"),
  supplierInvoice: z.string().optional(),
  status: z.enum(warehousePackageStatuses),
  boxes: z.array(boxEntrySchema).min(1, "Al menos una caja requerida"),
  photos: z.array(z.string()).max(4),
});

type FormValues = z.infer<typeof editFormSchema>;
type BoxEntry = z.infer<typeof boxEntrySchema>;

const defaultBox = (): BoxEntry => ({
  boxId: null,
  boxName: "",
  dimensions: { length: 0, width: 0, height: 0, unit: "cm" },
  weight: { value: 0, unit: "kg" },
});

function getDefaults(pkg: PackageListViewPrimitives): FormValues {
  return {
    providerName: pkg.provider.name,
    officialInvoice: pkg.officialInvoice ?? "",
    providerDeliveryPerson: pkg.providerDetails.deliveryPerson,
    supplierInvoice: pkg.providerDetails.supplierInvoice ?? "",
    status: pkg.status,
    boxes: pkg.boxes.length > 0
      ? pkg.boxes.map((b) => ({ boxId: b.boxId, boxName: "", dimensions: b.dimensions, weight: b.weight }))
      : [defaultBox()],
    photos: pkg.photos ?? [],
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onClose: () => void;
  pkg: PackageListViewPrimitives;
  onSave: (data: UpdatePackageRequest) => Promise<void>;
  isLoading?: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function EditPackageDialog({ open, onClose, pkg, onSave, isLoading }: Props) {
  const { createBox, updateBox } = useBoxes({ enabled: false });
  const [isProcessingBox, setIsProcessingBox] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: getDefaults(pkg),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "boxes" });

  const watchedBoxes = watch("boxes");
  const selectedBoxIdsKey = watchedBoxes
    .map((b) => b?.boxId)
    .filter((id): id is string => !!id)
    .join(",");

  const selectedBoxFilters = useMemo(() => {
    if (!selectedBoxIdsKey) return [];
    return [
      {
        field: "id",
        filterOperator: "IN" as const,
        value: selectedBoxIdsKey.split(","),
      },
    ];
  }, [selectedBoxIdsKey]);

  const { boxes: selectedBoxesLookup } = useBoxes({
    filters: selectedBoxFilters,
    enabled: !!selectedBoxIdsKey,
  });

  const findSelectedBox = (boxId: string | null | undefined) =>
    boxId ? selectedBoxesLookup.find((b) => b.id === boxId) : undefined;

  useEffect(() => {
    if (open) {
      reset(getDefaults(pkg));
    }
  }, [open, pkg.id, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync boxNames from lookup once loaded
  useEffect(() => {
    if (!selectedBoxesLookup.length) return;
    pkg.boxes.forEach((pkgBox, i) => {
      const found = selectedBoxesLookup.find((b) => b.id === pkgBox.boxId);
      if (found) setValue(`boxes.${i}.boxName`, found.name);
    });
  }, [selectedBoxesLookup, pkg.boxes, setValue]);

  const handleClose = () => {
    onClose();
  };

  const handleBoxSelect = (index: number, box: BoxPrimitives) => {
    setValue(`boxes.${index}.boxId`, box.id, { shouldValidate: true, shouldDirty: true });
    setValue(`boxes.${index}.boxName`, box.name, { shouldDirty: true });
    setValue(`boxes.${index}.dimensions.length`, box.dimensions.length, { shouldValidate: true, shouldDirty: true });
    setValue(`boxes.${index}.dimensions.width`, box.dimensions.width, { shouldValidate: true, shouldDirty: true });
    setValue(`boxes.${index}.dimensions.height`, box.dimensions.height, { shouldValidate: true, shouldDirty: true });
    setValue(`boxes.${index}.dimensions.unit`, box.dimensions.unit as "cm" | "in", { shouldDirty: true });
  };

  const handleBoxClear = (index: number) => {
    setValue(`boxes.${index}.boxId`, null, { shouldValidate: true, shouldDirty: true });
    setValue(`boxes.${index}.boxName`, "", { shouldDirty: true });
    setValue(`boxes.${index}.dimensions.length`, 0, { shouldDirty: true });
    setValue(`boxes.${index}.dimensions.width`, 0, { shouldDirty: true });
    setValue(`boxes.${index}.dimensions.height`, 0, { shouldDirty: true });
    setValue(`boxes.${index}.dimensions.unit`, "cm", { shouldDirty: true });
  };

  const findBoxByName = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const result = await boxRepository.find({
      filters: [{ field: "name", filterOperator: "=", value: trimmed }],
      limit: 1,
    });
    return result.data[0] ?? null;
  };

  const processBoxEntry = async (entry: BoxEntry): Promise<string> => {
    const selectedBox = entry.boxId ? findSelectedBox(entry.boxId) : undefined;
    const nameChanged = !!(selectedBox && entry.boxName && entry.boxName !== selectedBox.name);
    const dimsChanged = !!(selectedBox && (
      entry.dimensions.length !== selectedBox.dimensions.length ||
      entry.dimensions.width !== selectedBox.dimensions.width ||
      entry.dimensions.height !== selectedBox.dimensions.height ||
      entry.dimensions.unit !== selectedBox.dimensions.unit
    ));

    if (entry.boxId) {
      if (dimsChanged) {
        const created = await createBox({ name: entry.boxName, dimensions: entry.dimensions, stock: 1, price: { amount: 0, currency: "USD" } });
        toast.success(`Nueva caja "${entry.boxName}" creada`);
        return created.id;
      }
      if (nameChanged) {
        await updateBox(entry.boxId, { name: entry.boxName, dimensions: entry.dimensions });
        toast.success(`Caja renombrada a "${entry.boxName}"`);
        return entry.boxId;
      }
      return entry.boxId;
    }

    const existing = await findBoxByName(entry.boxName);
    if (existing) {
      toast.success(`Caja "${entry.boxName}" ya existía, vinculada`);
      return existing.id;
    }

    const created = await createBox({ name: entry.boxName, dimensions: entry.dimensions, stock: 1, price: { amount: 0, currency: "USD" } });
    toast.success(`Caja "${entry.boxName}" creada`);
    return created.id;
  };

  const onSubmit = handleSubmit(async (values) => {
    setIsProcessingBox(true);
    let resolvedBoxIds: string[];

    try {
      resolvedBoxIds = await Promise.all(values.boxes.map(processBoxEntry));
    } catch (err) {
      toast.error(parseApiError(err));
      setIsProcessingBox(false);
      return;
    }

    setIsProcessingBox(false);

    try {
      await onSave({
        providerName: values.providerName,
        deliveryPerson: values.providerDeliveryPerson,
        supplierInvoice: values.supplierInvoice || undefined,
        boxes: values.boxes.map((entry, i) => ({
          boxId: resolvedBoxIds[i],
          dimensions: entry.dimensions,
          weight: entry.weight,
        })),
        officialInvoice: values.officialInvoice,
        status: values.status,
        photos: values.photos,
      });
      toast.success("Paquete actualizado correctamente");
      handleClose();
    } catch (err) {
      toast.error(parseApiError(err));
    }
  });

  const isBusy = isLoading || isProcessingBox;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Paquete</DialogTitle>
          <DialogDescription>
            Modifica los datos del paquete <span className="font-medium">{pkg.id.slice(0, 8)}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-5">

          {/* ── Estado ── */}
          <SectionHeader icon={<Package className="size-4" />} title="Estado" />
          <FormField label="Estado del paquete" error={errors.status?.message}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {warehousePackageStatuses.map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          {/* ── Identificación ── */}
          <SectionHeader icon={<Package className="size-4" />} title="Identificación" />
          <FormField label="Factura oficial" error={errors.officialInvoice?.message}>
            <Input id="officialInvoice" placeholder="FAC-2025-001" {...register("officialInvoice")} />
          </FormField>

          {/* ── Proveedor ── */}
          <SectionHeader icon={<Package className="size-4" />} title="Proveedor" />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nombre del proveedor *" error={errors.providerName?.message}>
              <Input id="providerName" placeholder="Ej: DHL, FedEx..." {...register("providerName")} />
            </FormField>
            <FormField label="Repartidor *" error={errors.providerDeliveryPerson?.message}>
              <Input id="providerDeliveryPerson" placeholder="Nombre del repartidor" {...register("providerDeliveryPerson")} />
            </FormField>
          </div>
          <FormField label="Factura del proveedor" error={errors.supplierInvoice?.message}>
            <Input id="supplierInvoice" placeholder="Ej: PROV-2025-001" {...register("supplierInvoice")} />
          </FormField>

          {/* ── Cajas ── */}
          <div className="flex items-center justify-between">
            <SectionHeader icon={<Box className="size-4" />} title={`Cajas (${fields.length})`} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(defaultBox())}
            >
              <Plus className="size-3 mr-1" /> Añadir caja
            </Button>
          </div>

          {fields.map((field, index) => {
            const watchedEntry = watch(`boxes.${index}`);
            const selectedBox = findSelectedBox(watchedEntry?.boxId);
            const nameChanged = !!(selectedBox && watchedEntry?.boxName && watchedEntry.boxName !== selectedBox.name);
            const dimsChanged = !!(selectedBox && watchedEntry && (
              watchedEntry.dimensions.length !== selectedBox.dimensions.length ||
              watchedEntry.dimensions.width !== selectedBox.dimensions.width ||
              watchedEntry.dimensions.height !== selectedBox.dimensions.height ||
              watchedEntry.dimensions.unit !== selectedBox.dimensions.unit
            ));
            const hasBoxData = watchedEntry?.boxName || watchedEntry?.dimensions.length;
            const boxStatusMessage =
              !watchedEntry?.boxId && hasBoxData ? { text: "Se creará una nueva caja al guardar", icon: Plus }
              : watchedEntry?.boxId && dimsChanged ? { text: "Se creará una nueva caja con estas dimensiones", icon: Plus }
              : watchedEntry?.boxId && nameChanged ? { text: "Se actualizará el nombre de esta caja al guardar", icon: Pencil }
              : null;
            const boxErrors = errors.boxes?.[index];

            return (
              <div key={field.id} className="rounded-md border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Caja {index + 1}</span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>

                {/* Box picker */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Caja existente</Label>
                    {watchedEntry?.boxId && (
                      <Button type="button" variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-destructive" onClick={() => handleBoxClear(index)}>
                        <Eraser className="size-3" />
                      </Button>
                    )}
                  </div>
                  <BoxPickerCombobox
                    value={watchedEntry?.boxId ?? undefined}
                    onChange={(box) => handleBoxSelect(index, box)}
                    placeholder="Buscar caja existente..."
                    className="text-xs h-8"
                    triggerLabel={(b) => (
                      <span className="flex items-center gap-1.5">
                        <Box className="size-3" />
                        {b.name} — {b.dimensions.length}×{b.dimensions.width}×{b.dimensions.height} {b.dimensions.unit}
                      </span>
                    )}
                    itemLabel={(b) => (
                      <div>
                        <div className="font-medium text-sm">{b.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {b.dimensions.length}×{b.dimensions.width}×{b.dimensions.height} {b.dimensions.unit}
                        </div>
                      </div>
                    )}
                  />
                </div>

                <FormField label="Nombre de la caja *" error={boxErrors?.boxName?.message}>
                  <Input placeholder="Se completa al seleccionar, o escribe para crear nueva" className="h-8 text-sm" {...register(`boxes.${index}.boxName`)} />
                </FormField>

                {boxStatusMessage && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <boxStatusMessage.icon className="size-3 shrink-0" />
                    {boxStatusMessage.text}
                  </p>
                )}

                {/* Dimensions */}
                <div className="space-y-1">
                  <Label className="text-xs">Dimensiones *</Label>
                  <div className="grid grid-cols-4 gap-1.5 items-end">
                    {(["length", "width", "height"] as const).map((dim, di) => (
                      <div key={dim} className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{["Largo", "Ancho", "Alto"][di]}</Label>
                        <Input
                          type="number" min="0.1" step="0.1"
                          className="h-8 text-sm"
                          aria-invalid={!!boxErrors?.dimensions?.[dim]}
                          {...register(`boxes.${index}.dimensions.${dim}`, { valueAsNumber: true })}
                        />
                      </div>
                    ))}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Unidad</Label>
                      <Controller
                        name={`boxes.${index}.dimensions.unit`}
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cm">cm</SelectItem>
                              <SelectItem value="in">in</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Weight */}
                <div className="space-y-1">
                  <Label className="text-xs">Peso *</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Input
                      type="number" min="0.01" step="0.01"
                      className="h-8 text-sm"
                      aria-invalid={!!boxErrors?.weight?.value}
                      {...register(`boxes.${index}.weight.value`, { valueAsNumber: true })}
                    />
                    <Controller
                      name={`boxes.${index}.weight.unit`}
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="lb">lb</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  {boxErrors?.weight?.value && <p className="text-xs text-destructive">{boxErrors.weight.value.message}</p>}
                </div>
              </div>
            );
          })}

          {/* ── Fotos ── */}
          <SectionHeader icon={<Camera className="size-4" />} title="Fotos" />
          <Controller
            name="photos"
            control={control}
            render={({ field }) => (
              <PhotosInput value={field.value} onChange={field.onChange} disabled={isBusy} />
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isBusy}>Cancelar</Button>
            <Button type="submit" disabled={isBusy}>{isBusy ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b pb-1">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
    </div>
  );
}
