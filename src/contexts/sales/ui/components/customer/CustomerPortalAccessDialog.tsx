import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@contexts/shared/shadcn";
import { Copy, KeyRound, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { CustomerListViewPrimitives } from "@contexts/sales/domain/schemas/customer/CustomerListView";

// ── Password generator ────────────────────────────────────────────────────────
const WORDS = [
  "Luna", "Casa", "Mesa", "Rosa", "Agua", "Ola", "Mar", "Sol", "Roca", "Pino",
  "Nube", "Lago", "Aves", "Rio", "Flor", "Hoja", "Vela", "Cruz", "Miel", "Sal",
  "Copa", "Loma", "Ruta", "Gris", "Azul", "Beso", "Rama", "Faro", "Nido", "Vaca",
];

function generatePassword(): string {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const digits = String(Math.floor(10 + Math.random() * 90)); // 10-99
  return `${word}${digits}`;
}

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  customer: CustomerListViewPrimitives | null;
  open: boolean;
  onClose: () => void;
  onProvision: (id: string, password: string) => Promise<void>;
  isLoading: boolean;
}

export const CustomerPortalAccessDialog = ({
  customer,
  open,
  onClose,
  onProvision,
  isLoading,
}: Props) => {
  const [password, setPassword] = useState(() => generatePassword());
  const [done, setDone] = useState(false);

  const hasAccess = !!customer?.user;

  const handleOpen = (v: boolean) => {
    if (!v) {
      onClose();
      // Reset state after close animation
      setTimeout(() => {
        setDone(false);
        setPassword(generatePassword());
      }, 200);
    }
  };

  const handleProvision = async () => {
    if (!customer) return;
    await onProvision(customer.id, password);
    setDone(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copiado al portapapeles");
    });
  };

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5" />
            {hasAccess ? "Renovar acceso al portal" : "Configurar acceso al portal"}
          </DialogTitle>
          <DialogDescription>
            {hasAccess
              ? `${customer.name} ya tiene acceso. Genera una nueva contraseña para enviársela.`
              : `Crea las credenciales de acceso para que ${customer.name} pueda ver sus paquetes.`}
          </DialogDescription>
        </DialogHeader>

        {!done ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Correo electrónico</Label>
              <Input value={customer.email} readOnly className="bg-muted text-muted-foreground" />
            </div>

            <div className="space-y-1.5">
              <Label>Contraseña generada</Label>
              <div className="flex gap-2">
                <Input
                  value={password}
                  readOnly
                  className="font-mono tracking-wider"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPassword(generatePassword())}
                  title="Generar otra"
                >
                  <RefreshCw className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(password)}
                  title="Copiar contraseña"
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Esta contraseña es generada automáticamente. Puedes regenerarla antes de confirmar.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <p className="text-sm font-medium">Credenciales listas para enviar</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-mono">{customer.email}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(customer.email)}>
                    <Copy className="size-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Contraseña</p>
                    <p className="text-sm font-mono tracking-wider">{password}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(password)}>
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => copyToClipboard(`Email: ${customer.email}\nContraseña: ${password}`)}
              >
                <Copy className="mr-2 size-4" />
                Copiar todo
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Comparte estas credenciales con {customer.name} para que pueda acceder al portal.
            </p>
          </div>
        )}

        <DialogFooter>
          {done ? (
            <Button onClick={() => handleOpen(false)}>Cerrar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleProvision} disabled={isLoading}>
                {isLoading
                  ? "Configurando..."
                  : hasAccess
                  ? "Renovar contraseña"
                  : "Crear acceso"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
