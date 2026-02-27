import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";
import { useCustomers } from "@contexts/sales/infrastructure/hooks/customers/useCustomers";
import { parseApiError } from "@contexts/shared/infrastructure/http/parseApiError";
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Camera, Check, ChevronsUpDown, Eraser, Package, Pencil, Plus, Search, User } from "lucide-react";
import { useEffect, useState } from "react";
import { PhotosInput } from "./PhotosInput";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { dimensionsSchema, dimensionUnits } from "../../../shared/domain/schemas/Dimensions";
import { weightSchema, weightUnits } from "../../../shared/domain/schemas/Weight";
import type { CreatePackageRequest } from "../../domain/WarehousePackageSchema";

// ─── Schema ───────────────────────────────────────────────────────────────────

const createFormSchema = z.object({
  customerId: z.string().min(1, "Selecciona un cliente"),
  storeId: z.string().min(1, "Tienda requerida"),
  providerName: z.string().min(1, "Nombre del proveedor requerido"),
  boxId: z.string().nullable(),
  boxName: z.string().min(1, "Nombre de la caja requerido"),
  officialInvoice: z.string().min(1, "Factura requerida"),
  providerDeliveryPerson: z.string().min(1, "Nombre del repartidor requerido"),
  dimensions: dimensionsSchema.extend({ unit: z.enum(dimensionUnits) }),
  weight: weightSchema.extend({ unit: z.enum(weightUnits) }),
  photos: z.array(z.string()).max(4)
});

type FormValues = z.infer<typeof createFormSchema>;

// ─── Defaults ─────────────────────────────────────────────────────────────────

