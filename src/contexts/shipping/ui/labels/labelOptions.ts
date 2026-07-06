import type { LabelVariant } from "@contexts/shipping/domain/schemas/value-objects/LabelVariant";
import type { ShipmentPrimitives } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import { shipmentRepository } from "@contexts/shipping/infrastructure/services/shipments/shipmentRepository";

/**
 * How a label option produces its PDF:
 * - `render`: generated on demand by our backend (`GET /shipment/:id/label`),
 *   one per {@link LabelVariant}. These are the internal JBG labels.
 * - `carrier`: the provider's own label, already stored on `label.documentUrl`.
 */
export type LabelSource =
  | { kind: "render"; variant: LabelVariant }
  | { kind: "carrier" };

/**
 * Family a label option belongs to. Used to render grouped quick-access
 * controls (e.g. the agente printer button that expands to every agente
 * variant) without branching on individual variants at the call site.
 */
export type LabelGroup = "cargo" | "agente" | "carrier" | "caja-vacia";

export interface LabelOption {
  id: string;
  title: string;
  source: LabelSource;
  group: LabelGroup;
  /** Accent classes for the dropdown/menu item. */
  className: string;
  /** Whether this option can be produced for the given shipment. */
  isAvailable: (shipment: ShipmentPrimitives) => boolean;
}

const hasCarrierDocument = (shipment: ShipmentPrimitives): boolean =>
  Boolean(
    shipment.label?.documentUrl && !shipment.label.documentUrl.startsWith("/"),
  );

/** Internal guía variants render once the shipment has a generated label. */
const hasInternalLabel = (shipment: ShipmentPrimitives): boolean =>
  shipment.label !== null;

/** The empty-box label lives in the box cycle, before any guía exists. */
const isInEmptyBoxCycle = (shipment: ShipmentPrimitives): boolean =>
  shipment.status === "EMPTY_BOX_PENDING" ||
  shipment.status === "AWAITING_PICKUP" ||
  shipment.status === "AT_WAREHOUSE";

/**
 * Single source of truth for every downloadable/printable label. To expose a
 * new internal label everywhere it's consumed, add its {@link LabelVariant} in
 * both repos and append one entry here — the menus and handlers pick it up
 * automatically.
 */
export const LABEL_OPTIONS: LabelOption[] = [
  {
    id: "cargo",
    title: "JBG Cargo",
    source: { kind: "render", variant: "cargo" },
    group: "cargo",
    className:
      "bg-blue-50 text-blue-700 focus:bg-blue-100 focus:text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 dark:focus:bg-blue-950/50",
    isAvailable: hasInternalLabel,
  },
  {
    id: "agente",
    title: "JBG Agente",
    source: { kind: "render", variant: "agente" },
    group: "agente",
    className:
      "bg-orange-50 text-orange-700 focus:bg-orange-100 focus:text-orange-800 dark:bg-orange-950/30 dark:text-orange-400 dark:focus:bg-orange-950/50",
    isAvailable: hasInternalLabel,
  },
  {
    id: "agente-cliente",
    title: "JBG Agente Cliente",
    source: { kind: "render", variant: "agente-cliente" },
    group: "agente",
    className:
      "bg-teal-50 text-teal-700 focus:bg-teal-100 focus:text-teal-800 dark:bg-teal-950/30 dark:text-teal-400 dark:focus:bg-teal-950/50",
    isAvailable: hasInternalLabel,
  },
  {
    id: "caja-vacia",
    title: "JBG Caja Vacía",
    source: { kind: "render", variant: "caja-vacia" },
    group: "caja-vacia",
    className:
      "bg-amber-50 text-amber-700 focus:bg-amber-100 focus:text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 dark:focus:bg-amber-950/50",
    isAvailable: isInEmptyBoxCycle,
  },
  {
    id: "carrier",
    title: "Guía del transportista",
    source: { kind: "carrier" },
    group: "carrier",
    className:
      "bg-violet-50 text-violet-700 focus:bg-violet-100 focus:text-violet-800 dark:bg-violet-950/30 dark:text-violet-400 dark:focus:bg-violet-950/50",
    isAvailable: hasCarrierDocument,
  },
];

export const availableLabelOptions = (
  shipment: ShipmentPrimitives,
): LabelOption[] =>
  LABEL_OPTIONS.filter((option) => option.isAvailable(shipment));

/** Available options for a single family (e.g. every agente variant). */
export const availableLabelOptionsByGroup = (
  shipment: ShipmentPrimitives,
  group: LabelGroup,
): LabelOption[] =>
  availableLabelOptions(shipment).filter((option) => option.group === group);

/**
 * Resolves a label option to a URL ready to open/print/download. Rendered
 * variants are fetched as a blob and wrapped in an object URL (revoke via
 * `cleanup`); the carrier label reuses its stored document URL as-is.
 */
const resolveLabelUrl = async (
  shipment: ShipmentPrimitives,
  source: LabelSource,
): Promise<{ url: string; cleanup: () => void }> => {
  if (source.kind === "carrier") {
    return { url: shipment.label?.documentUrl ?? "", cleanup: () => {} };
  }
  const blob = await shipmentRepository.getLabel(shipment.id, source.variant);
  const url = URL.createObjectURL(blob);
  return { url, cleanup: () => URL.revokeObjectURL(url) };
};

/** Opens a label in a new tab and triggers the print dialog. */
export const printLabel = async (
  shipment: ShipmentPrimitives,
  source: LabelSource,
): Promise<void> => {
  const { url } = await resolveLabelUrl(shipment, source);
  if (!url) return;
  const printWindow = window.open(url, "_blank");
  if (source.kind === "carrier") {
    printWindow?.print();
    return;
  }
  printWindow?.addEventListener("load", () => printWindow.print());
};

/** Downloads a label file (or opens the carrier's document in a new tab). */
export const downloadLabel = async (
  shipment: ShipmentPrimitives,
  source: LabelSource,
  filename: string,
): Promise<void> => {
  if (source.kind === "carrier") {
    if (shipment.label?.documentUrl)
      window.open(shipment.label.documentUrl, "_blank");
    return;
  }
  const { url, cleanup } = await resolveLabelUrl(shipment, source);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  cleanup();
};
