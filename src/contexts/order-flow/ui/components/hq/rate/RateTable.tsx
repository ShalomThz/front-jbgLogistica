import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
  Skeleton,
} from "@contexts/shared/shadcn";
import { RefreshCw, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import type { RatePrimitives } from "@contexts/shipping/domain/schemas/value-objects/Rate";

import ampmLogo from "@/assets/carriers/ampm.png";
import dhlLogo from "@/assets/carriers/dhl.png";
import estafetaLogo from "@/assets/carriers/estafeta.png";
import fedexLogo from "@/assets/carriers/fedex.png";
import jtExpressLogo from "@/assets/carriers/jt-express.png";
import ninetyMinutesLogo from "@/assets/carriers/ninetyminutes.png";
import paquetexpressLogo from "@/assets/carriers/paquetexpress.png";
import redpackLogo from "@/assets/carriers/redpack.png";
import upsLogo from "@/assets/carriers/ups.jpeg";
import jbgLogo from "@/assets/carriers/jbg.png";

const CARRIER_LOGOS: Record<string, string> = {
  AMPM: ampmLogo,
  DHL: dhlLogo,
  ESTAFETA: estafetaLogo,
  FEDEX: fedexLogo,
  "J&T EXPRESS": jtExpressLogo,
  "99 MINUTOS": ninetyMinutesLogo,
  PAQUETEXPRESS: paquetexpressLogo,
  REDPACK: redpackLogo,
  UPS: upsLogo,
  "JBG LOGISTICS": jbgLogo,
};

const parseServiceName = (serviceName: string) => {
  const parts = serviceName.split(" - ");
  return { carrier: parts[0], service: parts.slice(1).join(" - ") || parts[0] };
};

interface RateTableProps {
  rates: RatePrimitives[];
  isLoading: boolean;
  error: string | null;
  selectedRateId: string | null;
  onSelect: (rate: RatePrimitives) => void;
  onRefetch: () => void;
}

export function RateTable({ rates, isLoading, error, selectedRateId, onSelect, onRefetch }: RateTableProps) {
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setLoadingProgress(0);
      return;
    }
    setLoadingProgress(10);
    const interval = setInterval(() => {
      setLoadingProgress((prev) => (prev >= 85 ? 85 : prev + 5));
    }, 400);
    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <>
      {isLoading && <Progress value={loadingProgress} className="mb-2 h-1" />}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="size-4" />
              Selecciona un servicio de paquetería
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRefetch}
              disabled={isLoading}
              className="h-7 gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-0 pt-0">
          <div className="grid grid-cols-12 gap-3 pb-3 text-xs font-medium text-muted-foreground border-b">
            <div className="col-span-3">Paquetería</div>
            <div className="col-span-3">Servicio</div>
            <div className="col-span-3">Entrega estimada</div>
            <div className="col-span-3 text-right">Precio</div>
          </div>

          {isLoading && (
            <div className="space-y-0">
              {[1, 2, 3].map((i) => (
                <div key={i} className="grid grid-cols-12 gap-3 py-4 border-b">
                  <div className="col-span-3"><Skeleton className="h-4 w-24" /></div>
                  <div className="col-span-3"><Skeleton className="h-4 w-20" /></div>
                  <div className="col-span-3"><Skeleton className="h-4 w-16" /></div>
                  <div className="col-span-3 flex justify-end"><Skeleton className="h-4 w-20" /></div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="py-8 text-center text-sm text-destructive">
              Error al cargar tarifas: {error}
            </div>
          )}

          {!isLoading && !error && rates.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No se encontraron tarifas disponibles para este envío.
            </div>
          )}

          {!isLoading && rates.length > 0 && (
            <div className="space-y-0">
              {rates.map((rate) => {
                const { carrier, service } = parseServiceName(rate.serviceName);
                const logo = CARRIER_LOGOS[carrier.toUpperCase()];
                return (
                  <div
                    key={rate.id}
                    className={`grid grid-cols-12 gap-3 py-4 border-b cursor-pointer transition-colors ${
                      selectedRateId === rate.id ? "bg-primary/5 border-primary" : "hover:bg-muted/50"
                    }`}
                    onClick={() => onSelect(rate)}
                  >
                    <div className="col-span-3 flex items-center gap-2">
                      {logo && <img src={logo} alt={carrier} className="size-6 object-contain rounded" />}
                      <div className="font-medium text-sm">{carrier}</div>
                    </div>

                    <div className="col-span-3 flex items-center">
                      <div className="space-y-1">
                        <div className="text-sm">{service}</div>
                        {rate.isOcurre && (
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span>Ocurre (sucursal)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-3 flex items-center">
                      {rate.estimatedDays != null && (
                        <div className="text-sm text-muted-foreground">
                          {rate.estimatedDays} día{rate.estimatedDays !== 1 ? "s" : ""} hábil{rate.estimatedDays !== 1 ? "es" : ""}
                        </div>
                      )}
                    </div>

                    <div className="col-span-3 flex items-center justify-end">
                      <div className="text-right">
                        <div className="font-bold">
                          ${rate.price.amount.toFixed(2)} {rate.price.currency}
                        </div>
                        {rate.insuranceFee.amount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Seguro: ${rate.insuranceFee.amount.toFixed(2)} {rate.price.currency}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
