import { hasAll, hasAny } from "./Policy";

export const consolidationPolicies = {
  list: hasAll("CAN_LIST_CONSOLIDATIONS"),
  view: hasAll("CAN_VIEW_CONSOLIDATIONS"),
  create: hasAll("CAN_CREATE_CONSOLIDATIONS"),
  edit: hasAll("CAN_EDIT_CONSOLIDATIONS"),
  delete: hasAll("CAN_DELETE_CONSOLIDATIONS"),
  // Agregar y quitar órdenes del embarque. El permiso conserva su nombre
  // histórico ("packages": antes se consolidaban paquetes de bodega).
  manageOrders: hasAll("CAN_MANAGE_CONSOLIDATION_PACKAGES"),
  advanceStage: hasAll("CAN_ADVANCE_CONSOLIDATION_STAGE"),

  // Revisión de las órdenes del embarque. `reviewOrders` es guardar la
  // revisión (comentarios): quien edita el consolidado o quien verifica.
  // `verifyOrders` es además elegir el estatus de verificación y el usuario
  // verificador.
  reviewOrders: hasAny(
    "CAN_EDIT_CONSOLIDATIONS",
    "CAN_VERIFY_CONSOLIDATION_ORDERS",
  ),
  verifyOrders: hasAll("CAN_VERIFY_CONSOLIDATION_ORDERS"),

  // Catálogo de tráilers
  listTrailers: hasAll("CAN_LIST_TRAILERS"),
  // Leer el catálogo: también quien crea consolidados, para elegir el tráiler.
  // Sólo protege la ruta; la página de Tráilers sigue pidiendo `listTrailers`.
  findTrailers: hasAny("CAN_LIST_TRAILERS", "CAN_CREATE_CONSOLIDATIONS"),
  createTrailers: hasAll("CAN_CREATE_TRAILERS"),
  editTrailers: hasAll("CAN_EDIT_TRAILERS"),
};
