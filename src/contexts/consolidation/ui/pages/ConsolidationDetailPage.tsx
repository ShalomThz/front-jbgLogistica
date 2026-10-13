import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@contexts/shared/shadcn";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import { CameraPhotoInput } from "@contexts/shared/ui/components/CameraPhotoInput";
import { useMedia } from "@contexts/shared/infrastructure/hooks/media/useMedia";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import { TONE_OUTLINE, TONE_TEXT } from "@contexts/shared/domain/schemas/StatusTone";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { consolidationPolicies } from "@contexts/shared/domain/policies/consolidation.policy";
import { useDrivers } from "@contexts/shipping/infrastructure/hooks/drivers/useDrivers";
import { useTrailers } from "@contexts/consolidation/infrastructure/hooks/useTrailers";
import {
  useConsolidation,
  useConsolidationActions,
} from "@contexts/consolidation/infrastructure/hooks/useConsolidation";
import type { ConsolidationHistoryEntryPrimitives } from "@contexts/consolidation/domain/schemas/consolidation/Consolidation";
import { STAGE_LABELS, toneForStage } from "@contexts/consolidation/domain/schemas/consolidation/ConsolidationStages";
import { ConsolidationStageTimeline } from "@contexts/consolidation/ui/components/ConsolidationStageTimeline";
import { ConsolidationAdvanceStageDialog } from "@contexts/consolidation/ui/components/ConsolidationAdvanceStageDialog";
import { OrderPicker, type SelectedOrder } from "@contexts/consolidation/ui/components/OrderPicker";
import {
  ArrowLeft,
  Boxes,
  Camera,
  CircleCheck,
  FilePlus,
  Gauge,
  MapPin,
  PackageMinus,
  PackagePlus,
  Plus,
  Trash2,
  Truck,
  User,
  Users,
} from "lucide-react";

const TABS = [
  "resumen",
  "ordenes",
  "clientes",
  "destinos",
  "espacio",
  "evidencias",
  "historial",
] as const;

const TAB_LABELS: Record<(typeof TABS)[number], string> = {
  resumen: "Resumen",
  ordenes: "Órdenes del embarque",
  clientes: "Clientes",
  destinos: "Destinos",
  espacio: "Distribución de espacio",
  evidencias: "Evidencias",
  historial: "Historial",
};

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass = "text-primary",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  colorClass?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-2 p-4">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
        <div className={`shrink-0 rounded-full bg-muted p-2.5 ${colorClass}`}>
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  );
}

/** Fila de barra horizontal: una etiqueta, un número y una barra proporcional
 * al mayor valor del conjunto — para que Clientes/Destinos/Espacio se vean
 * como una gráfica y no sólo una lista. */
function BarRow({
  label,
  value,
  max,
  suffix,
}: {
  label: string;
  value: number;
  max: number;
  suffix: string;
}) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <li className="space-y-1 p-3">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="truncate">{label}</span>
        <span className="shrink-0 font-medium text-muted-foreground">
          {value.toLocaleString("es-MX", { maximumFractionDigits: 1 })} {suffix}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}

const HISTORY_ICONS: Record<ConsolidationHistoryEntryPrimitives["type"], React.ElementType> = {
  CREATED: FilePlus,
  DETAILS_UPDATED: FilePlus,
  ORDER_ADDED: PackagePlus,
  ORDER_REMOVED: PackageMinus,
  STAGE_ADVANCED: CircleCheck,
  EVIDENCE_ATTACHED: Camera,
};

/** "MX-0927-01" o, si la orden no trae folio propio, el id de la orden
 * truncado — mismo criterio que usa la tabla de órdenes del resto de la app. */
function orderLabel(o: { orderNumber: string | null; partnerOrderNumber: string | null; orderId: string }) {
  return o.orderNumber ?? o.partnerOrderNumber ?? o.orderId.slice(0, 8).toUpperCase();
}

