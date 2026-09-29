import {
  shipmentStages,
  type ShipmentStage,
} from "@contexts/shipping/domain/schemas/shipment/ShipmentStages";

export interface TimelineFlags {
  /**
   * Si la orden pasa por un agente: toda orden de socio, y las de caja vacía o
   * recolección a domicilio. Una de mostrador nace en la bodega de origen —
   * `Order.createForHQ` fuerza las banderas de domicilio en `false`—, así que
   * mostrarle la etapa del agente sería un paso que nunca va a ocurrir.
   */
  hasAgentStage: boolean;
  /**
   * Si la lleva una paquetería (Skydropx). Ahí el paquete nunca pasa por una
   * bodega de JBG en destino, y el webhook no tiene cómo decir esa etapa.
   */
  viaCarrier: boolean;
}

/**
 * Las etapas que le corresponden a esta orden, en orden.
 *
 * La guía pide que la línea principal sea sencilla (§1), y un paso que nunca
 * va a llegar no suma: se omite en vez de mostrarse como pendiente para
 * siempre. La etapa actual se incluye siempre, aunque las banderas digan que no
 * aplica, para que un envío corregido a mano nunca quede fuera de su línea.
 */
export function timelineStages(
  flags: TimelineFlags,
  currentStage: ShipmentStage | null = null,
): readonly ShipmentStage[] {
  return shipmentStages.filter((stage) => {
    if (stage === currentStage) return true;
    if (stage === "AGENT") return flags.hasAgentStage;
    if (stage === "DESTINATION_WAREHOUSE") return !flags.viaCarrier;
    return true;
  });
}
