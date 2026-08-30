import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@contexts/shared/shadcn";
import { AlertTriangle, Eraser, RefreshCw } from "lucide-react";
import jbgLogo from "@/assets/carriers/jbg.png";
import type { QuotePriceResponse } from "@contexts/pricing/application/QuotePrice";
import {
  SERVICE_LEVEL_COLORS,
  SERVICE_LEVEL_LABELS,
  SHIPPING_MODE_LABELS,
} from "@contexts/pricing/domain/schemas/tariff/Tariff";

interface PartnerRateTableProps {
  options: QuotePriceResponse[];
  isLoading: boolean;
  error: string | null;
  /** El renglón elegido. `null` cuando el precio se escribió a mano. */
  selectedTariffId: string | null;
  onSelect: (option: QuotePriceResponse) => void;
  onRefetch: () => void;
  onClearSelection?: () => void;
}

/**
 * Los servicios tarifados para esta caja y este destino, para elegir uno.
 *
 * Reemplaza a los cuatro selectores que recotizaban en silencio: ahí el
 * vendedor movía un eje y el precio cambiaba sin que quedara claro por qué, o
 * peor, no cambiaba porque un monto escrito a mano le ganaba. Acá elegir una
 * fila **es** fijar el precio.
 *
 * Misma forma que la tabla de paqueterías de HQ, con los ejes de la tarifa en
 * vez de los de Skydropx. No reutiliza aquella porque su entrada son las tarifas
 * del proveedor, que no tienen nada que ver con estas.
 */
export function PartnerRateTable({
  options,
  isLoading,
  error,
  selectedTariffId,
  onSelect,
  onRefetch,
  onClearSelection,
}: PartnerRateTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {/* El logo deja claro de quién es esta tabla: son los servicios que
              JBG le tarifa al socio, no los que él le vende a su cliente. */}
          <CardTitle className="flex items-center gap-2 text-base">
            <img
              src={jbgLogo}
              alt="JBG"
              className="size-6 shrink-0 rounded object-contain"
            />
            Selecciona un servicio de JBG
          </CardTitle>
          <div className="flex items-center gap-1">
            {onClearSelection && selectedTariffId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="h-7 gap-1.5"
              >
                <Eraser className="size-3.5" />
                Limpiar
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRefetch}
              disabled={isLoading}
              className="h-7 gap-1.5"
            >
              <RefreshCw
                className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              Actualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-0 pt-0">
        <div className="grid grid-cols-12 gap-3 border-b pb-3 text-xs font-medium text-muted-foreground">
          <div className="col-span-5">Servicio</div>
          <div className="col-span-3">Modo</div>
          <div className="col-span-4 text-right">Precio</div>
        </div>

        {isLoading && (
          <div className="space-y-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-12 gap-3 border-b py-4">
                <div className="col-span-5">
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="col-span-3">
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="col-span-4 flex justify-end">
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !isLoading && (
          <div className="py-8 text-center text-sm text-destructive">
            Error al cargar los servicios: {error}
          </div>
        )}

        {/* Lista vacía no es un error: esa combinación no está tarifada y el
            precio se escribe a mano abajo. */}
        {!isLoading && !error && options.length === 0 && (
          <div className="flex items-start gap-2 py-8 text-sm text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              No hay tarifas cargadas para esta caja y este destino. Escribe el
              precio a mano más abajo.
            </p>
          </div>
        )}

        {!isLoading && !error && options.length > 0 && (
          <div className="space-y-0">
            {options.map((option) => (
              <div
                key={option.tariffId}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(option)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(option);
                  }
                }}
                className={`grid cursor-pointer grid-cols-12 gap-3 border-b py-4 transition-colors ${
                  selectedTariffId === option.tariffId
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className="col-span-5 flex items-center">
                  <Badge
                    variant="secondary"
                    className={SERVICE_LEVEL_COLORS[option.serviceLevel]}
                  >
                    {SERVICE_LEVEL_LABELS[option.serviceLevel]}
                  </Badge>
                </div>

                <div className="col-span-3 flex items-center text-sm text-muted-foreground">
                  {SHIPPING_MODE_LABELS[option.shippingMode]}
                </div>

                <div className="col-span-4 flex items-center justify-end">
                  <div className="text-right font-bold">
                    ${option.price.amount.toFixed(2)} {option.price.currency}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