export const ConsolidationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user ? consolidationPolicies.edit(user) : false;
  const canManagePackages = user ? consolidationPolicies.managePackages(user) : false;
  const canAdvanceStage = user ? consolidationPolicies.advanceStage(user) : false;

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("resumen");
  const [addOrdersOpen, setAddOrdersOpen] = useState(false);
  const [pickerSelection, setPickerSelection] = useState<SelectedOrder[]>([]);
  const [evidencePhotos, setEvidencePhotos] = useState<File[]>([]);

  const { data, isLoading } = useConsolidation(id);
  const { drivers } = useDrivers({ filters: [] });
  const { trailers } = useTrailers();
  const {
    addOrders,
    isAddingOrders,
    removeOrder,
    isRemovingOrder,
    advanceStage,
    isAdvancingStage,
    attachEvidence,
    isAttachingEvidence,
  } = useConsolidationActions(id ?? "");

  const consolidation = data?.consolidation;

  const driver = useMemo(
    () => drivers.find((d) => d.id === consolidation?.driverId),
    [drivers, consolidation?.driverId],
  );

  const trailer = useMemo(
    () => trailers.find((t) => t.id === consolidation?.trailerId),
    [trailers, consolidation?.trailerId],
  );

  const orders = useMemo(() => data?.orders ?? [], [data]);

  const clients = useMemo(() => {
    const map = new Map<string, { name: string; orderCount: number }>();
    for (const o of orders) {
      if (!o.client) continue;
      const key = o.client.id ?? o.client.name;
      const entry = map.get(key) ?? { name: o.client.name, orderCount: 0 };
      entry.orderCount += 1;
      map.set(key, entry);
    }
    return [...map.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.orderCount - a.orderCount);
  }, [orders]);

  const destinations = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      const key = o.destination ? `${o.destination.city}, ${o.destination.country}` : "Sin destino";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [orders]);

  const sections = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      const key = o.section ?? "Sin sección";
      map.set(key, (map.get(key) ?? 0) + o.linearFeet);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [orders]);

  const hasInvalidSelection = pickerSelection.some(
    (o) => !o.linearFeet || o.linearFeet <= 0,
  );

  if (isLoading || !data || !consolidation) return <PageLoader />;

  const { totalLinearFeet, capacityPercentUsed, isOverCapacity, isLocked, history } = data;
  const capacityPct = Math.min(100, Math.round(capacityPercentUsed));
  const maxClientOrders = clients[0]?.orderCount ?? 0;
  const maxDestinationCount = destinations[0]?.[1] ?? 0;
  const maxSectionFeet = sections[0]?.[1] ?? 0;
  const capacityTone = isOverCapacity ? "stopped" : "done";

  const handleAddOrders = async () => {
    try {
      const result = await addOrders({
        orders: pickerSelection.map((o) => ({
          orderId: o.orderId,
          linearFeet: o.linearFeet,
          section: o.section || null,
        })),
      });
      toast.success(
        result.capacityWarning
          ? "Órdenes agregadas — el consolidado quedó por encima de su capacidad declarada"
          : "Órdenes agregadas al consolidado",
      );
      setAddOrdersOpen(false);
      setPickerSelection([]);
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  const handleRemoveOrder = async (orderId: string) => {
    try {
      await removeOrder(orderId);
      toast.success("Orden quitada del consolidado");
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  const handleAttachEvidence = async () => {
    if (evidencePhotos.length === 0) return;
    try {
      await attachEvidence(evidencePhotos);
      toast.success("Evidencia adjuntada");
      setEvidencePhotos([]);
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  const tone = toneForStage(consolidation.stage);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/consolidations")}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="font-mono text-2xl font-bold">{consolidation.folio}</h1>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" />
              {consolidation.origin.label} → {consolidation.destination.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={TONE_OUTLINE[tone]}>
            {STAGE_LABELS[consolidation.stage]}
          </Badge>
          {canAdvanceStage && (
            <ConsolidationAdvanceStageDialog
              current={consolidation.stage}
              onAdvance={advanceStage}
              isAdvancing={isAdvancingStage}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Órdenes" value={orders.length} icon={Boxes} />
        <StatCard label="Clientes" value={clients.length} icon={Users} />
        <StatCard label="Destinos" value={destinations.length} icon={MapPin} />
        <StatCard
          label="Capacidad"
          value={`${capacityPct}%`}
          icon={Gauge}
          colorClass={TONE_TEXT[capacityTone]}
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as (typeof TABS)[number])}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="h-auto flex-wrap gap-1">
          {TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="flex-none text-sm">
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="resumen" className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto">
          <Card>
            <CardContent className="p-5">
              <ConsolidationStageTimeline current={consolidation.stage} />
            </CardContent>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="space-y-2 p-5">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Truck className="size-4" /> Unidad
                </p>
                <p className="text-sm text-muted-foreground">
                  {trailer
                    ? `${trailer.unitNumber} · ${trailer.type} · Placas ${trailer.plates}`
                    : "Sin tráiler asignado"}
                </p>
                <p className="flex items-center gap-2 pt-2 text-sm font-medium">
                  <User className="size-4" /> Conductor
                </p>
                <p className="text-sm text-muted-foreground">
                  {driver ? `${driver.user.name} · ${driver.licenseNumber}` : "Sin asignar"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Capacidad</p>
                  <p className={`text-lg font-bold ${TONE_TEXT[capacityTone]}`}>
                    {capacityPct}%
                  </p>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${isOverCapacity ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${capacityPct}%` }}
                  />
                </div>
                <p
                  className={`text-sm ${isOverCapacity ? "font-medium text-destructive" : "text-muted-foreground"}`}
                >
                  {totalLinearFeet.toFixed(1)} / {consolidation.capacityLinearFeet} pies
                  lineales {isOverCapacity && "— por encima de la capacidad"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-5">
              <p className="mb-3 text-sm font-medium">Órdenes en este embarque</p>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Este consolidado todavía no tiene órdenes.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="p-2">Orden</th>
                        <th className="p-2">Cliente</th>
                        <th className="p-2">Pies lineales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 8).map((o) => (
                        <tr key={o.orderId} className="border-b last:border-0 odd:bg-muted/20">
                          <td className="p-2 font-mono text-xs">{orderLabel(o)}</td>
                          <td className="p-2">{o.client?.name ?? "—"}</td>
                          <td className="p-2">{o.linearFeet.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {orders.length > 8 && (
                    <p className="border-t p-2 text-center text-xs text-muted-foreground">
                      +{orders.length - 8} más — ver pestaña "Órdenes del embarque"
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ordenes" className="mt-4 min-h-0 flex-1 overflow-y-auto">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isLocked
                ? "La carga está sellada: ya no se pueden agregar ni quitar órdenes."
                : "Agrega o quita órdenes mientras el consolidado siga en preparación o cargando."}
            </p>
            {canManagePackages && !isLocked && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => setAddOrdersOpen(true)}
              >
                <Plus className="size-3.5" />
                Agregar órdenes
              </Button>
            )}
          </div>

          {orders.length === 0 ? (
            <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Este consolidado todavía no tiene órdenes.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="p-2">Orden</th>
                    <th className="p-2">Cliente</th>
                    <th className="p-2">Destino</th>
                    <th className="p-2">Peso</th>
                    <th className="p-2">Pies lineales</th>
                    <th className="p-2">Sección</th>
                    {canManagePackages && !isLocked && <th className="p-2" />}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.orderId} className="border-b last:border-0 odd:bg-muted/20">
                      <td className="p-2">
                        <div className="flex flex-col gap-0.5">
                          <Badge variant="outline" className="w-fit font-mono text-[10px]">
                            {o.orderNumber ?? "—"}
                          </Badge>
                          {o.partnerOrderNumber && (
                            <Badge variant="secondary" className="w-fit font-mono text-[10px]">
                              {o.partnerOrderNumber}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-2">{o.client?.name ?? "—"}</td>
                      <td className="p-2">
                        {o.destination ? `${o.destination.city}, ${o.destination.country}` : "—"}
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {o.totalWeightKg.toFixed(1)} kg
                      </td>
                      <td className="p-2">{o.linearFeet.toFixed(1)}</td>
                      <td className="p-2">
                        {o.section ? <Badge variant="outline">{o.section}</Badge> : "—"}
                      </td>
                      {canManagePackages && !isLocked && (
                        <td className="p-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-destructive hover:bg-destructive/10"
                            disabled={isRemovingOrder}
                            onClick={() => handleRemoveOrder(o.orderId)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="clientes" className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {clients.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin clientes todavía.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {clients.map((c) => (
                <BarRow
                  key={c.id}
                  label={c.name}
                  value={c.orderCount}
                  max={maxClientOrders}
                  suffix={c.orderCount === 1 ? "orden" : "órdenes"}
                />
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="destinos" className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {destinations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin destinos todavía.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {destinations.map(([destination, count]) => (
                <BarRow
                  key={destination}
                  label={destination}
                  value={count}
                  max={maxDestinationCount}
                  suffix={count === 1 ? "orden" : "órdenes"}
                />
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="espacio" className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Usado" value={`${totalLinearFeet.toFixed(1)} ft`} icon={Gauge} />
            <StatCard
              label="Capacidad"
              value={`${consolidation.capacityLinearFeet} ft`}
              icon={Truck}
            />
            <StatCard
              label="Disponible"
              value={`${Math.max(0, consolidation.capacityLinearFeet - totalLinearFeet).toFixed(1)} ft`}
              icon={Boxes}
              colorClass={TONE_TEXT[capacityTone]}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            La sección de cada orden se captura a mano por ahora — todavía no hay
            un algoritmo de acomodo automático.
          </p>
          {sections.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin órdenes todavía.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {sections.map(([section, feet]) => (
                <BarRow key={section} label={section} value={feet} max={maxSectionFeet} suffix="ft" />
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="evidencias" className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto">
          {consolidation.evidencePhotos.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {consolidation.evidencePhotos.map((key) => (
                <EvidencePhotoThumbnail key={key} path={key} />
              ))}
            </div>
          )}
          {canEdit && consolidation.evidencePhotos.length < 4 && (
            <div className="max-w-sm space-y-2">
              <CameraPhotoInput
                id="consolidation-evidence"
                label="Fotos de evidencia (unidad, carga, sellado)"
                cameraTitle="Evidencia del consolidado"
                value={evidencePhotos}
                onChange={setEvidencePhotos}
                max={4 - consolidation.evidencePhotos.length}
              />
              <Button
                size="sm"
                disabled={evidencePhotos.length === 0 || isAttachingEvidence}
                onClick={handleAttachEvidence}
              >
                {isAttachingEvidence ? "Subiendo..." : "Guardar evidencia"}
              </Button>
            </div>
          )}
          {consolidation.evidencePhotos.length === 0 && !canEdit && (
            <p className="text-sm text-muted-foreground">Sin evidencia adjunta todavía.</p>
          )}
        </TabsContent>

        <TabsContent value="historial" className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin movimientos registrados.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((entry) => {
                const Icon = HISTORY_ICONS[entry.type] ?? FilePlus;
                return (
                  <li
                    key={entry.id}
                    className="flex items-start gap-3 rounded-md border bg-muted/20 p-3 text-sm"
                  >
                    <div className="mt-0.5 shrink-0 rounded-full bg-primary/10 p-1.5 text-primary">
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{entry.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.occurredAt).toLocaleString("es-MX")}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={addOrdersOpen} onOpenChange={(v) => !v && setAddOrdersOpen(false)}>
        <DialogContent className="flex max-h-[85dvh] flex-col sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Agregar órdenes</DialogTitle>
            <DialogDescription>
              Elige las órdenes que suben a este consolidado y captura los pies
              lineales que ocupan.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1">
            <OrderPicker selected={pickerSelection} onChange={setPickerSelection} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOrdersOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={pickerSelection.length === 0 || hasInvalidSelection || isAddingOrders}
              onClick={handleAddOrders}
            >
              {isAddingOrders ? "Agregando..." : `Agregar (${pickerSelection.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/** Una foto de evidencia; se abre en grande en otra pestaña. La llave que
 * manda el back es un storage key, no una URL servible directo — hay que
 * resolverla con `/media/:id` como hace el resto de la app. */
const EvidencePhotoThumbnail = ({ path }: { path: string }) => {
  const { data: photo, isLoading } = useMedia(path);

  if (isLoading) {
    return <div className="size-28 animate-pulse rounded-md border bg-muted" />;
  }
  if (!photo?.url) return null;

  return (
    <a href={photo.url} target="_blank" rel="noreferrer">
      <img
        src={photo.url}
        alt="Evidencia del consolidado"
        className="size-28 rounded-md border object-cover transition-opacity hover:opacity-90"
      />
    </a>
  );
};
