import { useState } from "react";
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
import { PERMISSIONS } from "@contexts/iam/domain/schemas/userRole/Permission";
import type { UserPrimitives } from "@contexts/iam/domain/schemas/user/User";
import type { UserRolePrimitives } from "@contexts/iam/domain/schemas/userRole/UserRole";
import type { RegisterUserRequestPrimitives } from "@contexts/iam/application/user/RegisterUserRequest";
import { useStores } from "@contexts/iam/infrastructure/hooks/stores/useStores";

type Permission = (typeof PERMISSIONS)[number];

export type UserFormData = RegisterUserRequestPrimitives;

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

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: UserFormData) => void;
  user?: UserPrimitives | null;
  isLoading?: boolean;
}

const getInitialState = (user: UserPrimitives | null | undefined) => ({
  email: user?.email ?? "",
  password: "",
  storeId: user?.storeId ?? "",
  isActive: user?.isActive ?? true,
  roleName: user?.role.name ?? "Vendedor",
  permissions: (user?.role.permissions as Permission[]) ?? ["CAN_SELL", "CAN_MANAGE_CUSTOMERS"],
});

export const UserFormDialog = ({ open, onClose, onSave, user, isLoading }: Props) => {
  const { stores, isLoading: isLoadingStores } = useStores({ page: 1, limit: 100 });

  const [formState, setFormState] = useState(() => getInitialState(user));
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevUserId, setPrevUserId] = useState(user?.id);
  const [showPassword, setShowPassword] = useState(false);
  const [storeSearch, setStoreSearch] = useState("");

  // Reset form when dialog opens or user changes (React recommended pattern)
  if (open !== prevOpen || user?.id !== prevUserId) {
    setPrevOpen(open);
    setPrevUserId(user?.id);
    if (open) {
      setFormState(getInitialState(user));
      setShowPassword(false);
      setStoreSearch("");
    }
  }

  const { email, password, storeId, isActive, roleName, permissions } = formState;

  const updateField = <K extends keyof typeof formState>(
    field: K,
    value: (typeof formState)[K]
  ) => setFormState((prev) => ({ ...prev, [field]: value }));

  const handleRoleChange = (name: string) => {
    const preset = ROLE_PRESETS.find((r) => r.name === name);
    setFormState((prev) => ({
      ...prev,
      roleName: name,
      permissions: preset?.permissions ?? prev.permissions,
    }));
  };

  const togglePermission = (permission: Permission) => {
    setFormState((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const role: UserRolePrimitives = { name: roleName, permissions };
    const baseData = { email, storeId, isActive, role };

    if (password) {
      onSave({ ...baseData, password });
    } else if (isEdit) {
      onSave({ ...baseData, password: "" });
    }
  };

  const isEdit = !!user;

  const filteredStores = stores.filter(
    (store) =>
      storeSearch === "" ||
      store.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
      store.id.toLowerCase().includes(storeSearch.toLowerCase())
  );

  const selectedStore = stores.find((s) => s.id === storeId);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Usuario" : "Crear Usuario"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifica los datos del usuario."
              : "Ingresa los datos del nuevo usuario."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => updateField("email", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">
              {isEdit
                ? "Nueva contraseña (dejar vacío para mantener)"
                : "Contraseña *"}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => updateField("password", e.target.value)}
                required={!isEdit}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="size-4 text-muted-foreground" />
                ) : (
                  <Eye className="size-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tienda *</Label>
            <Select
              value={storeId}
              onValueChange={(value) => updateField("storeId", value)}
              required
            >
              <SelectTrigger>
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
                        <span className="text-xs text-muted-foreground">
                          ({store.id})
                        </span>
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Rol</Label>
            <Select value={roleName} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue />
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
          <div className="space-y-2">
            <Label>Permisos</Label>
            <div className="rounded-md border p-3 space-y-2">
              {PERMISSIONS.map((permission) => (
                <div key={permission} className="flex items-center space-x-2">
                  <Checkbox
                    id={permission}
                    checked={permissions.includes(permission)}
                    onCheckedChange={() => togglePermission(permission)}
                  />
                  <Label
                    htmlFor={permission}
                    className="cursor-pointer text-sm"
                  >
                    {PERMISSION_LABELS[permission]}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => updateField("isActive", !!checked)}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Usuario activo
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
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
};
