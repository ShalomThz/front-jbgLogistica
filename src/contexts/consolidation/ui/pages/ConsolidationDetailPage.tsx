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
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import { useUsers } from "@contexts/iam/infrastructure/hooks/users/useUsers";
import {
  useConsolidation,
  useConsolidationActions,
} from "@contexts/consolidation/infrastructure/hooks/useConsolidation";
import type { ConsolidationHistoryEntryPrimitives } from "@contexts/consolidation/domain/schemas/consolidation/Consolidation";
import { STAGE_LABELS, toneForStage } from "@contexts/consolidation/domain/schemas/consolidation/ConsolidationStages";
import type { CarrierType } from "@contexts/shipping/domain/schemas/value-objects/Carrier";
import type { OrderStatus } from "@contexts/sales/domain/schemas/order/Order";
import { ORDER_STATUS_LABELS } from "@contexts/sales/domain/schemas/order/OrderStatusConfig";
import { ConsolidationStageTimeline } from "@contexts/consolidation/ui/components/ConsolidationStageTimeline";
import { ConsolidationAdvanceStageDialog } from "@contexts/consolidation/ui/components/ConsolidationAdvanceStageDialog";
import { OrderPicker, type SelectedOrder } from "@contexts/consolidation/ui/components/OrderPicker";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import type { StatusTone } from "@contexts/shared/domain/schemas/StatusTone";
import {
  ArrowLeft,
  Boxes,
  Calendar,
  Camera,
  CircleCheck,
  Clock,
  FilePlus,
  Gauge,
  MapPin,
  MessageSquare,
  PackageMinus,
  PackagePlus,
  Plus,
  Save,
  Search,
  Trash2,
  Truck,
  TriangleAlert,
  User,
  Users,
  Weight,
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
  title,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  colorClass?: string;
  /** Detalle completo para el tooltip nativo cuando el valor se trunca (p. ej. placas/licencia). */
  title?: string;
}) {
  return (
    <Card className="py-0">
      <CardContent className="flex items-center justify-between gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-bold" title={title}>
            {value}
          </p>
        </div>
        <div className={`shrink-0 rounded-full bg-muted p-2 ${colorClass}`}>
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
    <li className="space-y-1 px-3 py-1.5">
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

/** Tarjeta de resumen compacta: título, botón "ver todo" que salta a la
 * pestaña con el detalle completo, y el contenido truncado abajo. Así
 * Resumen deja de ser una pestaña más y se vuelve el panel "de un vistazo"
 * que junta lo importante de las demás sin tener que entrar a cada una. */
function SummaryCard({
  title,
  onViewAll,
  children,
}: {
  title: string;
  onViewAll: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col py-0">
      <CardContent className="flex flex-1 flex-col p-3">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">{title}</p>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onViewAll}>
            Ver todo
          </Button>
        </div>
        <div className="flex-1">{children}</div>
      </CardContent>
    </Card>
  );
}

const HISTORY_ICONS: Record<ConsolidationHistoryEntryPrimitives["type"], React.ElementType> = {
  CREATED: FilePlus,
  DETAILS_UPDATED: FilePlus,
  ORDER_ADDED: PackagePlus,
  ORDER_REMOVED: PackageMinus,
  STAGE_ADVANCED: CircleCheck,
  EVIDENCE_ATTACHED: Camera,
  ORDER_COMMENTS_UPDATED: MessageSquare,
};

/** "MX-0927-01" o, si la orden no trae folio propio, el id de la orden
 * truncado — mismo criterio que usa la tabla de órdenes del resto de la app. */
function orderLabel(o: { orderNumber: string | null; partnerOrderNumber: string | null; orderId: string }) {
  return o.orderNumber ?? o.partnerOrderNumber ?? o.orderId.slice(0, 8).toUpperCase();
}

const ORDER_STATUS_TONE: Record<OrderStatus, StatusTone> = {
  DRAFT: "waiting",
  PENDING_HQ_PROCESS: "waiting",
  COMPLETED: "done",
  CANCELLED: "stopped",
};

/** "Rastreo" no lee el stage del envío: una guía por paquetería externa
 * (Skydropx) no tiene tracking fino integrado aquí, así que se marca directo
 * como entregada; una de flota interna (JBG) o sin envío todavía muestra el
 * estatus real de la orden — mismo valor que ya usa el resto de la app, no
 * un estado nuevo. */
function rastreoFor(
  carrierType: CarrierType | null,
  orderStatus: OrderStatus | null,
): { label: string; tone: StatusTone } {
  if (carrierType === "THIRD_PARTY") return { label: "Entregado", tone: "done" };
  if (!orderStatus) return { label: "Sin estatus", tone: "draft" };
  return { label: ORDER_STATUS_LABELS[orderStatus], tone: ORDER_STATUS_TONE[orderStatus] };
}

type VerificationStatus = "pendiente" | "verificado" | "atencion";

const VERIFICATION_CONFIG: Record<
  VerificationStatus,
  { label: string; tone: StatusTone; icon: React.ElementType }
> = {
  verificado: { label: "Verificado", tone: "done", icon: CircleCheck },
  atencion: { label: "Atención", tone: "stopped", icon: TriangleAlert },
  pendiente: { label: "Pendiente", tone: "waiting", icon: Clock },
};

/** La columna "Verificación" del tablero de revisión — lee el estatus real de
 * la orden (`sales.Order.status`), no un estado nuevo: `COMPLETED` es lo más
 * cerca que hay hoy de "ya se revisó", `CANCELLED` es lo que necesita
 * atención, y lo demás sigue pendiente. */
function verificationStatusFor(status: OrderStatus | null): VerificationStatus {
  if (status === "COMPLETED") return "verificado";
  if (status === "CANCELLED") return "atencion";
  return "pendiente";
}

export const ConsolidationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user ? consolidationPolicies.edit(user) : false;
  const canManagePackages = user ? consolidationPolicies.managePackages(user) : false;
  const canAdvanceStage = user ? consolidationPolicies.advanceStage(user) : false;
  // Columna "Usuario verificador": sólo la ve (y la edita) quien tenga este
  // permiso — hoy nada más el rol Admin lo trae por default.
  const canVerifyOrders = user ? consolidationPolicies.verifyOrders(user) : false;

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("resumen");
  const [addOrdersOpen, setAddOrdersOpen] = useState(false);
  const [pickerSelection, setPickerSelection] = useState<SelectedOrder[]>([]);
  const [evidencePhotos, setEvidencePhotos] = useState<File[]>([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [verificationFilter, setVerificationFilter] = useState<"all" | VerificationStatus>("all");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [verifierDrafts, setVerifierDrafts] = useState<Record<string, string | null>>({});

  const { data, isLoading } = useConsolidation(id);
  const { drivers } = useDrivers({ filters: [] });
  const { trailers } = useTrailers();
  const { users: verifierUsers } = useUsers({ enabled: canVerifyOrders });
  const {
    addOrders,
    isAddingOrders,
    removeOrder,
    isRemovingOrder,
    updateOrderComments,
    isUpdatingOrderComments,
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

  // Las órdenes nuevas se agregan al final del arreglo (`Consolidation.addOrder`
  // hace `push`), así que truncar por posición las deja fuera de la tarjeta de
  // resumen en cuanto ya hay 5 u más — se ordenan por fecha de alta para que la
  // vista previa siempre muestre las más recientes, no las más viejas.
  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()),
    [orders],
  );

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

  const totalWeightKg = useMemo(
    () => orders.reduce((sum, o) => sum + o.totalWeightKg, 0),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((o) => {
      if (verificationFilter !== "all" && verificationStatusFor(o.orderStatus) !== verificationFilter) {
        return false;
      }
      if (!q) return true;
      return (
        orderLabel(o).toLowerCase().includes(q) ||
        (o.client?.name.toLowerCase().includes(q) ?? false) ||
        (o.destination ? `${o.destination.city}, ${o.destination.country}`.toLowerCase().includes(q) : false)
      );
    });
  }, [orders, orderSearch, verificationFilter]);

  const recentHistory = useMemo(() => {
    const list = data?.history ?? [];
    return [...list]
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 3);
  }, [data]);

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

  const dirtyReviews = orders.filter((o) => {
    const commentChanged =
      o.orderId in commentDrafts && commentDrafts[o.orderId] !== (o.comment ?? "");
    const verifierChanged =
      o.orderId in verifierDrafts && verifierDrafts[o.orderId] !== o.verifiedByUserId;
    return commentChanged || verifierChanged;
  });

  const handleSaveReview = async () => {
    if (dirtyReviews.length === 0) return;
    try {
      await updateOrderComments({
        comments: dirtyReviews.map((o) => ({
          orderId: o.orderId,
          comment: (o.orderId in commentDrafts
            ? commentDrafts[o.orderId]
            : (o.comment ?? "")
          ).trim() || null,
          verifiedByUserId:
            o.orderId in verifierDrafts ? verifierDrafts[o.orderId] : o.verifiedByUserId,
        })),
      });
      toast.success("Revisión guardada");
      setCommentDrafts({});
      setVerifierDrafts({});
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
    <div className="flex h-full min-h-0 flex-col gap-3">
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
            {consolidation.plannedDepartureAt && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="size-3.5" />
                Fecha de salida:{" "}
                <span className="font-medium text-foreground">
                  {new Date(consolidation.plannedDepartureAt).toLocaleDateString("es-MX", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </p>
            )}
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

      <Card className="py-0">
        <CardContent className="flex flex-col divide-y p-0 sm:flex-row sm:divide-x sm:divide-y-0">
          <div className="flex flex-1 items-center gap-3 p-3">
            <div className="shrink-0 rounded-full bg-muted p-2 text-primary">
              <Truck className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Número de unidad</p>
              <p
                className="truncate font-mono text-lg font-semibold"
                title={trailer ? `${trailer.unitNumber} · ${trailer.type} · Placas ${trailer.plates}` : undefined}
              >
                {trailer ? trailer.unitNumber : "Sin asignar"}
              </p>
            </div>
          </div>
          <div className="flex flex-1 items-center gap-3 p-3">
            <div className="shrink-0 rounded-full bg-muted p-2 text-primary">
              <User className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Conductor</p>
              <p
                className="truncate text-lg font-semibold"
                title={driver ? `${driver.user.name} · ${driver.licenseNumber}` : undefined}
              >
                {driver ? driver.user.name : "Sin asignar"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Órdenes" value={orders.length} icon={Boxes} />
        <StatCard label="Clientes" value={clients.length} icon={Users} />
        <StatCard label="Destinos" value={destinations.length} icon={MapPin} />
        <StatCard
          label="Capacidad ocupada"
          value={`${capacityPct}%`}
          icon={Gauge}
          colorClass={TONE_TEXT[capacityTone]}
        />
        <StatCard label="Total de pies" value={totalLinearFeet.toFixed(1)} icon={Boxes} />
        <StatCard label="Total de kilos" value={`${totalWeightKg.toFixed(1)} kg`} icon={Weight} />
        <StatCard
          label="Capacidad de unidad"
          value={`${consolidation.capacityLinearFeet} pies`}
          icon={Truck}
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

        <TabsContent value="resumen" className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto">
          <Card className="py-0">
            <CardContent className="p-3">
              <ConsolidationStageTimeline current={consolidation.stage} />
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardContent className="p-3">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-1.5">
                  <span className={cn("text-2xl font-bold tabular-nums", TONE_TEXT[capacityTone])}>
                    {capacityPct}%
                  </span>
                  <span className="text-sm text-muted-foreground">cargado</span>
                </div>
                <span
                  className={cn(
                    "text-sm",
                    isOverCapacity ? "font-medium text-destructive" : "text-muted-foreground",
                  )}
                >
                  {totalLinearFeet.toLocaleString("es-MX", { maximumFractionDigits: 1 })} /{" "}
                  {consolidation.capacityLinearFeet.toLocaleString("es-MX", { maximumFractionDigits: 1 })} ft
                  {isOverCapacity && " — por encima de la capacidad"}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", isOverCapacity ? "bg-destructive" : "bg-primary")}
                  style={{ width: `${Math.min(100, capacityPct)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            <SummaryCard title="Órdenes en este embarque" onViewAll={() => setActiveTab("ordenes")}>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin órdenes todavía.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="p-2">Orden</th>
                        <th className="p-2">Cliente</th>
                        <th className="p-2">ft</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.slice(0, 5).map((o) => (
                        <tr key={o.orderId} className="border-b last:border-0 odd:bg-muted/20">
                          <td className="p-2 font-mono text-xs">{orderLabel(o)}</td>
                          <td className="p-2 truncate">{o.client?.name ?? "—"}</td>
                          <td className="p-2">{o.linearFeet.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SummaryCard>

            <SummaryCard title="Clientes" onViewAll={() => setActiveTab("clientes")}>
              {clients.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin clientes todavía.</p>
              ) : (
                <ul className="-mx-1 divide-y">
                  {clients.slice(0, 4).map((c) => (
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
            </SummaryCard>

            <SummaryCard title="Destinos" onViewAll={() => setActiveTab("destinos")}>
              {destinations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin destinos todavía.</p>
              ) : (
                <ul className="-mx-1 divide-y">
                  {destinations.slice(0, 4).map(([destination, count]) => (
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
            </SummaryCard>

            <SummaryCard title="Distribución de espacio" onViewAll={() => setActiveTab("espacio")}>
              {sections.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin órdenes todavía.</p>
              ) : (
                <ul className="-mx-1 divide-y">
                  {sections.slice(0, 4).map(([section, feet]) => (
                    <BarRow key={section} label={section} value={feet} max={maxSectionFeet} suffix="ft" />
                  ))}
                </ul>
              )}
            </SummaryCard>

            <SummaryCard title="Evidencias" onViewAll={() => setActiveTab("evidencias")}>
              {consolidation.evidencePhotos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin evidencia adjunta todavía.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {consolidation.evidencePhotos.slice(0, 4).map((key) => (
                    <EvidencePhotoThumbnail key={key} path={key} size="sm" />
                  ))}
                </div>
              )}
            </SummaryCard>

            <SummaryCard title="Actividad reciente" onViewAll={() => setActiveTab("historial")}>
              {recentHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin movimientos registrados.</p>
              ) : (
                <ul className="space-y-2">
                  {recentHistory.map((entry) => {
                    const Icon = HISTORY_ICONS[entry.type] ?? FilePlus;
                    return (
                      <li key={entry.id} className="flex items-start gap-2 text-sm">
                        <div className="mt-0.5 shrink-0 rounded-full bg-primary/10 p-1 text-primary">
                          <Icon className="size-3" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate">{entry.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.occurredAt).toLocaleString("es-MX")}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </SummaryCard>
          </div>
        </TabsContent>

        <TabsContent value="ordenes" className="mt-4 flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
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
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar orden, cliente o destino..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={verificationFilter}
                  onValueChange={(v) => setVerificationFilter(v as typeof verificationFilter)}
                >
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las revisiones</SelectItem>
                    {(Object.keys(VERIFICATION_CONFIG) as VerificationStatus[]).map((v) => (
                      <SelectItem key={v} value={v}>
                        {VERIFICATION_CONFIG[v].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-h-0 flex-1 overflow-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="p-2">Orden</th>
                      <th className="p-2">Cliente / Destino</th>
                      <th className="p-2">Peso</th>
                      <th className="p-2">Pies lineales</th>
                      <th className="p-2">Sección</th>
                      <th className="p-2">Rastreo</th>
                      <th className="p-2">Verificación</th>
                      {canVerifyOrders && <th className="p-2">Usuario verificador</th>}
                      <th className="p-2">Comentario</th>
                      {canManagePackages && !isLocked && <th className="p-2" />}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => {
                      const rastreo = rastreoFor(o.carrierType, o.orderStatus);
                      const verification = VERIFICATION_CONFIG[verificationStatusFor(o.orderStatus)];
                      const VerificationIcon = verification.icon;
                      const draft = commentDrafts[o.orderId] ?? o.comment ?? "";
                      return (
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
                          <td className="p-2">
                            <p className="font-medium">{o.client?.name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">
                              {o.destination ? `${o.destination.city}, ${o.destination.country}` : "—"}
                            </p>
                          </td>
                          <td className="p-2 text-xs text-muted-foreground">
                            {o.totalWeightKg.toFixed(1)} kg
                          </td>
                          <td className="p-2">{o.linearFeet.toFixed(1)}</td>
                          <td className="p-2">
                            {o.section ? <Badge variant="outline">{o.section}</Badge> : "—"}
                          </td>
                          <td className="p-2">
                            <Badge variant="outline" className={TONE_OUTLINE[rastreo.tone]}>
                              {rastreo.label}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Badge variant="outline" className={cn("gap-1", TONE_OUTLINE[verification.tone])}>
                              <VerificationIcon className="size-3" />
                              {verification.label}
                            </Badge>
                          </td>
                          {canVerifyOrders && (
                            <td className="min-w-40 p-2">
                              <Select
                                value={
                                  (o.orderId in verifierDrafts
                                    ? verifierDrafts[o.orderId]
                                    : o.verifiedByUserId) ?? "none"
                                }
                                onValueChange={(v) =>
                                  setVerifierDrafts((d) => ({
                                    ...d,
                                    [o.orderId]: v === "none" ? null : v,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Sin asignar" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Sin asignar</SelectItem>
                                  {verifierUsers.map((u) => (
                                    <SelectItem key={u.id} value={u.id}>
                                      {u.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                          )}
                          <td className="min-w-48 p-2">
                            {canEdit ? (
                              <Input
                                value={draft}
                                placeholder="Agregar comentario..."
                                className="h-8 text-xs"
                                onChange={(e) =>
                                  setCommentDrafts((d) => ({ ...d, [o.orderId]: e.target.value }))
                                }
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">{o.comment ?? "—"}</span>
                            )}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {canEdit && (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Mostrando {filteredOrders.length} de {orders.length} orden
                    {orders.length === 1 ? "" : "es"}.
                  </p>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={dirtyReviews.length === 0 || isUpdatingOrderComments}
                    onClick={handleSaveReview}
                  >
                    <Save className="size-3.5" />
                    {isUpdatingOrderComments ? "Guardando..." : "Guardar revisión"}
                  </Button>
                </div>
              )}
            </>
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
            <OrderPicker
              selected={pickerSelection}
              onChange={setPickerSelection}
              capacityLinearFeet={consolidation.capacityLinearFeet}
              usedLinearFeet={totalLinearFeet}
              linearFeetDivisor={consolidation.linearFeetDivisor}
            />
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
const EvidencePhotoThumbnail = ({
  path,
  size = "md",
}: {
  path: string;
  size?: "sm" | "md";
}) => {
  const { data: photo, isLoading } = useMedia(path);
  const sizeClass = size === "sm" ? "size-14" : "size-28";

  if (isLoading) {
    return <div className={`${sizeClass} animate-pulse rounded-md border bg-muted`} />;
  }
  if (!photo?.url) return null;

  return (
    <a href={photo.url} target="_blank" rel="noreferrer">
      <img
        src={photo.url}
        alt="Evidencia del consolidado"
        className={`${sizeClass} rounded-md border object-cover transition-opacity hover:opacity-90`}
      />
    </a>
  );
};
