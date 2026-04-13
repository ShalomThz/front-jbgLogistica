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
  Separator,
} from "@contexts/shared/shadcn";
import { zodResolver } from "@hookform/resolvers/zod";
import { IdCard, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormField } from "@contexts/iam/ui/components/user/FormField";
import { PasswordToggle } from "@contexts/iam/ui/components/user/PasswordToggle";
import {
  editDriverRequestSchema,
  type EditDriverRequest,
} from "../../../application/driver/EditDriverRequest";
import type { DriverListViewPrimitives } from "../../../domain/schemas/driver/DriverListView";

function getDefaults(driver: DriverListViewPrimitives): EditDriverRequest {
  return {
    name: driver.user.name,
    email: driver.user.email,
    isActive: driver.user.isActive,
    licenseNumber: driver.licenseNumber,
    newPassword: undefined,
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  driver: DriverListViewPrimitives;
  onSave: (data: EditDriverRequest) => void | Promise<void>;
  isLoading?: boolean;
}

export function EditDriverDialog({ open, onClose, driver, onSave, isLoading }: Props) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<EditDriverRequest>({
    resolver: zodResolver(editDriverRequestSchema),
    defaultValues: getDefaults(driver),
  });

  useEffect(() => {
    if (open) reset(getDefaults(driver));
  }, [open, driver.id, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    setShowPassword(false);
    onClose();
  };

  const onSubmit = handleSubmit((data) => {
    const payload: EditDriverRequest = {};
    if (dirtyFields.name) payload.name = data.name;
    if (dirtyFields.email) payload.email = data.email;
    if (dirtyFields.isActive) payload.isActive = data.isActive;
    if (dirtyFields.licenseNumber) payload.licenseNumber = data.licenseNumber;
    if (dirtyFields.newPassword && data.newPassword) payload.newPassword = data.newPassword;
    onSave(payload);
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Editar conductor</DialogTitle>
          <DialogDescription>
            Modifica los datos del conductor y su cuenta de usuario.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-0 md:divide-x">
            {/* ── Left: user fields ── */}
            <div className="space-y-4 md:pr-6 pb-4 md:pb-0">
              <div className="flex items-center gap-2 mb-1">
                <User className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Usuario
                </h3>
              </div>

              <FormField label="Nombre" error={errors.name?.message}>
                <Input
                  id="driver-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Nombre completo"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
              </FormField>

              <FormField label="Email" error={errors.email?.message}>
                <Input
                  id="driver-email"
                  type="email"
                  autoComplete="email"
                  placeholder="correo@ejemplo.com"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
              </FormField>

              <FormField label="Nueva contraseña" error={errors.newPassword?.message}>
                <div className="relative">
                  <Input
                    id="driver-newPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Dejar vacío para no cambiar"
                    aria-invalid={!!errors.newPassword}
                    className="pr-10"
                    {...register("newPassword", {
                      setValueAs: (v: string) => (v === "" ? undefined : v),
                    })}
                  />
                  <PasswordToggle
                    show={showPassword}
                    onToggle={() => setShowPassword((p) => !p)}
                  />
                </div>
              </FormField>

              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2 rounded-md border p-3">
                    <Checkbox
                      id="driver-isActive"
                      checked={field.value ?? false}
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                    />
                    <div>
                      <Label htmlFor="driver-isActive" className="cursor-pointer">
                        Usuario activo
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        El conductor podrá iniciar sesión en el sistema.
                      </p>
                    </div>
                  </div>
                )}
              />
            </div>

            {/* ── Right: driver fields ── */}
            <div className="space-y-4 md:pl-6 pt-4 md:pt-0 border-t md:border-t-0">
              <div className="flex items-center gap-2 mb-1">
                <IdCard className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Conductor
                </h3>
              </div>

              <FormField label="Número de licencia" error={errors.licenseNumber?.message}>
                <div className="relative">
                  <IdCard className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="driver-licenseNumber"
                    type="text"
                    placeholder="Ej. ABC-123456"
                    aria-invalid={!!errors.licenseNumber}
                    className="pl-9"
                    {...register("licenseNumber")}
                  />
                </div>
              </FormField>
            </div>
          </div>

          <Separator className="my-4" />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
