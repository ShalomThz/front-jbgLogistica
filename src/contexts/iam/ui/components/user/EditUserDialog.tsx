import { useEffect, useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Store } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
} from "@contexts/shared/shadcn";
import { PERMISSIONS, userRoleSchema, type Permission } from "../../../domain/schemas/user/UserRole";
import type { UserListViewPrimitives } from "../../../domain/schemas/user/User";
import { nameSchema } from "../../../domain/schemas/user/User";
import { emailSchema } from "@contexts/shared/domain/schemas/Email";
import type { UpdateUserRequest } from "../../../infrastructure/services/users/userRepository";
import { useStores } from "../../../infrastructure/hooks/stores/useStores";
import { ROLE_PRESETS, PERMISSION_LABELS } from "./constants";
import { FormField } from "./FormField";
import { PasswordToggle } from "./PasswordToggle";

// ─── Schema ───────────────────────────────────────────────────────────────────

const editFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  storeId: z.string().min(1, "Debes seleccionar una tienda"),
  isActive: z.boolean(),
  role: userRoleSchema,
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .optional()
    .or(z.literal(""))
    .and(z.string()
        .max(100, "La contraseña no puede exceder los 100 caracteres")
    )
});

type FormValues = z.infer<typeof editFormSchema>;

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onClose: () => void;
  user: UserListViewPrimitives;
  onSave: (data: UpdateUserRequest) => void;
  isLoading?: boolean;
};

// ─── Defaults ────────────────────────────────────────────────────────────────

function getDefaults(user: UserListViewPrimitives): FormValues {
  return {
    name: user.name,
    email: user.email,
    storeId: user.store.id,
    isActive: user.isActive,
    role: user.role,
    password: "",
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
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: getDefaults(user),
  });

  // Reset when dialog opens or user changes
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

  const handleRoleChange = (name: string) => {
    const preset = ROLE_PRESETS.find((r) => r.name === name);
    setValue("role", { name, permissions: preset?.permissions ?? [] }, { shouldValidate: true });
  };

  const togglePermission = (permission: Permission) => {
    const next = watchedPermissions.includes(permission)
      ? watchedPermissions.filter((p) => p !== permission)
      : [...watchedPermissions, permission];
    setValue("role", { name: watchedRole?.name ?? "", permissions: next }, { shouldValidate: true });
  };

  const onSubmit = handleSubmit(({ password, ...rest }) => {
    const payload: UpdateUserRequest = { ...rest };
    if (password) payload.password = password;
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
            error={errors.password?.message}
          >
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                className="pr-10"
                {...register("password")}
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

          {/* ── Role preset ── */}
          <FormField label="Rol">
            <Select value={watchedRole?.name ?? ""} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_PRESETS.map((role) => (
                  <SelectItem key={role.name} value={role.name}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  checked={field.value ?? true}
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
