import { FormProvider, useWatch } from "react-hook-form";
import { Button } from "@contexts/shared/shadcn";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useDrivers } from "@contexts/shipping/infrastructure/hooks/drivers/useDrivers";
import { StepIndicator } from "@contexts/order-flow/ui/components/shared/StepIndicator";
import { useNewConsolidationFlow } from "@contexts/consolidation/ui/hooks/useNewConsolidationFlow";
import { ConsolidationDetailsStep } from "@contexts/consolidation/ui/components/new-consolidation/ConsolidationDetailsStep";
import { ConsolidationOrdersStep } from "@contexts/consolidation/ui/components/new-consolidation/ConsolidationOrdersStep";
import { ConsolidationReviewStep } from "@contexts/consolidation/ui/components/new-consolidation/ConsolidationReviewStep";
import { TrailerInUseDialog } from "@contexts/consolidation/ui/components/new-consolidation/TrailerInUseDialog";

/**
 * Alta de un consolidado en 3 pasos (datos → órdenes → revisar). El estado y
 * la validación por paso viven en `useNewConsolidationFlow`; cada paso es su
 * propio componente.
 *
 * Tres capas, como los modales de la app: header y footer fijos y sólo el
 * contenido scrollea. La página ocupa todo el alto del área del layout, así
 * que el footer con las acciones siempre queda a la vista.
 */
export const NewConsolidationPage = () => {
  const flow = useNewConsolidationFlow();
  const { drivers: allDrivers } = useDrivers({ filters: [] });
  // Igual que la página de Conductores: los dados de baja no se ofrecen.
  const drivers = allDrivers.filter((d) => d.user.isActive);

  const [trailerId, orders, capacity] = useWatch({
    control: flow.form.control,
    name: ["trailerId", "orders", "capacityLinearFeet"],
  });
  const trailer = flow.trailers.find((t) => t.id === trailerId);
  const totalLinearFeet = orders.reduce((sum, o) => sum + (o.linearFeet || 0), 0);
  const overCapacity = totalLinearFeet > (Number(capacity) || 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <header className="flex shrink-0 flex-col gap-3 border-b pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={flow.step === "datos" ? "Volver a consolidados" : "Paso anterior"}
            onClick={flow.handleBack}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-xl font-bold sm:text-2xl">Nuevo consolidado</h1>
        </div>
        {/* En pantallas angostas los pasos scrollean de lado en vez de
            romper la línea: `w-max` impide que las pastillas se encojan. */}
        <div className="-mx-1 overflow-x-auto px-1 pb-1 md:pb-0">
          <div className="w-max">
            <StepIndicator
              steps={flow.steps}
              currentStep={flow.step}
              onStepClick={flow.navigateToStep}
            />
          </div>
        </div>
      </header>

      {/* Content: sólo esto scrollea. `section` y no `main`: el layout ya
          tiene el `main` de la página. */}
      <section
        aria-label="Contenido del paso"
        className="flex min-h-0 flex-1 flex-col overflow-y-auto py-4 sm:py-6"
      >
        <FormProvider {...flow.form}>
          {flow.step === "datos" && (
            <ConsolidationDetailsStep
              trailers={flow.trailers}
              drivers={drivers}
              onSelectTrailer={flow.selectTrailer}
            />
          )}
          {flow.step === "ordenes" && <ConsolidationOrdersStep />}
          {flow.step === "revisar" && (
            <ConsolidationReviewStep
              trailers={flow.trailers}
              drivers={drivers}
              onEdit={flow.navigateToStep}
              showOrders={flow.canManageOrders}
            />
          )}
        </FormProvider>
      </section>

      {/* Footer */}
      <footer className="flex shrink-0 items-center gap-3 border-t pt-4">
        {/* Resumen vivo de lo que se lleva capturado; en móvil no cabe junto
            a los botones. */}
        <div className="hidden min-w-0 flex-1 truncate text-sm text-muted-foreground sm:block">
          {trailer ? (
            <span className="font-mono font-medium text-foreground">{trailer.unitNumber}</span>
          ) : (
            "Sin tráiler"
          )}
          {" · "}
          {orders.length} orden{orders.length === 1 ? "" : "es"}
          {" · "}
          <span className={cn(overCapacity && "font-medium text-destructive")}>
            {totalLinearFeet.toFixed(1)} / {Number(capacity) || 0} ft
          </span>
        </div>

        <div className="flex flex-1 gap-2 sm:flex-none">
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={flow.handleBack}>
            {flow.step === "datos" ? "Cancelar" : "Anterior"}
          </Button>
          {flow.step === "revisar" ? (
            <Button
              className="flex-1 sm:flex-none"
              onClick={flow.handleCreate}
              disabled={flow.submitting}
            >
              {flow.submitting && <Loader2 className="size-4 animate-spin" />}
              {flow.submitting ? "Creando..." : "Crear consolidado"}
            </Button>
          ) : (
            <Button className="flex-1 sm:flex-none" onClick={flow.handleNext}>
              Siguiente
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </footer>

      <TrailerInUseDialog
        trailer={flow.trailerToConfirm}
        onConfirm={flow.confirmTrailer}
        onCancel={flow.cancelTrailer}
      />
    </div>
  );
};
