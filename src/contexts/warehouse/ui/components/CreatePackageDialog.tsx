import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";
import { boxRepository } from "@contexts/inventory/infrastructure/services/boxes/boxRepository";
import { BoxPickerCombobox } from "@contexts/inventory/ui/components/box/BoxPickerCombobox";
import { CustomerPickerCombobox } from "@contexts/sales/ui/components/customer/CustomerPickerCombobox";
import { CustomerFormDialog } from "@contexts/sales/ui/components/customer/CustomerFormDialog";
import { useCustomers } from "@contexts/sales/infrastructure/hooks/customers/useCustomers";
import type { CreateCustomerRequest } from "@contexts/sales/application/customer/CreateCustomerRequest";
import type { CustomerListViewPrimitives } from "@contexts/sales/domain/schemas/customer/CustomerListView";
import { customerPolicies } from "@contexts/shared/domain/policies/customer.policy";
import { createAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import { optionalEmailSchema } from "@contexts/shared/domain/schemas/Email";
import { AddressSection } from "@contexts/shared/ui/components/address/AddressSection";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
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
  Separator,
} from "@contexts/shared/shadcn";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Camera, Eraser, Pencil, Plus, Ruler, Trash2, Truck, User, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PhotosInput } from "./PhotosInput";
import { Controller, FormProvider, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { dimensionsSchema, dimensionUnits } from "../../../shared/domain/schemas/Dimensions";
import { weightSchema, weightUnits } from "../../../shared/domain/schemas/Weight";
import type { BoxPrimitives } from "@contexts/inventory/domain/schemas/box/Box";
import type { CreatePackageRequest } from "../../domain/WarehousePackageSchema";

// ─── Schema ───────────────────────────────────────────────────────────────────

const boxEntrySchema = z.object({
  boxId: z.string().nullable(),
  boxName: z.string().min(1, "Nombre de la caja requerido"),
  dimensions: dimensionsSchema.extend({ unit: z.enum(dimensionUnits) }),
  weight: weightSchema.extend({ unit: z.enum(weightUnits) }),
  count: z.number().int().min(1, "Mínimo 1").max(99, "Máximo 99"),
});

const customerInlineSchema = z.object({
  id: z.string().min(1, "Selecciona un cliente"),
  customerNumber: z.number().nullable().optional(),
  name: z.string().min(1, "Nombre requerido"),
  company: z.string().min(1, "Empresa requerida"),
  email: optionalEmailSchema,
  phone: z.string().min(1, "Teléfono requerido"),
  address: createAddressSchema,
});

const createFormSchema = z.object({
  customer: customerInlineSchema,
  storeId: z.string().min(1, "Tienda requerida"),
  providerName: z.string().min(1, "Nombre del proveedor requerido"),
  officialInvoice: z.string().optional(),
  providerDeliveryPerson: z.string().min(1, "Nombre del repartidor requerido"),
  supplierInvoice: z.string().optional(),
  boxes: z.array(boxEntrySchema).min(1, "Al menos una caja requerida"),
  photos: z.array(z.string()).max(4),
});

type FormValues = z.infer<typeof createFormSchema>;
type BoxEntry = z.infer<typeof boxEntrySchema>;
type CustomerInline = z.infer<typeof customerInlineSchema>;

const emptyCustomer = (): CustomerInline => ({
  id: "",
  customerNumber: null,
  name: "",
  company: "",
  email: null,
  phone: "",
  address: {
    address1: "",
    address2: "",
    city: "",
    province: "",
    zip: "",
    country: "MX",
    reference: "",
    geolocation: { latitude: 0, longitude: 0, placeId: null },
  },
});

const customerFromListView = (c: CustomerListViewPrimitives): CustomerInline => ({
  id: c.id,
  customerNumber: c.customerNumber,
  name: c.name,
  company: c.company,
  email: c.email ?? null,
  phone: c.phone,
  address: {
    address1: c.address.address1,
    address2: c.address.address2,
    city: c.address.city,
    province: c.address.province,
    zip: c.address.zip,
    country: c.address.country,
    reference: c.address.reference,
    geolocation: c.address.geolocation,
  },
});

const defaultBox = (): BoxEntry => ({
  boxId: null,
  boxName: "",
  dimensions: { length: 0, width: 0, height: 0, unit: "cm" },
  weight: { value: 0, unit: "kg" },
  count: 1,
});

function getDefaults(storeId: string): FormValues {
  return {
    customer: emptyCustomer(),
    storeId,
    providerName: "",
    officialInvoice: "",
    providerDeliveryPerson: "",
    supplierInvoice: "",
    boxes: [defaultBox()],
    photos: [],
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreatePackageRequest) => Promise<void>;
  isLoading?: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CreatePackageDialog({ open, onClose, onSave, isLoading }: Props) {
  const { user } = useAuth();
  const { createBox, updateBox } = useBoxes({ enabled: false });
  const {
    createCustomer,
    updateCustomer,
    isCreating: isCreatingCustomer,
    isUpdating: isUpdatingCustomer,
  } = useCustomers({ enabled: false });
  const canCreateCustomer = user ? customerPolicies.create(user) : false;

  const [isProcessingBox, setIsProcessingBox] = useState(false);
  const [customerFormOpen, setCustomerFormOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: getDefaults(user?.storeId ?? ""),
  });
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
    formState: { errors, dirtyFields },
  } = form;

  const { fields, append, remove } = useFieldArray({ control, name: "boxes" });

  const watchedBoxes = watch("boxes");
  const selectedCustomerId = watch("customer.id");

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
      reset(getDefaults(user?.storeId ?? ""));
    }
  }, [open, user?.storeId, reset]);

  const handleClose = () => {
    onClose();
  };

  const handleSelectCustomer = (c: CustomerListViewPrimitives) => {
    reset(
      { ...getValues(), customer: customerFromListView(c) },
      { keepDefaultValues: false },
    );
  };

  const handleClearCustomer = () => {
    reset(
      { ...getValues(), customer: emptyCustomer() },
      { keepDefaultValues: false },
    );
  };

  const handleCreateCustomer = async (data: CreateCustomerRequest) => {
    try {
      const created = await createCustomer(data);
      handleSelectCustomer({
        id: created.id,
        customerNumber: created.customerNumber,
        name: created.name,
        company: created.company,
        email: created.email,
        phone: created.phone,
        address: created.address,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        store: { id: created.registeredByStoreId } as CustomerListViewPrimitives["store"],
        user: null,
      });
      setCustomerFormOpen(false);
      toast.success("Cliente creado correctamente");
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const handleBoxSelect = (index: number, box: BoxPrimitives) => {
    setValue(`boxes.${index}.boxId`, box.id, { shouldValidate: true });
    setValue(`boxes.${index}.boxName`, box.name);
    setValue(`boxes.${index}.dimensions.length`, box.dimensions.length, { shouldValidate: true });
    setValue(`boxes.${index}.dimensions.width`, box.dimensions.width, { shouldValidate: true });
    setValue(`boxes.${index}.dimensions.height`, box.dimensions.height, { shouldValidate: true });
    setValue(`boxes.${index}.dimensions.unit`, box.dimensions.unit);
  };

  const handleBoxClear = (index: number) => {
    setValue(`boxes.${index}.boxId`, null, { shouldValidate: true });
    setValue(`boxes.${index}.boxName`, "");
    setValue(`boxes.${index}.dimensions.length`, 0);
    setValue(`boxes.${index}.dimensions.width`, 0);
    setValue(`boxes.${index}.dimensions.height`, 0);
    setValue(`boxes.${index}.dimensions.unit`, "cm");
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

    const customerDirty = dirtyFields.customer;
    const customerChanged =
      !!customerDirty &&
      ["name", "company", "phone", "address"].some(
        (k) => (customerDirty as Record<string, unknown>)[k],
      );

    if (customerChanged) {
      try {
        await updateCustomer(values.customer.id, {
          name: values.customer.name,
          company: values.customer.company,
          phone: values.customer.phone,
          address: values.customer.address,
        });
        toast.success(`Datos del cliente "${values.customer.name}" actualizados`);
      } catch (err) {
        toast.error(parseApiError(err));
        return;
      }
    }

    try {
      await onSave({
        customerId: values.customer.id,
        storeId: values.storeId,
        providerName: values.providerName,
        deliveryPerson: values.providerDeliveryPerson,
        supplierInvoice: values.supplierInvoice || undefined,
        boxes: values.boxes.flatMap((entry, i) =>
          Array.from({ length: entry.count }, () => ({
            boxId: resolvedBoxIds[i],
            dimensions: entry.dimensions,
            weight: entry.weight,
          }))
        ),
        officialInvoice: values.officialInvoice,
        photos: values.photos,
      });
      toast.success("Paquete registrado correctamente");
      handleClose();
    } catch (err) {
      toast.error(parseApiError(err));
    }
  });

  const isBusy = isLoading || isProcessingBox || isUpdatingCustomer;

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">Registrar Paquete</DialogTitle>
          <DialogDescription>Ingresa los datos del nuevo paquete en bodega.</DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={onSubmit} noValidate className="flex flex-col overflow-hidden flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr] gap-0 lg:gap-0 lg:divide-x overflow-y-auto flex-1 pr-1">

            {/* ── Columna 1: Cliente + Proveedor ── */}
            <div className="space-y-4 lg:pr-6 pb-4 lg:pb-0 px-2 min-w-0">
              <SectionHeader icon={<User className="size-4" />} title="Cliente" />

              <FormField label="Buscar cliente *" error={errors.customer?.id?.message}>
                <div className="flex gap-2">
                  <div className="flex-1 min-w-0">
                    <CustomerPickerCombobox
                      value={selectedCustomerId || undefined}
                      onChange={handleSelectCustomer}
                      error={!!errors.customer?.id}
                      triggerLabel={(c) => (
                        <span className="flex items-center gap-2 truncate">
                          <User className="size-4 shrink-0" />
                          <span className="truncate">{c.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">— {c.company}</span>
                        </span>
                      )}
                      itemLabel={(c) => (
                        <span className="flex items-center gap-2 truncate">
                          <User className="size-4 shrink-0" />
                          <span className="truncate">{c.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">— {c.company}</span>
                        </span>
                      )}
                    />
                  </div>
                  {selectedCustomerId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={handleClearCustomer}
                      title="Quitar cliente"
                    >
                      <Eraser className="size-4" />
                    </Button>
                  )}
                  {canCreateCustomer && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setCustomerFormOpen(true)}
                      title="Crear cliente"
                    >
                      <UserPlus className="size-4" />
                    </Button>
                  )}
                </div>
              </FormField>

              {selectedCustomerId && (
                <>
                  <div className="grid grid-cols-2 gap-3 min-w-0">
                    <FormField label="Nombre *" error={errors.customer?.name?.message}>
                      <Input {...register("customer.name")} aria-invalid={!!errors.customer?.name} />
                    </FormField>
                    <FormField label="Empresa *" error={errors.customer?.company?.message}>
                      <Input {...register("customer.company")} aria-invalid={!!errors.customer?.company} />
                    </FormField>
                  </div>
                  <FormField label="Teléfono *" error={errors.customer?.phone?.message}>
                    <Input {...register("customer.phone")} aria-invalid={!!errors.customer?.phone} />
                  </FormField>
                  <div className="border-t pt-3">
                    <AddressSection fieldPrefix="customer.address" labelPrefix="Cliente" />
                  </div>
                </>
              )}

              <Separator />
              <SectionHeader icon={<Truck className="size-4" />} title="Proveedor" />

              <FormField label="Nombre del proveedor *" error={errors.providerName?.message}>
                <Input id="providerName" placeholder="Ej: DHL, FedEx..." {...register("providerName")} />
              </FormField>

              <FormField label="Repartidor *" error={errors.providerDeliveryPerson?.message}>
                <Input id="providerDeliveryPerson" placeholder="Nombre del repartidor" {...register("providerDeliveryPerson")} />
              </FormField>

              <FormField label="Factura del proveedor" error={errors.supplierInvoice?.message}>
                <Input id="supplierInvoice" placeholder="Ej: PROV-2025-001" {...register("supplierInvoice")} />
              </FormField>

              <FormField label="Factura oficial" error={errors.officialInvoice?.message}>
                <Input id="officialInvoice" placeholder="FAC-2025-001" {...register("officialInvoice")} />
              </FormField>
            </div>

            {/* ── Columna 2: Cajas ── */}
            <div className="space-y-4 lg:px-6 pb-4 lg:pb-0 pt-4 lg:pt-0 border-t lg:border-t-0 overflow-y-auto min-w-0">
              <div className="flex items-center justify-between">
                <SectionHeader icon={<Box className="size-4" />} title={`Cajas (${watchedBoxes.reduce((sum, b) => sum + (b?.count ?? 1), 0)})`} />
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
                  !watchedEntry?.boxId && hasBoxData ? { text: "Se creará una nueva caja al registrar", icon: Plus }
                  : watchedEntry?.boxId && dimsChanged ? { text: "Se creará una nueva caja con estas dimensiones", icon: Plus }
                  : watchedEntry?.boxId && nameChanged ? { text: "Se actualizará el nombre de esta caja al registrar", icon: Pencil }
                  : null;
                const boxErrors = errors.boxes?.[index];

                return (
                  <div key={field.id} className="rounded-md border p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">
                        Caja {index + 1}
                        {(watchedBoxes[index]?.count ?? 1) > 1 && (
                          <span className="ml-1.5 text-primary normal-case font-medium">×{watchedBoxes[index]?.count}</span>
                        )}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs text-muted-foreground">Cantidad</Label>
                        <Input
                          type="number"
                          min="1"
                          max="99"
                          className="h-6 w-14 text-xs text-center px-1"
                          {...register(`boxes.${index}.count`, { valueAsNumber: true })}
                        />
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
                      <Input placeholder="Selecciona o escribe para crear nueva" className="h-8 text-sm" {...register(`boxes.${index}.boxName`)} />
                    </FormField>

                    {boxStatusMessage && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <boxStatusMessage.icon className="size-3 shrink-0" />
                        {boxStatusMessage.text}
                      </p>
                    )}

                    {/* Dimensions */}
                    <div className="space-y-1">
                      <Label className="text-xs">
                        <Ruler className="size-3 inline mr-1" />Dimensiones *
                      </Label>
                      <div className="grid grid-cols-4 gap-1.5 items-end">
                        {(["length", "width", "height"] as const).map((dim, di) => (
                          <div key={dim} className="space-y-1">
                            <Label className="text-xs text-muted-foreground">{["Largo", "Ancho", "Alto"][di]}</Label>
                            <Input
                              type="number" min="0.1" step="0.1" placeholder="0"
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
                          type="number" min="0.01" step="0.01" placeholder="0.00"
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
            </div>

            {/* ── Columna 3: Fotos ── */}
            <div className="space-y-4 lg:pl-6 pt-4 lg:pt-0 border-t lg:border-t-0 min-w-0">
              <SectionHeader icon={<Camera className="size-4" />} title="Fotos" />
              <p className="text-xs text-muted-foreground">Agrega hasta 4 fotos del paquete recibido.</p>
              <Controller
                name="photos"
                control={control}
                render={({ field }) => (
                  <PhotosInput value={field.value} onChange={field.onChange} disabled={isBusy} />
                )}
              />
            </div>
          </div>

          <Separator className="my-4 shrink-0" />

          <DialogFooter className="shrink-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isBusy}>Cancelar</Button>
            <Button type="submit" disabled={isBusy}>{isBusy ? "Guardando..." : "Registrar"}</Button>
          </DialogFooter>
        </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
    <CustomerFormDialog
      open={customerFormOpen}
      onClose={() => setCustomerFormOpen(false)}
      onSave={handleCreateCustomer}
      isLoading={isCreatingCustomer}
    />
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 min-w-0">
      <Label className="truncate block">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive break-words">{error}</p>}
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</span>
    </div>
  );
}
