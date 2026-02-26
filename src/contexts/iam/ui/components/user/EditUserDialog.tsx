import {
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
} from "@contexts/shared/shadcn";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { editUserRequestSchema, type EditUserRequest } from "../../../application/user/EditUserRequest";
import type { UserListViewPrimitives } from "../../../domain/schemas/user/User";
import { PERMISSIONS, type Permission } from "../../../domain/schemas/user/UserRole";
import { useStores } from "../../../infrastructure/hooks/stores/useStores";
import { PERMISSION_LABELS, ROLE_PRESETS } from "./constants";
import { FormField } from "./FormField";
import { PasswordToggle } from "./PasswordToggle";

type Props = {
  open: boolean;
  onClose: () => void;
  user: UserListViewPrimitives;
  onSave: (data: EditUserRequest) => void;
  isLoading?: boolean;
};

// ─── Defaults ────────────────────────────────────────────────────────────────

function getDefaults(user: UserListViewPrimitives): EditUserRequest {
  return {
    name: user.name,
    email: user.email,
    storeId: user.store.id,
    isActive: user.isActive,
    role: user.role,
    newPassword: undefined,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditUserDialog({ open, onClose, user, onSave, isLoading }: Props) {
  const { stores, isLoading: isLoadingStores } = useStores({ page: 1, limit: 100 });
  const [showPassword, setShowPassword] = useState(false);
  const [storeSearch, setStoreSearch] = useState("");

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<EditUserRequest>({
    resolver: zodResolver(editUserRequestSchema),
    defaultValues: getDefaults(user),
  });

  useEffect(() => {
    if (open) reset(getDefaults(user));
  }, [open, user.id, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    setStoreSearch("");
    setShowPassword(false);
    onClose();
  };

  const watchedRole = useWatch({ control, name: "role" });
  const watchedStoreId = useWatch({ control, name: "storeId" });
  const watchedPermissions: Permission[] = watchedRole?.permissions ?? [];
  const selectedStore = stores.find((s) => s.id === watchedStoreId);

  const filteredStores = stores.filter(
    (store) =>
      storeSearch === "" ||
      store.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
      store.id.toLowerCase().includes(storeSearch.toLowerCase())
  );

  const handlePresetChange = (name: string) => {
    const preset = ROLE_PRESETS.find((r) => r.name === name);
    setValue("role", { name, permissions: preset?.permissions ?? [] }, { shouldDirty: true, shouldValidate: true });
  };

  const togglePermission = (permission: Permission) => {
    const next = watchedPermissions.includes(permission)
      ? watchedPermissions.filter((p) => p !== permission)
      : [...watchedPermissions, permission];
    setValue("role", { name: watchedRole?.name ?? "", permissions: next }, { shouldDirty: true, shouldValidate: true });
  };

  const onSubmit = handleSubmit((data) => {
    const payload: EditUserRequest = {};

    if (dirtyFields.name) payload.name = data.name;
    if (dirtyFields.email) payload.email = data.email;
    if (dirtyFields.storeId) payload.storeId = data.storeId;
    if (dirtyFields.isActive) payload.isActive = data.isActive;
    const isRoleDirty = !!(dirtyFields.role?.name ||
      (Array.isArray(dirtyFields.role?.permissions)
        ? dirtyFields.role.permissions.some(Boolean)
        : dirtyFields.role?.permissions));
    if (isRoleDirty) payload.role = data.role;
    if (dirtyFields.newPassword && data.newPassword) payload.newPassword = data.newPassword;

    onSave(payload);
  });

  const permissionsError =
    (errors.role as { permissions?: { message?: string } } | undefined)
      ?.permissions?.message ?? errors.role?.message;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>Modifica los datos del usuario.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {/* ── Name ── */}
          <FormField label="Nombre" error={errors.name?.message}>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
          </FormField>

          {/* ── Email ── */}
          <FormField label="Email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
          </FormField>

          {/* ── Password ── */}
          <FormField
            label="Nueva contraseña (dejar vacío para no cambiar)"
            error={errors.newPassword?.message}
          >
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={!!errors.newPassword}
                className="pr-10"
                {...register("newPassword", {
                  setValueAs: (v: string) => (v === "" ? undefined : v),
                })}
              />
              <PasswordToggle show={showPassword} onToggle={() => setShowPassword((p) => !p)} />
            </div>
          </FormField>

          {/* ── Store ── */}
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
                          onChange={(e) => setStoreSearch(e.target.value)}
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

          {/* ── Role name ── */}
          <FormField label="Nombre del rol" error={(errors.role as { name?: { message?: string } } | undefined)?.name?.message}>
            <div className="flex gap-2">
              <Input
                id="role.name"
                type="text"
                placeholder="Ej. Admin, Vendedor..."
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

          {/* ── Permissions ── */}
          <FormField label="Permisos" error={permissionsError}>
            <div className="rounded-md border p-3 space-y-2">
              {PERMISSIONS.map((permission) => (
                <div key={permission} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-${permission}`}
                    checked={watchedPermissions.includes(permission)}
                    onCheckedChange={() => togglePermission(permission)}
                  />
                  <Label
                    htmlFor={`edit-${permission}`}
                    className="cursor-pointer text-sm font-normal"
                  >
                    {PERMISSION_LABELS[permission]}
                  </Label>
                </div>
              ))}
            </div>
          </FormField>

          {/* ── Active ── */}
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={field.value ?? false}
                  onCheckedChange={(checked) => field.onChange(!!checked)}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Usuario activo
                </Label>
              </div>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
