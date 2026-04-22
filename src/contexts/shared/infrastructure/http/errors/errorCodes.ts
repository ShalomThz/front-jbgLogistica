import type { Lang } from "./detectLang";

export const errorTranslations: Record<string, Record<Lang, string>> = {
  EMAIL_ALREADY_TAKEN: {
    es: "El correo electrónico ya está en uso",
    en: "Email is already taken",
    pt: "O e-mail já está em uso",
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
  UNAUTHORIZED: {
    es: "No tienes permiso para realizar esta acción",
    en: "You are not authorized to perform this action",
    pt: "Você não tem permissão para realizar esta ação",
  },
};