function getDefaults(storeId: string): FormValues {
  return {
    customerId: "",
    storeId,
    providerName: "",
    boxId: null,
    boxName: "",
    officialInvoice: "",
    providerDeliveryPerson: "",
    dimensions: { length: 0, width: 0, height: 0, unit: "cm" },
    weight: { value: 0, unit: "kg" },
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
  const { customers, isLoading: isLoadingCustomers } = useCustomers({ page: 1, limit: 100 });
  const { boxes, createBox, updateBox, isLoading: isLoadingBoxes } = useBoxes({ page: 1, limit: 100 });

  const [customerSearch, setCustomerSearch] = useState("");
  const [boxOpen, setBoxOpen] = useState(false);
  const [isProcessingBox, setIsProcessingBox] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: getDefaults(user?.storeId ?? ""),
  });

  useEffect(() => {
    if (open) {
      reset(getDefaults(user?.storeId ?? ""));
    }
  }, [open, user?.storeId, reset]);

  const handleClose = () => {
    setCustomerSearch("");
    setBoxOpen(false);
    onClose();
  };

  const watchedCustomerId = useWatch({ control, name: "customerId" });
  const watchedBoxId = useWatch({ control, name: "boxId" });
  const watchedBoxName = useWatch({ control, name: "boxName" });
  const watchedDims = useWatch({ control, name: "dimensions" });

  const selectedCustomer = customers.find((c) => c.id === watchedCustomerId);
  const selectedBox = boxes.find((b) => b.id === watchedBoxId);

  const filteredCustomers = customers.filter(
    (c) =>
      customerSearch === "" ||
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.company.toLowerCase().includes(customerSearch.toLowerCase()),
  );

  // ── Box status indicator ──────────────────────────────────────────────────
  const nameChanged = !!(selectedBox && watchedBoxName && watchedBoxName !== selectedBox.name);
  const dimsChanged = !!(selectedBox &&
    (watchedDims.length !== selectedBox.dimensions.length ||
      watchedDims.width !== selectedBox.dimensions.width ||
      watchedDims.height !== selectedBox.dimensions.height ||
      watchedDims.unit !== selectedBox.dimensions.unit));

  const hasBoxData = watchedBoxName || watchedDims.length || watchedDims.width || watchedDims.height;
  const boxStatusMessage =
    !watchedBoxId && hasBoxData
      ? { text: "Se creará una nueva caja al registrar", icon: Plus }
      : watchedBoxId && dimsChanged
        ? { text: "Se creará una nueva caja con estas dimensiones", icon: Plus }
        : watchedBoxId && nameChanged
          ? { text: "Se actualizará el nombre de esta caja al registrar", icon: Pencil }
          : null;

  // ── Box combobox handlers ─────────────────────────────────────────────────
  const handleBoxSelect = (box: (typeof boxes)[number]) => {
    setValue("boxId", box.id, { shouldValidate: true });
    setValue("boxName", box.name);
    setValue("dimensions.length", box.dimensions.length, { shouldValidate: true });
    setValue("dimensions.width", box.dimensions.width, { shouldValidate: true });
    setValue("dimensions.height", box.dimensions.height, { shouldValidate: true });
    setValue("dimensions.unit", box.dimensions.unit);
    setBoxOpen(false);
  };

  const handleBoxClear = () => {
    setValue("boxId", null, { shouldValidate: true });
    setValue("boxName", "");
    setValue("dimensions.length", 0);
    setValue("dimensions.width", 0);
    setValue("dimensions.height", 0);
    setValue("dimensions.unit", "cm");
  };

  // ── Submit: process box then call onSave ──────────────────────────────────
  const onSubmit = handleSubmit(async (values) => {
    setIsProcessingBox(true);
    let resolvedBoxId = values.boxId;

    try {
      if (values.boxId) {
        if (dimsChanged) {
          // Dims changed → create a new box, never mutate the original
          const created = await createBox({
            name: values.boxName,
            dimensions: values.dimensions,
            stock: 1,
            price: { amount: 0, currency: "USD" },
          });
          resolvedBoxId = created.id;
          toast.success(`Nueva caja "${values.boxName}" creada`);
        } else if (nameChanged) {
          // Only name changed → rename existing box
          await updateBox(values.boxId, {
            name: values.boxName,
            dimensions: values.dimensions,
          });
          resolvedBoxId = values.boxId;
          toast.success(`Caja renombrada a "${values.boxName}"`);
        } else {
          // Nothing changed → keep existing
          resolvedBoxId = values.boxId;
        }
      } else {
        // No box selected — find by name or create
        const existing = boxes.find(
          (b) => b.name.toLowerCase() === values.boxName.toLowerCase(),
        );
        if (existing) {
          resolvedBoxId = existing.id;
          toast.success(`Caja "${values.boxName}" ya existía, vinculada`);
        } else {
          const created = await createBox({
            name: values.boxName,
            dimensions: values.dimensions,
            stock: 1,
            price: { amount: 0, currency: "USD" },
          });
          resolvedBoxId = created.id;
          toast.success(`Caja "${values.boxName}" creada`);
        }
      }
    } catch (err) {
      toast.error(parseApiError(err));
      setIsProcessingBox(false);
      return;
    }

    setIsProcessingBox(false);

    try {
      await onSave({
        customerId: values.customerId,
        storeId: values.storeId,
        providerName: values.providerName,
        boxId: resolvedBoxId!,
        officialInvoice: values.officialInvoice,
        providerDeliveryPerson: values.providerDeliveryPerson,
        dimensions: values.dimensions,
        weight: values.weight,
        photos: values.photos,
      });
      toast.success("Paquete registrado correctamente");
      handleClose();
    } catch (err) {
      toast.error(parseApiError(err));
    }
  });

  const dimsError =
    errors.dimensions?.length?.message ??
    errors.dimensions?.width?.message ??
    errors.dimensions?.height?.message;

  const isBusy = isLoading || isProcessingBox;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Paquete</DialogTitle>
          <DialogDescription>
            Ingresa los datos del nuevo paquete en bodega.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-5">

          {/* ── Sección: Identificación ── */}
          <SectionHeader icon={<Package className="size-4" />} title="Identificación" />

          {/* ── Customer ── */}
          <FormField label="Cliente *" error={errors.customerId?.message}>
            <Controller
              name="customerId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!errors.customerId}>
                    <SelectValue placeholder="Seleccionar cliente">
                      {selectedCustomer ? (
                        <span className="flex items-center gap-2">
                          <User className="size-4" />
                          {selectedCustomer.name}
                          <span className="text-xs text-muted-foreground">
                            — {selectedCustomer.company}
                          </span>
                        </span>
                      ) : (
                        "Seleccionar cliente"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar cliente..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    {isLoadingCustomers ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Cargando clientes...
                      </div>
                    ) : filteredCustomers.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No se encontraron clientes
                      </div>
                    ) : (
                      filteredCustomers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="flex items-center gap-2">
                            <User className="size-4" />
                            <span>{c.name}</span>
                            <span className="text-xs text-muted-foreground">
                              — {c.company}
                            </span>
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          {/* ── Official invoice ── */}
          <FormField label="Factura oficial *" error={errors.officialInvoice?.message}>
            <Input
              id="officialInvoice"
              placeholder="FAC-2025-001"
              aria-invalid={!!errors.officialInvoice}
              {...register("officialInvoice")}
            />
          </FormField>

          {/* ── Sección: Proveedor ── */}
          <SectionHeader icon={<Package className="size-4" />} title="Proveedor" />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nombre del proveedor *" error={errors.providerName?.message}>
              <Input
                id="providerName"
                placeholder="Ej: DHL, FedEx..."
                aria-invalid={!!errors.providerName}
                {...register("providerName")}
              />
            </FormField>

            <FormField label="Repartidor *" error={errors.providerDeliveryPerson?.message}>
              <Input
                id="providerDeliveryPerson"
                placeholder="Nombre del repartidor"
                aria-invalid={!!errors.providerDeliveryPerson}
                {...register("providerDeliveryPerson")}
              />
            </FormField>
          </div>

          {/* ── Sección: Embalaje ── */}
          <SectionHeader icon={<Box className="size-4" />} title="Embalaje" />

          {/* ── Box combobox ── */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Caja</Label>
              {watchedBoxId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  onClick={handleBoxClear}
                >
                  <Eraser className="size-4" />
                </Button>
              )}
            </div>
            <Popover open={boxOpen} onOpenChange={setBoxOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={boxOpen}
                  className="w-full justify-between font-normal"
                >
                  {isLoadingBoxes ? (
                    <span className="text-muted-foreground">Cargando cajas...</span>
                  ) : selectedBox ? (
                    <span className="flex items-center gap-2">
                      <Box className="size-4" />
                      {selectedBox.name} — {selectedBox.dimensions.length}×
                      {selectedBox.dimensions.width}×{selectedBox.dimensions.height}{" "}
                      {selectedBox.dimensions.unit}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Buscar caja existente...</span>
                  )}
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar por nombre..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron cajas.</CommandEmpty>
                    <CommandGroup>
                      {boxes.map((box) => (
                        <CommandItem
                          key={box.id}
                          value={box.name}
                          onSelect={() => handleBoxSelect(box)}
                        >
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              watchedBoxId === box.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div>
                            <div className="font-medium">{box.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {box.dimensions.length}×{box.dimensions.width}×
                              {box.dimensions.height} {box.dimensions.unit}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* ── Box name ── */}
          <FormField label="Nombre de la caja *" error={errors.boxName?.message}>
            <Input
              id="boxName"
              placeholder="Se completa al seleccionar, o escribe para crear nueva"
              aria-invalid={!!errors.boxName}
              {...register("boxName")}
            />
          </FormField>

          {/* ── Box status indicator ── */}
          {boxStatusMessage && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground -mt-2">
              <boxStatusMessage.icon className="size-3 shrink-0" />
              {boxStatusMessage.text}
            </p>
          )}

          {/* ── Dimensions ── */}
          <div className="space-y-1">
            <Label>Dimensiones *</Label>
            <div className="grid grid-cols-4 gap-2 items-end">
              <div className="space-y-1">
                <Label htmlFor="dim-length" className="text-xs text-muted-foreground">
                  Largo
                </Label>
                <Input
                  id="dim-length"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="0"
                  aria-invalid={!!errors.dimensions?.length}
                  {...register("dimensions.length", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dim-width" className="text-xs text-muted-foreground">
                  Ancho
                </Label>
                <Input
                  id="dim-width"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="0"
                  aria-invalid={!!errors.dimensions?.width}
                  {...register("dimensions.width", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dim-height" className="text-xs text-muted-foreground">
                  Alto
                </Label>
                <Input
                  id="dim-height"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="0"
                  aria-invalid={!!errors.dimensions?.height}
                  {...register("dimensions.height", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Unidad</Label>
                <Controller
                  name="dimensions.unit"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="in">in</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            {dimsError && <p className="text-xs text-destructive">{dimsError}</p>}
          </div>

          {/* ── Weight ── */}
          <div className="space-y-1">
            <Label>Peso *</Label>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="weight-value" className="text-xs text-muted-foreground">
                  Valor
                </Label>
                <Input
                  id="weight-value"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  aria-invalid={!!errors.weight?.value}
                  {...register("weight.value", { valueAsNumber: true })}
                />
              </div>
              <div className="w-24 space-y-1">
                <Label className="text-xs text-muted-foreground">Unidad</Label>
                <Controller
                  name="weight.unit"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lb">lb</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            {errors.weight?.value && (
              <p className="text-xs text-destructive">{errors.weight.value.message}</p>
            )}
          </div>

          {/* ── Sección: Fotos ── */}
          <SectionHeader icon={<Camera className="size-4" />} title="Fotos" />

          <Controller
            name="photos"
            control={control}
            render={({ field }) => (
              <PhotosInput
                value={field.value}
                onChange={field.onChange}
                disabled={isBusy}
              />
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isBusy}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isBusy}>
              {isBusy ? "Guardando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
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
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </span>
    </div>
  );
}
