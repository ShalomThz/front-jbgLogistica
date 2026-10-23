import type { StatusTone } from "@contexts/shared/domain/schemas/StatusTone";

/**
 * Las ocho etapas de un consolidado, en orden estricto. A diferencia de
 * `ShipmentStage`, acá no hay saltos ni rutas alternas: se avanza una por una,
 * a mano, desde el panel de administración (decisión de negocio — sin
 * transiciones automáticas por geocerca todavía).
 */
export const consolidationStages = [
  "PREPARACION",
  "CARGANDO",
  "SELLADO",
  "DESPACHADO",
  "EN_TRANSITO",
  "EN_DESTINO",
  "DESCARGANDO",
  "CONCILIADO",
] as const;

export type ConsolidationStage = (typeof consolidationStages)[number];

export const stageIndex = (stage: ConsolidationStage): number =>
  consolidationStages.indexOf(stage);

export const STAGE_LABELS: Record<ConsolidationStage, string> = {
  PREPARACION: "Preparación",
  CARGANDO: "Cargando",
  SELLADO: "Sellado",
  DESPACHADO: "Despachado",
  EN_TRANSITO: "En tránsito",
  EN_DESTINO: "En destino",
  DESCARGANDO: "Descargando",
  CONCILIADO: "Conciliado",
};

export const STAGE_CAPTIONS: Record<ConsolidationStage, string> = {
  PREPARACION: "Armando el embarque",
  CARGANDO: "Subiendo cajas al tráiler",
  SELLADO: "Puerta sellada, ya no se edita la carga",
  DESPACHADO: "Salió de la bodega de origen",
  EN_TRANSITO: "En carretera",
  EN_DESTINO: "Llegó a la bodega de destino",
  DESCARGANDO: "Bajando cajas",
  CONCILIADO: "Entregado y revisado",
};

/** Desde esta etapa (inclusive) la lista de cajas queda bloqueada: ya no se
 * pueden agregar ni quitar paquetes del consolidado. */
export const LOCKED_FROM_STAGE: ConsolidationStage = "SELLADO";

export const isPackageListLocked = (stage: ConsolidationStage): boolean =>
  stageIndex(stage) >= stageIndex(LOCKED_FROM_STAGE);

export const nextStage = (stage: ConsolidationStage): ConsolidationStage | null =>
  consolidationStages[stageIndex(stage) + 1] ?? null;

/** Un solo tono por etapa: preparación en gris (todavía no sale), conciliado
 * en verde (ya cerró), el resto en azul (en curso) — no hay "incidencia" propia
 * de un consolidado todavía. */
export const toneForStage = (stage: ConsolidationStage): StatusTone => {
  if (stage === "PREPARACION") return "draft";
  if (stage === "CONCILIADO") return "done";
  return "transit";
};
