import type { RouteType } from "./Route";

/** Copy that differs between the delivery, picking, and box-drop modules. */
export const ROUTE_TYPE_COPY: Record<
  RouteType,
  {
    tabLabel: string;
    subtitle: string;
    newButton: string;
    stopsDoneLabel: string;
    emptyHint: string;
    /** "Progreso de entrega" / "Progreso de recolección" / "Progreso de cajas vacías" */
    progressTitle: string;
    /** Stat tile label for the count of DELIVERED stops. */
    deliveredStatLabel: string;
    /** Stop badge / attempt outcome label for a DELIVERED status. */
    stopStatusDelivered: string;
    /** Empty state when a stop has no attempts yet. */
    noAttemptsMessage: string;
    /** Label shown above the customer signature evidence for a DELIVERED attempt. */
    signatureLabel: string;
  }
> = {
  DELIVERY: {
    tabLabel: "Rutas de entrega",
    subtitle:
      "Planifica rutas, asigna conductores y monitorea el progreso de cada entrega.",
    newButton: "Nueva ruta de entrega",
    stopsDoneLabel: "entregadas",
    emptyHint: "Crear primera ruta de entrega",
    progressTitle: "Progreso de entrega",
    deliveredStatLabel: "Entregadas",
    stopStatusDelivered: "Entregada",
    noAttemptsMessage: "Aún no se han registrado intentos de entrega para esta parada.",
    signatureLabel: "Firma de quien recibe",
  },
  PICKING: {
    tabLabel: "Rutas para recolección",
    subtitle:
      "Crea rutas para recolectar a domicilio los paquetes de los clientes (flota JBG).",
    newButton: "Nueva ruta de recolección",
    stopsDoneLabel: "recolectadas",
    emptyHint: "Crear primera ruta de recolección",
    progressTitle: "Progreso de recolección",
    deliveredStatLabel: "Recolectadas",
    stopStatusDelivered: "Recolectada",
    noAttemptsMessage: "Aún no se han registrado intentos de recolección para esta parada.",
    signatureLabel: "Firma de quien entrega el paquete",
  },
  BOX_DROP: {
    tabLabel: "Rutas de cajas vacías",
    subtitle:
      'Crea rutas para dejar cajas vacías en el domicilio de órdenes "dejar caja vacía a domicilio".',
    newButton: "Nueva ruta de cajas vacías",
    stopsDoneLabel: "entregadas",
    emptyHint: "Crear primera ruta de cajas vacías",
    progressTitle: "Progreso de entrega de cajas",
    deliveredStatLabel: "Cajas entregadas",
    stopStatusDelivered: "Caja entregada",
    noAttemptsMessage: "Aún no se han registrado intentos de entrega de caja para esta parada.",
    signatureLabel: "Firma de quien recibe la caja",
  },
};
