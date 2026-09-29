import type { StatusTone } from "@contexts/shared/domain/schemas/StatusTone";

/**
 * El estatus **operativo** del envío: qué falta hacer y quién lo debe. Lo que
 * ve el cliente es la etapa (`ShipmentStages`); este es el que usan las rutas,
 * la guía y la oficina.
 */
export const shipmentStatuses = [
  "DRAFT",
  // Ciclo de caja vacía ("dejar caja vacía a domicilio"), antes de fulfil
  "EMPTY_BOX_PENDING",
  "AWAITING_PICKUP",
  // Paquete en la oficina del agente, esperando que JBG pase a buscarlo. Es el
  // default de una orden de socio: el cliente se lo lleva al agente.
  "AWAITING_AGENCY_PICKUP",
  "AT_WAREHOUSE",
  "PROVIDER_SELECTED",
  "FULFILLED",
  "IN_ROUTE",
  "DELIVERED",
  "FAILED_ATTEMPT",
  "RETURNED",
  "CANCELLED",
] as const;

export type ShipmentStatus = (typeof shipmentStatuses)[number];

/**
 * El paquete todavía no llegó a la bodega: no se puede procesar (tarifar y
 * elegir paquetería). Espeja la guarda de `Shipment.selectProvider` del back,
 * que es la autoridad; esta copia es para no dejar entrar al paso de cotizar.
 */
const AWAITING_ARRIVAL: readonly ShipmentStatus[] = [
  "EMPTY_BOX_PENDING",
  "AWAITING_PICKUP",
  "AWAITING_AGENCY_PICKUP",
];

export const isAwaitingArrival = (status: ShipmentStatus | undefined): boolean =>
  !!status && AWAITING_ARRIVAL.includes(status);

export const AWAITING_ARRIVAL_REASON =
  "El paquete todavía no llegó a la bodega. Recolétalo o registra \"Recibido en bodega origen\" antes de procesarla.";

/**
 * El tono de cada estatus: **de quién es la pelota.** Ver `StatusTone`.
 *
 * Es la única fuente del color de estado, y de acá lo toman la barra de la
 * tabla, el punto del encabezado del detalle, el badge y la línea de tiempo.
 * Antes cada superficie lo decidía por su cuenta y la misma orden se veía de un
 * color en la tabla y de otro en el detalle.
 *
 * Sale del estatus y no de la etapa porque la etapa dice dónde está el paquete,
 * no si alguien tiene que hacer algo: "Bodega origen" puede ser "por procesar"
 * (ámbar, JBG debe tarifarla) o "por despachar" (azul, ya tiene guía).
 */
export const SHIPMENT_STATUS_TONE: Record<ShipmentStatus, StatusTone> = {
  DRAFT: "draft",
  EMPTY_BOX_PENDING: "waiting",
  AWAITING_PICKUP: "waiting",
  AWAITING_AGENCY_PICKUP: "waiting",
  AT_WAREHOUSE: "waiting",
  // Esperando el webhook de la paquetería. Ámbar y no tránsito porque es donde
  // se atora una creación, y conviene que se vea.
  PROVIDER_SELECTED: "waiting",
  FULFILLED: "transit",
  IN_ROUTE: "transit",
  FAILED_ATTEMPT: "waiting",
  DELIVERED: "done",
  RETURNED: "stopped",
  CANCELLED: "stopped",
};

/**
 * **El vocabulario operativo.** Un nombre por estatus, y el único lugar donde
 * se decide cómo se le dice a cada uno. Se muestra como segunda línea debajo de
 * la etapa: la etapa dice dónde está, esto dice qué falta.
 *
 * Tres reglas:
 *
 * 1. **El nombre dice qué falta hacer y quién lo debe.** De ahí la forma
 *    paralela —*por entregar caja, por recolectar, por procesar, por
 *    despachar*—, que es lo que hace que la lista se lea como un sistema.
 * 2. **El sujeto es siempre la orden**, porque toda pantalla habla de una orden.
 *    De ahí el femenino.
 * 3. **Nada se nombra por el trámite.** `FULFILLED` no es "Guía generada" —la
 *    guía se emite en el mismo movimiento en que la orden queda procesada, así
 *    que repetía el otro estatus— sino qué falta: despacharla.
 *
 * `AT_WAREHOUSE` comparte nombre con el estatus de orden `PENDING_HQ_PROCESS`
 * ("Por procesar") a propósito: son el mismo trabajo pendiente de JBG —pesar y
 * tarifar— y tener dos nombres los ponía en dos colas distintas.
 */
export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  DRAFT: "Borrador",
  EMPTY_BOX_PENDING: "Por entregar caja",
  // El par se lee junto: las dos son recolecciones, lo que cambia es dónde va el
  // chofer — al domicilio del remitente o al mostrador del agente.
  AWAITING_PICKUP: "Por recolectar a domicilio",
  AWAITING_AGENCY_PICKUP: "Por recolectar en agencia",
  AT_WAREHOUSE: "Por procesar",
  PROVIDER_SELECTED: "Generando guía",
  FULFILLED: "Por despachar",
  IN_ROUTE: "En ruta",
  DELIVERED: "Entregada",
  FAILED_ATTEMPT: "Intento fallido",
  RETURNED: "Devuelta al remitente",
  CANCELLED: "Cancelada",
};
