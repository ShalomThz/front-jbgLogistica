import { Eye, EyeOff } from "lucide-react";
import { Button } from "@contexts/shared/shadcn";

interface PasswordToggleProps {
  show: boolean;
  onToggle: () => void;
}

export function PasswordToggle({ show, onToggle }: PasswordToggleProps) {
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
