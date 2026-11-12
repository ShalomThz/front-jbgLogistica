import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@contexts/shared/shadcn";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import { CameraPhotoInput } from "@contexts/shared/ui/components/CameraPhotoInput";
import { useMedia } from "@contexts/shared/infrastructure/hooks/media/useMedia";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import { TONE_FILL, TONE_OUTLINE, TONE_TEXT } from "@contexts/shared/domain/schemas/StatusTone";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { consolidationPolicies } from "@contexts/shared/domain/policies/consolidation.policy";
import { orderPolicies } from "@contexts/shared/domain/policies/order.policy";
import { useUsers } from "@contexts/iam/infrastructure/hooks/users/useUsers";
import {
  useConsolidation,
  useConsolidationActions,
} from "@contexts/consolidation/infrastructure/hooks/useConsolidation";
import type { ConsolidationHistoryEntryPrimitives } from "@contexts/consolidation/domain/schemas/consolidation/Consolidation";
import { STAGE_LABELS, toneForStage } from "@contexts/consolidation/domain/schemas/consolidation/ConsolidationStages";
import {
  VERIFICATION_LABELS,
  VERIFICATION_TONE,
  type ConsolidatedOrderDetailPrimitives,
  type ConsolidatedOrderVerificationStatus,
} from "@contexts/consolidation/domain/schemas/consolidation/Consolidation";
import { STAGE_LABELS as SHIPMENT_STAGE_LABELS } from "@contexts/shipping/domain/schemas/shipment/ShipmentStages";
import {
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_TONE,
} from "@contexts/shipping/domain/schemas/shipment/ShipmentStatuses";
import { ConsolidationStageTimeline } from "@contexts/consolidation/ui/components/ConsolidationStageTimeline";
import { ConsolidationAdvanceStageDialog } from "@contexts/consolidation/ui/components/ConsolidationAdvanceStageDialog";
import { AddOrdersDialog } from "@contexts/consolidation/ui/components/AddOrdersDialog";
import { OrderCommentDialog } from "@contexts/consolidation/ui/components/OrderCommentDialog";
import { OrderDetailDialog } from "@contexts/order-flow/ui/components/order/detail/OrderDetailDialog";
import {
  orderQueryOptions,
  useOrder,
} from "@contexts/sales/infrastructure/hooks/orders/useOrder";
import { consolidationKeys } from "@contexts/consolidation/infrastructure/hooks/consolidationKeys";
import { countVerification } from "@contexts/consolidation/domain/countVerification";
import { VerificationBar } from "@contexts/consolidation/ui/components/VerificationBar";
import { CarrierLogo } from "@contexts/shared/ui/components/CarrierLogo";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import type { StatusTone } from "@contexts/shared/domain/schemas/StatusTone";
import {
  ArrowLeft,
  Boxes,
  Calendar,
  Camera,
  ChevronDown,
  CircleCheck,
  Clock,
  ExternalLink,
  FilePlus,
  Gauge,
  Loader2,
  MapPin,
  MessageSquare,
  MessageSquarePlus,
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

/** "Rastreo" sale del envío, con el mismo vocabulario y color que el resto de
 * la app (`orderProgress`): la etapa dice dónde está, el estatus de quién es la
 * pelota, y una incidencia abierta lo vuelve problema. */
function rastreoFor(
  o: Pick<
    ConsolidatedOrderDetailPrimitives,
    "orderStatus" | "shipmentStage" | "shipmentStatus" | "hasShipmentIncident"
  >,
): { label: string; tone: StatusTone } {
  // Los cortes ganan sobre cualquier avance.
  if (o.orderStatus === "CANCELLED" || o.shipmentStatus === "CANCELLED") {
    return { label: "Cancelada", tone: "stopped" };
  }
  if (o.shipmentStatus === "RETURNED") {
    return { label: SHIPMENT_STATUS_LABELS.RETURNED, tone: "stopped" };
  }
  if (!o.shipmentStatus) return { label: "Sin envío", tone: "draft" };
  // Envío en borrador: todavía no arranca el recorrido, no hay etapa.
  if (!o.shipmentStage) {
    return { label: SHIPMENT_STATUS_LABELS[o.shipmentStatus], tone: "draft" };
  }
  return {
    label: SHIPMENT_STAGE_LABELS[o.shipmentStage],
    tone: o.hasShipmentIncident ? "stopped" : SHIPMENT_STATUS_TONE[o.shipmentStatus],
  };
}

/** La columna "Verificación": la revisión que captura quien verifica para este
 * renglón del consolidado. El orden es el de las opciones del select. */
const VERIFICATION_CONFIG: Record<
  ConsolidatedOrderVerificationStatus,
  { label: string; tone: StatusTone; icon: React.ElementType }
> = {
  REVIEWED: { label: VERIFICATION_LABELS.REVIEWED, tone: VERIFICATION_TONE.REVIEWED, icon: CircleCheck },
  PENDING: { label: VERIFICATION_LABELS.PENDING, tone: VERIFICATION_TONE.PENDING, icon: Clock },
  ALERT: { label: VERIFICATION_LABELS.ALERT, tone: VERIFICATION_TONE.ALERT, icon: TriangleAlert },
};

const VERIFICATION_OPTIONS = Object.keys(
  VERIFICATION_CONFIG,
) as ConsolidatedOrderVerificationStatus[];

export const ConsolidationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user ? consolidationPolicies.edit(user) : false;
  const canManageOrders = user ? consolidationPolicies.manageOrders(user) : false;
  // Abrir el detalle de una orden desde el embarque es cosa de órdenes: sin
  // ese permiso la fila y el badge de Rastreo no son clickeables.
  const canViewOrders = user ? orderPolicies.view(user) : false;
  const canAdvanceStage = user ? consolidationPolicies.advanceStage(user) : false;
  // Revisión de órdenes, mismas reglas que el back: `canReviewOrders` comenta
  // y ve "Guardar revisión" (edita o verifica); `canVerifyOrders` además
  // elige verificación y usuario verificador.
  const canReviewOrders = user ? consolidationPolicies.reviewOrders(user) : false;
  const canVerifyOrders = user ? consolidationPolicies.verifyOrders(user) : false;

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("resumen");
  const [statsOpen, setStatsOpen] = useState(false);
  const [addOrdersOpen, setAddOrdersOpen] = useState(false);
  const [evidencePhotos, setEvidencePhotos] = useState<File[]>([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [verificationFilter, setVerificationFilter] = useState<"all" | ConsolidatedOrderVerificationStatus>("all");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [verifierDrafts, setVerifierDrafts] = useState<Record<string, string | null>>({});
  // Renglón cuyo comentario se está escribiendo en el modal; la celda sólo
  // muestra el botón o el texto ya capturado.
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [verificationDrafts, setVerificationDrafts] = useState<
    Record<string, ConsolidatedOrderVerificationStatus>
  >({});
  // Clic en la fila: se carga la orden y se abre su detalle (Resumen) sin
  // salir del consolidado. Clic en "Rastreo": mismo modal, directo en la
  // pestaña Historial (la línea de tiempo).
  // La orden se lee suscrita a su query (`useOrder`), no copiada a estado:
  // registrar un evento o avanzar el envío invalida/parcha `["orders", id]`
  // (`invalidateTimeline`, socket) y el modal se re-renderiza solo.
  const queryClient = useQueryClient();
  const [timelineOrderId, setTimelineOrderId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"resumen" | "historial">("resumen");
  const [openingOrderId, setOpeningOrderId] = useState<string | null>(null);
  const { data: timelineOrder } = useOrder(timelineOrderId ?? undefined);

  const openOrderDetail = async (orderId: string, tab: "resumen" | "historial") => {
    setOpeningOrderId(orderId);
    try {
      // Precarga fresca antes de abrir: spinner en el badge y error en toast.
      await queryClient.fetchQuery(orderQueryOptions(orderId));
      setDetailTab(tab);
      setTimelineOrderId(orderId);
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setOpeningOrderId(null);
    }
  };

  const closeOrderTimeline = () => {
    setTimelineOrderId(null);
    // Rastreo/Verificación salen del detalle del consolidado, que los eventos
    // del envío no invalidan — se refresca al volver a la tabla.
    if (id) queryClient.invalidateQueries({ queryKey: consolidationKeys.detail(id) });
  };

  const { data, isLoading } = useConsolidation(id);
  const { users } = useUsers({ enabled: canVerifyOrders });
  // Sólo puede quedar como verificador quien tiene el permiso de verificar.
  const verifierUsers = useMemo(
    () => users.filter(consolidationPolicies.verifyOrders),
    [users],
  );
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

  // Conductor y tráiler vienen en el detalle: no dependen de tener permiso
  // sobre los catálogos.
  const driver = data?.driver ?? null;
  const trailer = data?.trailer ?? null;

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
      if (verificationFilter !== "all" && o.verificationStatus !== verificationFilter) {
        return false;
      }
      if (!q) return true;
      return (
        (o.orderNumber?.toLowerCase().includes(q) ?? false) ||
        (o.partnerOrderNumber?.toLowerCase().includes(q) ?? false) ||
        o.orderId.toLowerCase().startsWith(q) ||
        (o.client?.name.toLowerCase().includes(q) ?? false) ||
        (o.store?.name.toLowerCase().includes(q) ?? false) ||
        (o.carrierName?.toLowerCase().includes(q) ?? false) ||
        (o.trackingNumber?.toLowerCase().includes(q) ?? false) ||
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

  if (isLoading || !data || !consolidation) return <PageLoader />;

  const { totalLinearFeet, capacityPercentUsed, isOverCapacity, isLocked, history } = data;
  const capacityPct = Math.min(100, Math.round(capacityPercentUsed));
  const maxClientOrders = clients[0]?.orderCount ?? 0;
  const maxDestinationCount = destinations[0]?.[1] ?? 0;
  const maxSectionFeet = sections[0]?.[1] ?? 0;
  const capacityTone = isOverCapacity ? "stopped" : "done";
  const verification = countVerification(orders);

  // Desde la tarjeta de verificación: abre Órdenes filtrada por ese estado.
  const showOrdersWith = (status: ConsolidatedOrderVerificationStatus) => {
    setVerificationFilter(status);
    setActiveTab("ordenes");
  };
  const editingCommentOrder = orders.find((o) => o.orderId === editingCommentId);

  const handleRemoveOrder = async (orderId: string) => {
    try {
      await removeOrder(orderId);
      toast.success("Orden quitada del consolidado");
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  // Verificador efectivo del renglón: lo elegido a mano (incluido "Sin
  // asignar"), si no el guardado, y si no hay ninguno el usuario de la sesión.
  // Ese default no ensucia el renglón: se guarda sólo cuando el renglón tiene
  // algún otro cambio, para no asignarte órdenes que no revisaste.
  const verifierFor = (o: (typeof orders)[number]): string | null => {
    if (o.orderId in verifierDrafts) return verifierDrafts[o.orderId];
    return o.verifiedByUserId ?? (canVerifyOrders && user ? user.id : null);
  };

  const dirtyReviews = orders.filter((o) => {
    const commentChanged =
      o.orderId in commentDrafts && commentDrafts[o.orderId] !== (o.comment ?? "");
    const verifierChanged =
      o.orderId in verifierDrafts && verifierDrafts[o.orderId] !== o.verifiedByUserId;
    const verificationChanged =
      o.orderId in verificationDrafts &&
      verificationDrafts[o.orderId] !== o.verificationStatus;
    return commentChanged || verifierChanged || verificationChanged;
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
          verifiedByUserId: verifierFor(o),
          verificationStatus: verificationDrafts[o.orderId] ?? o.verificationStatus,
        })),
      });
      toast.success("Revisión guardada");
      setCommentDrafts({});
      setVerifierDrafts({});
      setVerificationDrafts({});
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
    // Desde `md` la página ocupa el alto disponible y cada pestaña scrollea
    // por dentro. En pantallas angostas el encabezado, las tarjetas y las
    // pestañas apiladas no dejan alto para la tabla: ahí la página crece y
    // scrollea entera.
    <div className="flex flex-col gap-3 md:h-full md:min-h-0">
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
                title={driver ? `${driver.name} · ${driver.licenseNumber}` : undefined}
              >
                {driver ? driver.name : "Sin asignar"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas (colapsable) */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setStatsOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown
            className={cn("size-3.5 transition-transform", !statsOpen && "-rotate-90")}
          />
          Métricas
        </button>
        {statsOpen && (
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
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as (typeof TABS)[number])}
        className="flex flex-col md:min-h-0 md:flex-1"
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

          <Card className="py-0">
            <CardContent className="p-3">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tabular-nums">{verification.reviewedPct}%</span>
                  <span className="text-sm text-muted-foreground">verificado</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {verification.reviewed} de {verification.total} órdenes
                </span>
              </div>
              <VerificationBar count={verification} className="mt-2 h-2" />
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {(
                  [
                    ["REVIEWED", verification.reviewed, "revisadas"],
                    ["ALERT", verification.alert, "con alerta"],
                    ["PENDING", verification.pending, "pendientes"],
                  ] as const
                ).map(([status, count, label]) => (
                  <button
                    key={status}
                    type="button"
                    disabled={count === 0}
                    onClick={() => showOrdersWith(status)}
                    className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none"
                  >
                    <span className={cn("size-2 rounded-full", TONE_FILL[VERIFICATION_TONE[status]])} />
                    <span className="font-medium tabular-nums text-foreground">{count}</span>
                    {label}
                  </button>
                ))}
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
            {canManageOrders && !isLocked && (
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
                  <SelectTrigger
                    className={cn(
                      "w-full sm:w-56",
                      verificationFilter !== "all" &&
                        TONE_OUTLINE[VERIFICATION_CONFIG[verificationFilter].tone],
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      Todas las revisiones
                      <span className="text-muted-foreground tabular-nums">({verification.total})</span>
                    </SelectItem>
                    {VERIFICATION_OPTIONS.map((v) => {
                      const { label, icon: Icon, tone } = VERIFICATION_CONFIG[v];
                      return (
                        <SelectItem key={v} value={v}>
                          <Icon className={cn("size-3.5", TONE_TEXT[tone])} />
                          {label}
                          <span className="text-muted-foreground tabular-nums">
                            ({orders.filter((o) => o.verificationStatus === v).length})
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* `Table` trae su propio div con scroll: se le pasa el alto para que
                  el encabezado sticky siga fijo (igual que la tabla de órdenes). */}
              {/* En móvil la tabla tiene un alto propio (la página ya
                  scrollea) para conservar el encabezado fijo. */}
              {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Ninguna orden coincide con la búsqueda o el filtro.
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setOrderSearch("");
                      setVerificationFilter("all");
                    }}
                  >
                    Limpiar filtros
                  </Button>
                </div>
              ) : (
              <div className="min-h-0 flex-1 overflow-hidden rounded-md border [&>div]:max-h-[70dvh] [&>div]:overflow-auto md:[&>div]:max-h-full">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background">
                    <TableRow>
                      <TableHead>Rastreo</TableHead>
                      <TableHead>Orden</TableHead>
                      <TableHead>Agencia</TableHead>
                      <TableHead>Paquetería</TableHead>
                      <TableHead>Cliente / Destino</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead>Pies lineales</TableHead>
                      <TableHead>Sección</TableHead>
                      <TableHead>Verificación</TableHead>
                      {canVerifyOrders && <TableHead>Usuario verificador</TableHead>}
                      <TableHead>Comentario</TableHead>
                      {canManageOrders && !isLocked && <TableHead />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((o) => {
                      const rastreo = rastreoFor(o);
                      const verificationStatus =
                        verificationDrafts[o.orderId] ?? o.verificationStatus;
                      const verification = VERIFICATION_CONFIG[verificationStatus];
                      const VerificationIcon = verification.icon;
                      const draft = commentDrafts[o.orderId] ?? o.comment ?? "";
                      const formerVerifier =
                        o.verifiedByUserId &&
                        !verifierUsers.some((u) => u.id === o.verifiedByUserId)
                          ? users.find((u) => u.id === o.verifiedByUserId)
                          : undefined;
                      return (
                        <TableRow
                          key={o.orderId}
                          className={cn(
                            canViewOrders &&
                              (openingOrderId === o.orderId ? "cursor-wait" : "cursor-pointer"),
                          )}
                          onClick={
                            canViewOrders ? () => openOrderDetail(o.orderId, "resumen") : undefined
                          }
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              title="Ver línea de tiempo de la orden"
                              disabled={!canViewOrders || openingOrderId === o.orderId}
                              onClick={() => openOrderDetail(o.orderId, "historial")}
                              className={cn(
                                "rounded-md transition-opacity",
                                canViewOrders && "cursor-pointer hover:opacity-80 disabled:cursor-wait",
                              )}
                            >
                              <Badge
                                variant="outline"
                                className={cn("gap-1", TONE_OUTLINE[rastreo.tone])}
                              >
                                {rastreo.label}
                                {openingOrderId === o.orderId ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  canViewOrders && <ExternalLink className="size-3" />
                                )}
                              </Badge>
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <Badge variant="outline" className="w-fit font-mono text-sm font-semibold">
                                {o.orderNumber ?? "—"}
                              </Badge>
                              {o.partnerOrderNumber && (
                                <Badge variant="secondary" className="w-fit font-mono text-sm font-semibold">
                                  {o.partnerOrderNumber}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {o.store ? (
                              <>
                                <p className="font-medium">{o.store.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {o.store.type === "PARTNER" ? "Agencia" : "JBG"}
                                </p>
                              </>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <CarrierLogo
                                name={o.carrierName}
                                className="size-9 shrink-0 rounded object-contain"
                              />
                              <div>
                                <p className="font-medium">{o.carrierName ?? "—"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {o.trackingNumber ?? "No. de guía no disponible"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{o.client?.name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">
                              {o.destination ? `${o.destination.city}, ${o.destination.country}` : "—"}
                            </p>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {o.totalWeightKg.toFixed(1)} kg
                          </TableCell>
                          <TableCell>{o.linearFeet.toFixed(1)}</TableCell>
                          <TableCell>
                            {o.section ? <Badge variant="outline">{o.section}</Badge> : "—"}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {canVerifyOrders ? (
                              <Select
                                value={verificationStatus}
                                onValueChange={(v) =>
                                  setVerificationDrafts((d) => ({
                                    ...d,
                                    [o.orderId]: v as ConsolidatedOrderVerificationStatus,
                                  }))
                                }
                              >
                                <SelectTrigger
                                  size="sm"
                                  className={cn("min-w-32 text-xs shadow-none", TONE_OUTLINE[verification.tone])}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {VERIFICATION_OPTIONS.map((v) => {
                                    const { label, icon: Icon, tone } = VERIFICATION_CONFIG[v];
                                    return (
                                      <SelectItem key={v} value={v} className="text-xs">
                                        <Icon className={cn("size-3.5", TONE_TEXT[tone])} />
                                        {label}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant="outline" className={cn("gap-1", TONE_OUTLINE[verification.tone])}>
                                <VerificationIcon className="size-3" />
                                {verification.label}
                              </Badge>
                            )}
                            {/* Fecha de la verificación guardada; se oculta
                                mientras hay un cambio sin guardar. */}
                            {o.verifiedAt && verificationStatus === o.verificationStatus && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {new Date(o.verifiedAt).toLocaleString("es-MX", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </p>
                            )}
                          </TableCell>
                          {canVerifyOrders && (
                            <TableCell className="min-w-40" onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={verifierFor(o) ?? "none"}
                                onValueChange={(v) =>
                                  setVerifierDrafts((d) => ({
                                    ...d,
                                    [o.orderId]: v === "none" ? null : v,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-8 border-transparent bg-transparent text-xs shadow-none hover:border-input">
                                  <SelectValue placeholder="Sin asignar" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Sin asignar</SelectItem>
                                  {verifierUsers.map((u) => (
                                    <SelectItem key={u.id} value={u.id}>
                                      {u.name}
                                    </SelectItem>
                                  ))}
                                  {/* Verificador ya guardado que perdió el
                                      permiso: se conserva sólo en su renglón. */}
                                  {formerVerifier && (
                                    <SelectItem value={formerVerifier.id}>
                                      {formerVerifier.name}
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          )}
                          <TableCell className="max-w-72 min-w-48 whitespace-normal" onClick={(e) => e.stopPropagation()}>
                            {!canReviewOrders ? (
                              <span className="text-xs text-muted-foreground">{o.comment ?? "—"}</span>
                            ) : draft.trim() ? (
                              <button
                                type="button"
                                title="Editar comentario"
                                onClick={() => setEditingCommentId(o.orderId)}
                                className="line-clamp-2 w-full cursor-text rounded-md px-2 py-1 text-left text-xs transition-colors hover:bg-muted"
                              >
                                {draft}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:underline"
                                onClick={() => setEditingCommentId(o.orderId)}
                              >
                                <MessageSquarePlus className="size-3.5" />
                                Agregar comentario
                              </button>
                            )}
                          </TableCell>
                          {canManageOrders && !isLocked && (
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-7 text-destructive hover:bg-destructive/10"
                                disabled={isRemovingOrder}
                                onClick={() => handleRemoveOrder(o.orderId)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Mostrando {filteredOrders.length} de {orders.length} orden
                  {orders.length === 1 ? "" : "es"}.
                </p>
                {canReviewOrders && (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={dirtyReviews.length === 0 || isUpdatingOrderComments}
                    onClick={handleSaveReview}
                  >
                    <Save className="size-3.5" />
                    {isUpdatingOrderComments ? "Guardando..." : "Guardar revisión"}
                  </Button>
                )}
              </div>
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
                      {entry.details.length > 0 && (
                        <ul className="mt-0.5 space-y-0.5 text-xs text-muted-foreground">
                          {/* Índice: dos líneas pueden repetirse (órdenes con
                              el mismo número) y la lista no se reordena. */}
                          {entry.details.map((detail, i) => (
                            <li key={i}>{detail}</li>
                          ))}
                        </ul>
                      )}
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

      <OrderDetailDialog
        order={timelineOrderId ? (timelineOrder ?? null) : null}
        open={!!timelineOrderId && !!timelineOrder}
        onClose={closeOrderTimeline}
        defaultTab={detailTab}
      />

      {editingCommentOrder && (
        <OrderCommentDialog
          key={editingCommentOrder.orderId}
          open
          onOpenChange={(open) => !open && setEditingCommentId(null)}
          orderLabel={orderLabel(editingCommentOrder)}
          initialValue={
            commentDrafts[editingCommentOrder.orderId] ?? editingCommentOrder.comment ?? ""
          }
          onSubmit={(value) =>
            setCommentDrafts((d) => ({ ...d, [editingCommentOrder.orderId]: value }))
          }
        />
      )}

      <AddOrdersDialog
        open={addOrdersOpen}
        onOpenChange={setAddOrdersOpen}
        capacityLinearFeet={consolidation.capacityLinearFeet}
        usedLinearFeet={totalLinearFeet}
        linearFeetDivisor={consolidation.linearFeetDivisor}
        addOrders={addOrders}
        isAddingOrders={isAddingOrders}
      />
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
