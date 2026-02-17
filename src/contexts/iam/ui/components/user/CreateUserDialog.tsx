import { useEffect, useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Search, Store } from "lucide-react";
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
import { PERMISSIONS, type Permission } from "../../../domain/schemas/user/UserRole";
import {
  registerUserRequestSchema,
  type RegisterUserRequestPrimitives,
} from "../../../application/user/RegisterUserRequest";
import { useStores } from "../../../infrastructure/hooks/stores/useStores";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_PRESETS: { name: string; permissions: Permission[] }[] = [
  { name: "Administrador", permissions: [...PERMISSIONS] },
  { name: "Vendedor", permissions: ["CAN_SELL", "CAN_MANAGE_CUSTOMERS"] },
  { name: "Bodeguero", permissions: ["CAN_MANAGE_INVENTORY"] },
  { name: "Auditor", permissions: ["CAN_VIEW_REPORTS"] },
];

const PERMISSION_LABELS: Record<Permission, string> = {
  CAN_SELL: "Vender",
  CAN_MANAGE_INVENTORY: "Gestionar inventario",
  CAN_MANAGE_USERS: "Gestionar usuarios",
  CAN_VIEW_REPORTS: "Ver reportes",
  CAN_MANAGE_CUSTOMERS: "Gestionar clientes",
  CAN_MANAGE_STORES: "Gestionar tiendas",
  CAN_MANAGE_ZONES: "Gestionar zonas",
  CAN_MANAGE_TARIFFS: "Gestionar tarifas",
  CAN_SHIP: "Enviar paquetes",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type FormValues = RegisterUserRequestPrimitives;

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: RegisterUserRequestPrimitives) => void;
  isLoading?: boolean;
};

// ─── Defaults ────────────────────────────────────────────────────────────────

function getDefaults(): FormValues {
  return {
    name: "",
    email: "",
    password: "",
    storeId: "",
    isActive: true,
    role: { name: "Vendedor", permissions: ["CAN_SELL", "CAN_MANAGE_CUSTOMERS"] },
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateUserDialog({ open, onClose, onSave, isLoading }: Props) {
  const { stores, isLoading: isLoadingStores } = useStores({ page: 1, limit: 100 });
  const [showPassword, setShowPassword] = useState(false);
  const [storeSearch, setStoreSearch] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(registerUserRequestSchema),
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

  // Reset on open
  useEffect(() => {
    if (open) reset(getDefaults());
  }, [open, reset]);

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

  const onSubmit = handleSubmit((values) => onSave(values));

  const permissionsError =
    (errors.role as { permissions?: { message?: string } } | undefined)
      ?.permissions?.message ?? errors.role?.message;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Usuario</DialogTitle>
          <DialogDescription>Ingresa los datos del nuevo usuario.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {/* ── Name ── */}
          <FormField label="Nombre *" error={errors.name?.message}>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
          </FormField>

          {/* ── Email ── */}
          <FormField label="Email *" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
          </FormField>

          {/* ── Password ── */}
          <FormField label="Contraseña *" error={errors.password?.message}>
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
                    id={`create-${permission}`}
                    checked={watchedPermissions.includes(permission)}
                    onCheckedChange={() => togglePermission(permission)}
                  />
                  <Label
                    htmlFor={`create-${permission}`}
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

function PasswordToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      tabIndex={-1}
      aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
      onClick={onToggle}
    >
      {show ? (
        <EyeOff className="size-4 text-muted-foreground" />
      ) : (
        <Eye className="size-4 text-muted-foreground" />
      )}
    </Button>
  );
}
