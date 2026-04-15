import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@contexts/shared/shadcn";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";

interface PartnerTariffCardProps {
  tariffPrice: MoneyPrimitives | null;
  isLoading: boolean;
  error: string | null;
  onRefetch: () => void;
}

export function PartnerTariffCard({ tariffPrice, isLoading, error, onRefetch }: PartnerTariffCardProps) {
  return (
    <Card className={error ? "border-destructive" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Tarifa</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onRefetch}
            disabled={isLoading}
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <p className="text-sm">Buscando tarifa...</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-4 shrink-0" />
            <p className="text-sm">Sin tarifa asignada</p>
          </div>
        ) : tariffPrice ? (
          <div className="text-2xl font-bold text-primary">
            ${tariffPrice.amount.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">{tariffPrice.currency}</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No se pudo obtener la tarifa</p>
        )}
      </CardContent>
    </Card>
  );
}
