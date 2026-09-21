import { Label } from "@contexts/shared/shadcn";
import { CountrySelect } from "@contexts/shared/ui/components/CountrySelect";
import { Globe, TriangleAlert } from "lucide-react";

interface DestinationCountrySelectorProps {
  value: string;
  onChange: (country: string) => void;
  /** El del destinatario. Si no coincide con el elegido, se avisa. */
  recipientCountry?: string;
  disabled?: boolean;
}

/**
 * Con qué país destino se cotiza. Arranca en el del destinatario y se puede
 * cambiar, igual que la zona: mueve la sugerencia y nada más.
 *
 * **No toca la dirección del destinatario.** Son dos cosas distintas: a dónde
 * va el paquete lo decide el paso de contactos; esto es contra qué renglón de
 * la tabla se cotiza.
 *
 * Por eso el aviso: la orden puede guardar un destino y una cotización hacia
 * otro, y sin señalarlo nadie se entera hasta leer la orden guardada.
 */
export function DestinationCountrySelector({
  value,
  onChange,
  recipientCountry,
  disabled,
}: DestinationCountrySelectorProps) {
  const differsFromRecipient = !!recipientCountry && value !== recipientCountry;

  return (
    <div className="space-y-1">
      <Label htmlFor="destination-country" className="flex items-center gap-1.5">
        <Globe className="size-3.5" />
        País destino
      </Label>
      <CountrySelect value={value} onChange={onChange} disabled={disabled} />
      {differsFromRecipient && (
        <p className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Se cotiza a {value}, pero el destinatario está en {recipientCountry}
            . La orden se envía igual a {recipientCountry}.
          </span>
        </p>
      )}
    </div>
  );
}
