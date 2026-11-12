import type { ConsolidatedOrderVerificationStatus } from "@contexts/consolidation/domain/schemas/consolidation/Consolidation";

export interface VerificationCount {
  total: number;
  reviewed: number;
  alert: number;
  pending: number;
  /** Sólo cuenta "Revisado": una orden en Alerta ya se miró pero tiene un
   * problema abierto, así que no está verificada. */
  reviewedPct: number;
}

/** Avance de la verificación de un consolidado, para el listado y el detalle. */
export function countVerification(
  orders: { verificationStatus: ConsolidatedOrderVerificationStatus }[],
): VerificationCount {
  const reviewed = orders.filter((o) => o.verificationStatus === "REVIEWED").length;
  const alert = orders.filter((o) => o.verificationStatus === "ALERT").length;
  const total = orders.length;
  return {
    total,
    reviewed,
    alert,
    pending: total - reviewed - alert,
    reviewedPct: total === 0 ? 0 : Math.round((reviewed / total) * 100),
  };
}
