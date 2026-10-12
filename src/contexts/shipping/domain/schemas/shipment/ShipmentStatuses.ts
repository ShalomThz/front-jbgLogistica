import type { StatusTone } from "@contexts/shared/domain/schemas/StatusTone";

/**
 * El estatus del envío: lo único que ve el usuario. La etapa (`ShipmentStages`)
 * no se guarda aparte: el back la deduce del estatus.
 */
export const shipmentStatuses = [
  "DRAFT",
  // Ciclo de caja vacía ("dejar caja vacía a domicilio"), antes de la venta
  "EMPTY_BOX_PENDING",
  "AWAITING_PICKUP",
  // Paquete en la oficina del agente, esperando que JBG pase a buscarlo. Es el
  // default de una orden de socio: el cliente se lo lleva al agente.
  "AWAITING_AGENCY_PICKUP",
  "COLLECTED", // el chofer lo recolectó; va en camino a la bodega de origen
  "AT_WAREHOUSE", // la bodega de origen lo recibió
  "PROVIDER_SELECTED",
  "FULFILLED", // con guía, en la bodega de origen
  // Flota JBG: cada etapa es un estatus. Una paquetería pasa de FULFILLED a
  // IN_TRANSIT, y lo que reporta va en `carrierStatus`.
  "DISPATCHED",
  "IN_TRANSIT",
  "AT_DESTINATION",
  "IN_DISTRIBUTION",
  "IN_ROUTE",
  "DELIVERED",
  "FAILED_ATTEMPT",
  "RETURNED",
  "CANCELLED",
] as const;

export type ShipmentStatus = (typeof shipmentStatuses)[number];

/** Desde dónde puede entrar un envío de la flota JBG a una ruta de entrega.
 * Espeja `DELIVERY_ROUTE_READY` del back. */
export const DELIVERY_ROUTE_READY: readonly ShipmentStatus[] = [
  "FULFILLED",
  "DISPATCHED",
  "IN_TRANSIT",
  "AT_DESTINATION",
  "IN_DISTRIBUTION",
];

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
  COLLECTED: "transit",
  AT_WAREHOUSE: "waiting",
  // Esperando el webhook de la paquetería. Ámbar y no tránsito porque es donde
  // se atora una creación, y conviene que se vea.
  PROVIDER_SELECTED: "waiting",
  FULFILLED: "transit",
  DISPATCHED: "transit",
  IN_TRANSIT: "transit",
  AT_DESTINATION: "transit",
  IN_DISTRIBUTION: "transit",
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
 * Del despacho en adelante el paquete está en camino y no hay "qué falta" que
 * decir: el nombre es la etapa misma.
 */
export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  DRAFT: "Borrador",
  EMPTY_BOX_PENDING: "Por entregar caja",
  // El par se lee junto: las dos son recolecciones, lo que cambia es dónde va el
  // chofer — al domicilio del remitente o al mostrador del agente.
  AWAITING_PICKUP: "Por recolectar a domicilio",
  AWAITING_AGENCY_PICKUP: "Por recolectar en agencia",
  COLLECTED: "Por recibir en bodega",
  AT_WAREHOUSE: "Por procesar",
  PROVIDER_SELECTED: "Generando guía",
  FULFILLED: "Por despachar",
  DISPATCHED: "Despachada",
  IN_TRANSIT: "En tránsito",
  AT_DESTINATION: "En bodega destino",
  IN_DISTRIBUTION: "En distribución",
  IN_ROUTE: "En ruta",
  DELIVERED: "Entregada",
  FAILED_ATTEMPT: "Intento fallido",
  RETURNED: "Devuelta al remitente",
  CANCELLED: "Cancelada",
};
