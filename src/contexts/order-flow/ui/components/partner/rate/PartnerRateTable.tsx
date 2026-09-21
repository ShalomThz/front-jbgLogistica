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
import { COUNTRIES } from "@contexts/shared/domain/schemas/address/Country";
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
  /**
   * Quién está mirando, para saber qué decirle cuando no hay tarifas.
   *
   * Con permiso financiero hay salida: escribir el precio a mano. Sin él no la
   * hay —el input no se renderiza y el paso queda bloqueado—, así que el aviso
   * tiene que decir a quién reclamarle y con qué datos, en vez de ofrecer algo
   * que la pantalla no permite.
   */
  canEditTariff: boolean;
  /** Los tres ejes de la combinación sin tarifar, para nombrarlos en el aviso.
   * Ya resueltos: la caja y la zona salen de datos que el flujo tiene cargados,
   * así que acá no se consulta nada. */
  boxName?: string;
  zoneName?: string;
  destinationCountry: string;
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
  canEditTariff,
  boxName,
  zoneName,
  destinationCountry,
}: PartnerRateTableProps) {
  const isEmpty = !isLoading && !error && options.length === 0;

  const countryName =
    COUNTRIES.find((c) => c.code === destinationCountry)?.name ??
    destinationCountry;

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

        {/* Lista vacía no es un error: esa combinación no está tarifada. Qué
            hacer al respecto depende de quién mire. */}
        {isEmpty && (
          <div className="flex items-start gap-2 py-8 text-sm text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {canEditTariff ? (
              <p>
                No hay tarifas cargadas para esta caja y este destino. Escribe
                el precio a mano más abajo.
              </p>
            ) : (
              <div className="space-y-2">
                <p>
                  Esta combinación todavía no tiene tarifa. Contacta a JBG para
                  que la cargue:
                </p>
                <ul className="space-y-0.5 text-foreground">
                  <li>
                    Caja: <span className="font-medium">{boxName ?? "—"}</span>
                  </li>
                  <li>
                    Zona: <span className="font-medium">{zoneName ?? "—"}</span>
                  </li>
                  <li>
                    Destino: <span className="font-medium">{countryName}</span>
                  </li>
                </ul>
                <p>Mientras tanto no se puede continuar con esta orden.</p>
              </div>
            )}
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

                <div className="col-span-3 flex flex-col justify-center text-sm text-muted-foreground">
                  <span>{SHIPPING_MODE_LABELS[option.shippingMode]}</span>
                  {/* De dónde sale el precio. En una fila por peso el monto no
                      es el de una caja: es peso facturable por precio unitario,
                      y sin decirlo el número parece salido de la nada. */}
                  {option.weightBreakdown && (
                    <span className="text-xs">
                      {option.weightBreakdown.billableWeight.value.toFixed(2)}{" "}
                      {option.weightBreakdown.billableWeight.unit} ×{" "}
                      {option.weightBreakdown.pricePerUnit.amount}{" "}
                      {option.weightBreakdown.pricePerUnit.currency}
                    </span>
                  )}
                </div>

                <div className="col-span-4 flex flex-col items-end justify-center">
                  <div className="text-right font-bold">
                    ${option.price.amount.toFixed(2)} {option.price.currency}
                  </div>
                  {/* Aviso, no bloqueo: la fila se puede elegir igual. */}
                  {option.weightBreakdown?.exceedsMaximum && (
                    <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-500">
                      <AlertTriangle className="size-3 shrink-0" />
                      Pasa el peso máximo
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
