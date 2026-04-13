import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IdCard, Search, Shield, Store, User } from "lucide-react";
import {
  Badge,
  Button,
  Checkbox,
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
import {
  registerUserRequestSchema,
  type RegisterUserRequestPrimitives,
} from "@contexts/iam/application/user/RegisterUserRequest";
import type { Permission } from "@contexts/iam/domain/schemas/user/UserRole";
import { useStores } from "@contexts/iam/infrastructure/hooks/stores/useStores";
import { FormField } from "@contexts/iam/ui/components/user/FormField";
import { PasswordToggle } from "@contexts/iam/ui/components/user/PasswordToggle";
import { PermissionPicker } from "@contexts/iam/ui/components/user/PermissionPicker";
import { ROLE_PRESETS } from "@contexts/iam/ui/components/user/constants";

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
      permissions: [],
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
    setValue,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) reset(getDefaults());
  }, [open, reset]);

  const watchedRole = useWatch({ control, name: "role" });
  const watchedStoreId = useWatch({ control, name: "storeId" });
  const watchedPermissions: Permission[] = watchedRole?.permissions ?? [];
  const selectedStore = stores.find((store) => store.id === watchedStoreId);

  const filteredStores = stores.filter(
    (store) =>
      storeSearch === "" ||
      store.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
      store.id.toLowerCase().includes(storeSearch.toLowerCase()),
  );

  const handlePresetChange = (name: string) => {
    const preset = ROLE_PRESETS.find((role) => role.name === name);
    setValue("role", { name, permissions: preset?.permissions ?? [] }, { shouldValidate: true });
  };

  const handlePermissionsChange = (permissions: Permission[]) => {
    setValue("role", { name: watchedRole?.name ?? "", permissions }, { shouldValidate: true });
  };

  const handleClose = () => {
    setStoreSearch("");
    setShowPassword(false);
    onClose();
  };

  const permissionsError =
    (errors.role as { permissions?: { message?: string } } | undefined)
      ?.permissions?.message ?? errors.role?.message;

  const onSubmit = handleSubmit(({ licenseNumber, ...user }) =>
    onSave({ user, licenseNumber }),
  );

  return (
    <Dialog open={open} onOpenChange={(value) => !value && handleClose()}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">Crear Conductor</DialogTitle>
          <DialogDescription>
            Captura los datos del usuario y la licencia. Nosotros enlazamos el
            `userId` creado con el perfil de conductor automáticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="flex flex-col overflow-hidden flex-1">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-0 md:divide-x overflow-y-auto flex-1 pr-1">
            <div className="space-y-4 md:pr-6 pb-4 md:pb-0">
              <div className="flex items-center gap-2 mb-1">
                <User className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Usuario base
                </h3>
              </div>

              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">Tipo de usuario</p>
                    <p className="text-xs text-muted-foreground">
                      Este flujo crea usuarios de tipo `DRIVER`.
                    </p>
                  </div>
                  <Badge variant="secondary">DRIVER</Badge>
                </div>
              </div>

              <FormField label="Nombre *" error={errors.name?.message}>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Nombre completo"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Email *" error={errors.email?.message}>
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
                      placeholder="Min. 6 caracteres"
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

              <FormField label="Tienda *" error={errors.storeId?.message}>
                <Controller
                  name="storeId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={!!errors.storeId}>
                        <SelectValue placeholder="Seleccionar tienda">
                          {selectedStore ? (
                            <span className="flex items-center gap-2">
                              <Store className="size-4" />
                              {selectedStore.name}
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
                              <span className="flex items-center gap-2">
                                <Store className="size-4" />
                                <span>{store.name}</span>
                                <span className="text-xs text-muted-foreground">({store.id})</span>
                              </span>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField label="Licencia *" error={errors.licenseNumber?.message}>
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

              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2 rounded-md border p-3">
                    <Checkbox
                      id="isActive"
                      checked={field.value ?? true}
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                    />
                    <div>
                      <Label htmlFor="isActive" className="cursor-pointer">
                        Usuario activo
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        El conductor podrá iniciar sesión al terminar el alta.
                      </p>
                    </div>
                  </div>
                )}
              />
            </div>

            <div className="space-y-4 md:pl-6 pt-4 md:pt-0 border-t md:border-t-0">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Rol y permisos
                </h3>
              </div>

              <FormField
                label="Nombre del rol *"
                error={(errors.role as { name?: { message?: string } } | undefined)?.name?.message}
              >
                <div className="flex gap-2">
                  <Input
                    id="role.name"
                    type="text"
                    placeholder="Ej. Conductor"
                    aria-invalid={!!(errors.role as { name?: unknown } | undefined)?.name}
                    {...register("role.name")}
                  />
                  <Select onValueChange={handlePresetChange}>
                    <SelectTrigger className="w-40 shrink-0">
                      <SelectValue placeholder="Preset" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_PRESETS.map((role) => (
                        <SelectItem key={role.name} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </FormField>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">Permisos</Label>
                  <Badge variant="secondary" className="text-xs">
                    {watchedPermissions.length} seleccionados
                  </Badge>
                </div>
                {permissionsError && (
                  <p className="text-sm text-destructive mb-2">{permissionsError}</p>
                )}
                <PermissionPicker
                  selected={watchedPermissions}
                  onChange={handlePermissionsChange}
                  idPrefix="create-driver"
                />
              </div>
            </div>
          </div>

          <Separator className="my-4 shrink-0" />

          <DialogFooter className="shrink-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Crear conductor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
