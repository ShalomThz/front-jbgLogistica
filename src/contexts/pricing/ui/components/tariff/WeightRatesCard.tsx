import type { WeightRatePrimitives } from "@contexts/pricing/application/WeightRate";
import {
  PRICE_TYPE_LABELS,
  SERVICE_LEVEL_LABELS,
  SHIPPING_MODE_LABELS,
} from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { useWeightRates } from "@contexts/pricing/infrastructure/hooks/tariffs/useWeightRates";
import { WeightRateFormDialog } from "@contexts/pricing/ui/components/tariff/WeightRateFormDialog";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@contexts/shared/shadcn";
import { Pencil, Plus, Scale, Trash2 } from "lucide-react";
import { useState } from "react";

interface WeightRatesCardProps {
  zoneId: string;
  zoneName?: string;
  destinationCountry: string;
  canEdit: boolean;
}

/**
 * Las tarifas que cobran por peso, para la zona y el destino elegidos arriba.
 *
 * Van en su propia tabla y no en la matriz de cajas porque no tienen caja: la
 * matriz es caja × servicio, y estas filas no entran en ninguna celda.
 */
export function WeightRatesCard({
  zoneId,
  zoneName,
  destinationCountry,
  canEdit,
}: WeightRatesCardProps) {
  const {
    weightRates,
    isLoading,
    createWeightRate,
    updateWeightRate,
    removeWeightRate,
    isSaving,
  } = useWeightRates(zoneId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WeightRatePrimitives | null>(null);
  /** Borrar es destructivo y no hay deshacer, así que pide un segundo clic.
   * Un diálogo aparte sería más ceremonia de la que amerita una fila. */
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // El hook trae la zona entera; el destino se filtra acá para que la tabla
  // coincida con el país elegido arriba, igual que la matriz.
  const rows = weightRates.filter(
    (rate) => rate.destinationCountry === destinationCountry,
  );

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (rate: WeightRatePrimitives) => {
    setEditing(rate);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="size-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold">Tarifas por peso</h2>
            <p className="text-xs text-muted-foreground">
              Sin caja: se cobra el mayor entre el peso real y el volumétrico,
              con piso en el mínimo. El divisor volumétrico se configura en
              Ajustes.
            </p>
          </div>
        </div>

        {canEdit && (
          <Button type="button" size="sm" variant="outline" onClick={openNew}>
            <Plus className="size-4 mr-2" />
            Agregar
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Servicio</TableHead>
              <TableHead>Modo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Precio por unidad</TableHead>
              <TableHead className="text-right">Mínimo</TableHead>
              <TableHead className="text-right">Máximo</TableHead>
              {canEdit && <TableHead className="w-20" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={canEdit ? 7 : 6}
                  className="text-center text-sm text-muted-foreground"
                >
                  Cargando...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canEdit ? 7 : 6}
                  className="text-center text-sm text-muted-foreground"
                >
                  Esta zona no cobra por peso hacia {destinationCountry}.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>{SERVICE_LEVEL_LABELS[rate.serviceLevel]}</TableCell>
                  <TableCell>{SHIPPING_MODE_LABELS[rate.shippingMode]}</TableCell>
                  <TableCell>{PRICE_TYPE_LABELS[rate.priceType]}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${rate.pricePerUnit.amount.toFixed(2)}{" "}
                    {rate.pricePerUnit.currency} / {rate.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    {rate.minWeight} {rate.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    {rate.maxWeight === null ? (
                      <span className="text-muted-foreground">sin techo</span>
                    ) : (
                      `${rate.maxWeight} ${rate.unit}`
                    )}
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(rate)}
                          title="Editar"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        {confirmingId === rate.id ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={isSaving}
                            onClick={async () => {
                              await removeWeightRate(rate.id);
                              setConfirmingId(null);
                            }}
                          >
                            Confirmar
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            disabled={isSaving}
                            onClick={() => setConfirmingId(rate.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="size-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <WeightRateFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={(request) =>
          editing
            ? updateWeightRate({ id: editing.id, request })
            : createWeightRate(request)
        }
        zoneId={zoneId}
        zoneName={zoneName}
        destinationCountry={destinationCountry}
        editing={editing}
        isSaving={isSaving}
      />
    </div>
  );
}
