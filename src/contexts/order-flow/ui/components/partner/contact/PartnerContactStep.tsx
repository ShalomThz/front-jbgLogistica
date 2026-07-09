import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
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
} from "@contexts/shared/shadcn";
import { Check, ChevronsUpDown, PackageOpen, Store } from "lucide-react";
import { useMemo, useState, type UIEvent } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { useInfiniteStores } from "@contexts/iam/infrastructure/hooks/stores/useInfiniteStores";
import { useStores } from "@contexts/iam/infrastructure/hooks/stores/useStores";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { iamPolicies } from "@contexts/shared/domain/policies/iam.policy";
import { useDebouncedValue } from "@contexts/shared/infrastructure/hooks/useDebouncedValue";
import type { PartnerOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { ContactColumn } from "../../shared/ContactColumn";

interface PartnerContactStepProps {
  selectedStoreId?: string;
  onStoreChange?: (storeId: string) => void;
}

export function PartnerContactStep({ selectedStoreId, onStoreChange }: PartnerContactStepProps = {}) {
  const { register, control, clearErrors, formState: { errors } } = useFormContext<PartnerOrderFormValues>();
  const { user } = useAuth();
  const canPickStore = user ? iamPolicies.listStores(user) : false;
  const [storeOpen, setStoreOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const {
    stores,
    isLoading: isLoadingStores,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteStores({
    search: debouncedSearch.trim() || undefined,
    limit: 10,
    enabled: storeOpen,
  });

  const selectedFilters = useMemo(
    () =>
      selectedStoreId
        ? [{ field: "id", filterOperator: "=" as const, value: selectedStoreId }]
        : [],
    [selectedStoreId],
  );

  const { stores: selectedStoreResult } = useStores({
    filters: selectedFilters,
    enabled: !!selectedStoreId,
  });

  const selectedStoreName =
    stores.find((s) => s.id === selectedStoreId)?.name ??
    selectedStoreResult[0]?.name;

  const handleListScroll = (e: UIEvent<HTMLDivElement>) => {
    if (!hasNextPage || isFetchingNextPage) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      fetchNextPage();
    }
  };

  return (
    <>
      <Card className="mb-6 shadow-none transition-shadow focus-within:shadow-md focus-within:shadow-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Información de la Orden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-1">
            <Label htmlFor="store-select">Tienda *</Label>
            {onStoreChange && canPickStore ? (
              <Popover open={storeOpen} onOpenChange={setStoreOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="store-select"
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={storeOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedStoreName ? (
                      selectedStoreName
                    ) : (
                      <span className="text-muted-foreground">Selecciona una tienda</span>
                    )}
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar tienda..."
                      value={search}
                      onValueChange={setSearch}
                    />
                    <CommandList onScroll={handleListScroll}>
                      {isLoadingStores && (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          Buscando...
                        </div>
                      )}
                      {!isLoadingStores && (
                        <CommandEmpty>No se encontraron tiendas.</CommandEmpty>
                      )}
                      <CommandGroup>
                        {stores.map((store) => (
                          <CommandItem
                            key={store.id}
                            value={store.id}
                            onSelect={() => {
                              onStoreChange(store.id);
                              setStoreOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 size-4",
                                selectedStoreId === store.id ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {store.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      {isFetchingNextPage && (
                        <div className="py-2 text-center text-xs text-muted-foreground">
                          Cargando más...
                        </div>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <div className="flex h-9 items-center gap-2 rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                <Store className="size-4" />
                {selectedStoreName ?? user?.store.name ?? "—"}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="partner-number">Número de Agente </Label>
            <Input
              id="partner-number"
              aria-invalid={!!errors.orderData?.partnerOrderNumber}
              placeholder="Ej: PART-567890"
              {...register("orderData.partnerOrderNumber", {
                onChange: () => clearErrors("orderData.partnerOrderNumber"),
              })}
            />
            {errors.orderData?.partnerOrderNumber && (
              <p className="text-sm text-destructive">{errors.orderData.partnerOrderNumber.message}</p>
            )}
          </div>
          <Controller
            control={control}
            name="emptyBoxDelivery"
            render={({ field }) => (
              <label
                htmlFor="empty-box-delivery"
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                  field.value
                    ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30"
                    : "hover:bg-muted/40",
                )}
              >
                <Checkbox
                  id="empty-box-delivery"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-0.5 data-[state=checked]:border-amber-500 data-[state=checked]:bg-amber-500"
                />
                <span className="space-y-0.5">
                  <span
                    className={cn(
                      "flex items-center gap-1.5 text-sm font-medium",
                      field.value && "text-amber-700 dark:text-amber-400",
                    )}
                  >
                    <PackageOpen className="size-4" />
                    Dejar caja vacía a domicilio
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    El chofer deja la caja al cliente y se recolecta después, ya
                    empacada, para llevarla a bodega.
                  </span>
                </span>
              </label>
            )}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContactColumn fieldPrefix="sender" title="Remitente" />
        <ContactColumn fieldPrefix="recipient" title="Destinatario" />
      </div>
    </>
  );
}
