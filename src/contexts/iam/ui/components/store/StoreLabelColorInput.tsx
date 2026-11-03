import { RotateCcw } from "lucide-react";
import { Button, Input, Label } from "@contexts/shared/shadcn";

interface Props {
  label: string;
  /** Color hex actual, o "" para "usar el de JBG" (el default de la plantilla). */
  value: string;
  defaultColor: string;
  onChange: (color: string) => void;
  error?: string;
  disabled?: boolean;
}

const isValidHex = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value);

export const StoreLabelColorInput = ({
  label,
  value,
  defaultColor,
  onChange,
  error,
  disabled,
}: Props) => {
  const swatchColor = isValidHex(value) ? value : defaultColor;

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={swatchColor}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-md border p-0.5"
          aria-label={`${label} — selector`}
        />
        <Input
          value={value}
          placeholder={defaultColor}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono uppercase"
          maxLength={7}
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            disabled={disabled}
            onClick={() => onChange("")}
            aria-label={`Usar el color de JBG para ${label.toLowerCase()}`}
          >
            <RotateCcw className="size-4" />
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Vacío usa el de JBG ({defaultColor}).
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};
