import type { Lang } from "./detectLang";

export const errorTranslations: Record<string, Record<Lang, string>> = {
  EMAIL_ALREADY_TAKEN: {
    es: "El correo electrónico ya está en uso",
    en: "Email is already taken",
    pt: "O e-mail já está em uso",
  },
  PHONE_ALREADY_TAKEN: {
    es: "El número de teléfono ya está en uso",
    en: "Phone number is already in use",
    pt: "O número de telefone já está em uso",
  },
  BOX_NAME_ALREADY_EXISTS: {
    es: "Ya existe una caja con ese nombre",
    en: "A box with that name already exists",
    pt: "Já existe uma caixa com esse nome",
  },
  BOX_DIMENSIONS_ALREADY_EXIST: {
    es: "Ya existe una caja con las mismas dimensiones",
    en: "A box with the same dimensions already exists",
    pt: "Já existe uma caixa com as mesmas dimensões",
  },
  ORDER_DUPLICATE_REFERENCES: {
    es: "Ya existe una orden con las mismas referencias",
    en: "An order with the same references already exists",
    pt: "Já existe um pedido com as mesmas referências",
  },
  ORDER_DUPLICATE_PARTNER_NUMBER: {
    es: "Ya existe una orden con el mismo número de factura del agente",
    en: "An order with the same partner order number already exists",
    pt: "Já existe um pedido com o mesmo número de pedido do parceiro",
  },
  BOX_NOT_FOUND: {
    es: "Caja no encontrada",
    en: "Box not found",
    pt: "Caixa não encontrada",
  },
  PACKAGE_NOT_FOUND: {
    es: "Paquete no encontrado",
    en: "Package not found",
    pt: "Pacote não encontrado",
  },
  CARRIER_NO_ANSWER: {
    es: "La paquetería no respondió al pedir la guía. Vuelve a intentar en un momento.",
    en: "The carrier did not answer the label request. Try again in a moment.",
    pt: "A transportadora não respondeu ao pedido da etiqueta. Tente novamente em instantes.",
  },
  LABEL_IN_CREATION: {
    es: "La paquetería está generando la guía. Espera su respuesta e inténtalo de nuevo.",
    en: "The carrier is creating the label. Wait for its answer and try again.",
    pt: "A transportadora está gerando a etiqueta. Aguarde a resposta e tente novamente.",
  },
  SHIPMENT_FINISHED: {
    es: "El envío ya terminó (entregado, devuelto o cancelado): no se puede cancelar.",
    en: "The shipment already finished (delivered, returned or cancelled): it can't be cancelled.",
    pt: "O envio já terminou (entregue, devolvido ou cancelado): não pode ser cancelado.",
  },
  LABEL_DATA_LOCKED: {
    es: "La guía ya salió: el paquete, las direcciones y el modo de recolección ya no se pueden cambiar.",
    en: "The label is already issued: the package, addresses and pickup mode can't be changed.",
    pt: "A etiqueta já foi emitida: o pacote, os endereços e o modo de coleta não podem ser alterados.",
  },
  PICKUP_MODE_ON_ROUTE: {
    es: "El envío ya está en una ruta del chofer. Sácalo de la ruta antes de cambiar el modo de recolección.",
    en: "The shipment is already on a driver route. Remove it from the route before changing the pickup mode.",
    pt: "O envio já está em uma rota do motorista. Remova-o da rota antes de alterar o modo de coleta.",
  },
  EMPTY_BOX_ALREADY_DELIVERED: {
    es: "La caja vacía ya se le entregó al remitente: ya no se puede quitar.",
    en: "The empty box was already delivered to the sender: it can't be removed.",
    pt: "A caixa vazia já foi entregue ao remetente: não pode mais ser removida.",
  },
  PICKUP_MODE_LOCKED: {
    es: "El paquete ya se recolectó o ya llegó a la bodega: el modo de recolección ya no se puede cambiar.",
    en: "The package was already collected or reached the warehouse: the pickup mode can't be changed.",
    pt: "O pacote já foi coletado ou chegou ao armazém: o modo de coleta não pode ser alterado.",
  },
  EMPTY_BOX_DOWN_PAYMENT_REQUIRED: {
    es: "Registra cuánto le cobras a tu cliente y el anticipo que te pagó para dejar la caja vacía.",
    en: "Record what you charge your customer and the down payment they made to leave the empty box.",
    pt: "Registre quanto você cobra do seu cliente e o adiantamento que ele pagou para deixar a caixa vazia.",
  },
  ORDER_CANCELLED_PAYMENT: {
    es: "La orden está cancelada: no se le pueden registrar abonos.",
    en: "The order is cancelled: payments can't be recorded.",
    pt: "O pedido está cancelado: não é possível registrar pagamentos.",
  },
  PAYMENT_ID_CONFLICT: {
    es: "Ese abono ya se había registrado con otros datos. Revisa el libro antes de volver a registrarlo.",
    en: "That payment was already recorded with different data. Check the ledger before recording it again.",
    pt: "Esse pagamento já foi registrado com outros dados. Confira o livro antes de registrá-lo de novo.",
  },
  ORDER_ID_CONFLICT: {
    es: "Esta orden ya se creó desde otra sesión. Recarga la página y búscala en la lista de órdenes.",
    en: "This order was already created from another session. Reload the page and find it in the orders list.",
    pt: "Este pedido já foi criado em outra sessão. Recarregue a página e procure-o na lista de pedidos.",
  },
  UNAUTHORIZED: {
    es: "No tienes permiso para realizar esta acción",
    en: "You are not authorized to perform this action",
    pt: "Você não tem permissão para realizar esta ação",
  },
};
