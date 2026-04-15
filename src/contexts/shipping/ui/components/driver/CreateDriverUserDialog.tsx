import {
  registerUserRequestSchema,
  type RegisterUserRequestPrimitives,
} from "@contexts/iam/application/user/RegisterUserRequest";
import { useStores } from "@contexts/iam/infrastructure/hooks/stores/useStores";
import { FormField } from "@contexts/iam/ui/components/user/FormField";
import { PasswordToggle } from "@contexts/iam/ui/components/user/PasswordToggle";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator
} from "@contexts/shared/shadcn";
import { zodResolver } from "@hookform/resolvers/zod";
import { IdCard, Search, Store, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

const createDriverUserFormSchema = registerUserRequestSchema.extend({
  licenseNumber: z.string().min(1, "License number is required"),
});

type FormValues = z.infer<typeof createDriverUserFormSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    user: RegisterUserRequestPrimitives;
    licenseNumber: string;
  }) => void | Promise<void>;
  isLoading?: boolean;
}

function getDefaults(): FormValues {
  return {
    name: "",
    email: "",
    password: "",
    storeId: "",
    isActive: true,
    type: "DRIVER",
    role: {
      name: "Conductor",
      permissions: ["CAN_VIEW_PARTNER_ORDERS", "CAN_VIEW_HQ_ORDERS"],
    },
    licenseNumber: "",
  };
}

export function CreateDriverUserDialog({
  open,
  onClose,
  onSave,
  isLoading,
}: Props) {
  const { stores, isLoading: isLoadingStores } = useStores({ page: 1, limit: 100 });
  const [showPassword, setShowPassword] = useState(false);
  const [storeSearch, setStoreSearch] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(createDriverUserFormSchema),
    defaultValues: getDefaults(),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) reset(getDefaults());
  }, [open, reset]);

  const watchedStoreId = useWatch({ control, name: "storeId" });
  const selectedStore = stores.find((store) => store.id === watchedStoreId);

  const filteredStores = stores.filter(
    (store) =>
      storeSearch === "" ||
      store.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
      store.id.toLowerCase().includes(storeSearch.toLowerCase()),
  );

  const handleClose = () => {
    setStoreSearch("");
    setShowPassword(false);
    onClose();
  };

  const onSubmit = handleSubmit(({ licenseNumber, ...user }) =>
    onSave({ user, licenseNumber }),
  );

  return (
    <Dialog open={open} onOpenChange={(value) => !value && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Crear Conductor</DialogTitle>
              <DialogDescription className="mt-1">
                Captura los datos del conductor
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-5 space-y-6">
              {/* Sección: Información de Usuario */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-primary" />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Información de Usuario
                  </h3>
                </div>

                <FormField label="Nombre completo *" error={errors.name?.message}>
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Ingresa el nombre completo"
                    aria-invalid={!!errors.name}
                    {...register("name")}
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Correo electrónico *" error={errors.email?.message}>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="correo@ejemplo.com"
                      aria-invalid={!!errors.email}
                      {...register("email")}
                    />
                  </FormField>

                  <FormField label="Contraseña *" error={errors.password?.message}>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Mínimo 6 caracteres"
                        aria-invalid={!!errors.password}
                        className="pr-10"
                        {...register("password")}
                      />
                      <PasswordToggle
                        show={showPassword}
                        onToggle={() => setShowPassword((current) => !current)}
                      />
                    </div>
                  </FormField>
                </div>
              </div>

              <Separator className="my-2" />

              {/* Sección: Asignación */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-primary" />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Asignación
                  </h3>
                </div>

                <FormField label="Tienda asignada *" error={errors.storeId?.message}>
                  <Controller
                    name="storeId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger aria-invalid={!!errors.storeId} className="w-full">
                          <SelectValue placeholder="Seleccionar tienda">
                            {selectedStore ? (
                              <span className="flex items-center gap-2 truncate">
                                <Store className="size-4 shrink-0" />
                                <span className="truncate">{selectedStore.name}</span>
                              </span>
                            ) : (
                              "Seleccionar tienda"
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                              <Input
                                placeholder="Buscar tienda..."
                                value={storeSearch}
                                onChange={(event) => setStoreSearch(event.target.value)}
                                className="pl-9"
                              />
                            </div>
                          </div>
                          {isLoadingStores ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              Cargando tiendas...
                            </div>
                          ) : filteredStores.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              No se encontraron tiendas
                            </div>
                          ) : (
                            filteredStores.map((store) => (
                              <SelectItem key={store.id} value={store.id}>
                                <span className="flex items-center gap-2 truncate">
                                  <Store className="size-4 shrink-0" />
                                  <span className="truncate">{store.name}</span>
                                  <span className="text-xs text-muted-foreground shrink-0">({store.id})</span>
                                </span>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
              </div>

              <Separator className="my-2" />

              {/* Sección: Documentación */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-primary" />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Documentación
                  </h3>
                </div>

                <FormField label="Número de licencia *" error={errors.licenseNumber?.message}>
                  <div className="relative">
                    <IdCard className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="licenseNumber"
                      type="text"
                      placeholder="Ej. LIC-MX-2026-001"
                      className="pl-9"
                      aria-invalid={!!errors.licenseNumber}
                      {...register("licenseNumber")}
                    />
                  </div>
                </FormField>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/30 shrink-0 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? "Guardando..." : "Crear conductor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
