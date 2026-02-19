import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@contexts/shared/shadcn";
import { Check, ChevronsUpDown, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import {
  useSkydropxCategories,
  useSkydropxSubcategories,
  useSkydropxClasses,
  useSkydropxPackagings,
} from "@contexts/order-flow/infrastructure/hooks/useSkydropx";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";

export function ProductTypeSelector() {
  const { setValue, formState: { errors } } = useFormContext<NewOrderFormValues>();

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subcategoryOpen, setSubcategoryOpen] = useState(false);
  const [classOpen, setClassOpen] = useState(false);
  const [packagingOpen, setPackagingOpen] = useState(false);

  const skydropxCategoryId = useWatch<NewOrderFormValues, "package.skydropxCategoryId">({ name: "package.skydropxCategoryId" });
  const skydropxSubcategoryId = useWatch<NewOrderFormValues, "package.skydropxSubcategoryId">({ name: "package.skydropxSubcategoryId" });
  const consignmentNoteClassCode = useWatch<NewOrderFormValues, "package.consignmentNoteClassCode">({ name: "package.consignmentNoteClassCode" });
  const consignmentNotePackagingCode = useWatch<NewOrderFormValues, "package.consignmentNotePackagingCode">({ name: "package.consignmentNotePackagingCode" });

  const { categories, isLoading: isLoadingCategories, refetch: refetchCategories } = useSkydropxCategories();
  const { subcategories, isLoading: isLoadingSubcategories, refetch: refetchSubcategories } = useSkydropxSubcategories(
    skydropxCategoryId || null,
  );
  const { classes, isLoading: isLoadingClasses, refetch: refetchClasses } = useSkydropxClasses(
    skydropxSubcategoryId || null,
  );
  const { packagings, isLoading: isLoadingPackagings, refetch: refetchPackagings } = useSkydropxPackagings();

  const isRefetching = isLoadingCategories || isLoadingSubcategories || isLoadingClasses || isLoadingPackagings;

  function handleRetry() {
    refetchCategories();
    if (skydropxCategoryId) refetchSubcategories();
    if (skydropxSubcategoryId) refetchClasses();
    refetchPackagings();
  }

  const selectedCategory = categories.find((c) => c.id === skydropxCategoryId);
  const selectedSubcategory = subcategories.find((s) => s.id === skydropxSubcategoryId);
  const selectedClass = classes.find((c) => c.attributes.code === consignmentNoteClassCode);
  const selectedPackaging = packagings.find((p) => p.attributes.code === consignmentNotePackagingCode);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-muted-foreground">
          Tipo de producto
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRetry}
          disabled={isRefetching}
          className="h-7 gap-1.5"
        >
          <RefreshCw className={cn("size-3.5", isRefetching && "animate-spin")} />
          Actualizar
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Selecciona la clasificación de tu producto para la carta porte
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Categoría */}
        <div>
          <Label>Categoría *</Label>
          <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={categoryOpen}
                className="w-full justify-between font-normal"
              >
                {isLoadingCategories ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Cargando...
                  </span>
                ) : selectedCategory ? (
                  <span className="truncate">{selectedCategory.attributes.name}</span>
                ) : (
                  <span className="text-muted-foreground">Buscar categoría...</span>
                )}
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar categoría..." />
                <CommandList>
                  <CommandEmpty>Sin resultados.</CommandEmpty>
                  <CommandGroup>
                    {categories.map((cat) => (
                      <CommandItem
                        key={cat.id}
                        value={cat.attributes.name}
                        onSelect={() => {
                          setValue("package.skydropxCategoryId", cat.id);
                          setValue("package.skydropxSubcategoryId", "");
                          setValue("package.consignmentNoteClassCode", "");
                          setCategoryOpen(false);
                        }}
                      >
                        <Check className={cn("mr-2 size-4", skydropxCategoryId === cat.id ? "opacity-100" : "opacity-0")} />
                        {cat.attributes.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Subcategoría */}
        <div>
          <Label>Subcategoría *</Label>
          <Popover open={subcategoryOpen} onOpenChange={setSubcategoryOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={subcategoryOpen}
                disabled={!skydropxCategoryId}
                className="w-full justify-between font-normal"
              >
                {isLoadingSubcategories ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Cargando...
                  </span>
                ) : selectedSubcategory ? (
                  <span className="truncate">{selectedSubcategory.attributes.name}</span>
                ) : (
                  <span className="text-muted-foreground">Buscar subcategoría...</span>
                )}
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar subcategoría..." />
                <CommandList>
                  <CommandEmpty>Sin resultados.</CommandEmpty>
                  <CommandGroup>
                    {subcategories.map((sub) => (
                      <CommandItem
                        key={sub.id}
                        value={sub.attributes.name}
                        onSelect={() => {
                          setValue("package.skydropxSubcategoryId", sub.id);
                          setValue("package.consignmentNoteClassCode", "");
                          setSubcategoryOpen(false);
                        }}
                      >
                        <Check className={cn("mr-2 size-4", skydropxSubcategoryId === sub.id ? "opacity-100" : "opacity-0")} />
                        {sub.attributes.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Clase */}
        <div>
          <Label>Clase *</Label>
          <Popover open={classOpen} onOpenChange={setClassOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={classOpen}
                aria-invalid={!!errors.package?.consignmentNoteClassCode}
                disabled={!skydropxSubcategoryId}
                className="w-full justify-between font-normal"
              >
                {isLoadingClasses ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Cargando...
                  </span>
                ) : selectedClass ? (
                  <span className="truncate">{selectedClass.attributes.code} — {selectedClass.attributes.name}</span>
                ) : (
                  <span className="text-muted-foreground">Buscar clase...</span>
                )}
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar por código o nombre..." />
                <CommandList>
                  <CommandEmpty>Sin resultados.</CommandEmpty>
                  <CommandGroup>
                    {classes.map((cls) => (
                      <CommandItem
                        key={cls.id}
                        value={`${cls.attributes.code} ${cls.attributes.name}`}
                        onSelect={() => {
                          setValue("package.consignmentNoteClassCode", cls.attributes.code, { shouldValidate: true });
                          setClassOpen(false);
                        }}
                      >
                        <Check className={cn("mr-2 size-4", consignmentNoteClassCode === cls.attributes.code ? "opacity-100" : "opacity-0")} />
                        <div>
                          <div className="font-medium">{cls.attributes.code}</div>
                          <div className="text-xs text-muted-foreground">{cls.attributes.name}</div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {errors.package?.consignmentNoteClassCode && <p className="text-sm text-destructive">{errors.package.consignmentNoteClassCode.message}</p>}
        </div>

        {/* Empaque */}
        <div>
          <Label>Empaque *</Label>
          <Popover open={packagingOpen} onOpenChange={setPackagingOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={packagingOpen}
                aria-invalid={!!errors.package?.consignmentNotePackagingCode}
                className="w-full justify-between font-normal"
              >
                {isLoadingPackagings ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Cargando...
                  </span>
                ) : selectedPackaging ? (
                  <span className="truncate">{selectedPackaging.attributes.code} — {selectedPackaging.attributes.name}</span>
                ) : (
                  <span className="text-muted-foreground">Buscar empaque...</span>
                )}
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar por código o nombre..." />
                <CommandList>
                  <CommandEmpty>Sin resultados.</CommandEmpty>
                  <CommandGroup>
                    {packagings.map((pkg) => (
                      <CommandItem
                        key={pkg.id}
                        value={`${pkg.attributes.code} ${pkg.attributes.name}`}
                        onSelect={() => {
                          setValue("package.consignmentNotePackagingCode", pkg.attributes.code, { shouldValidate: true });
                          setPackagingOpen(false);
                        }}
                      >
                        <Check className={cn("mr-2 size-4", consignmentNotePackagingCode === pkg.attributes.code ? "opacity-100" : "opacity-0")} />
                        <div>
                          <div className="font-medium">{pkg.attributes.code}</div>
                          <div className="text-xs text-muted-foreground">{pkg.attributes.name}</div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {errors.package?.consignmentNotePackagingCode && <p className="text-sm text-destructive">{errors.package.consignmentNotePackagingCode.message}</p>}
        </div>
      </div>
    </div>
  );
}
