import { z } from "zod";

export const emailSchema = z.email("Invalid email format");

/** Correo opcional: válido cuando hay valor, permite cadena vacía o null. */
export const optionalEmailSchema = z
  .string()
  .nullable()
  .refine((value) => !value || z.email().safeParse(value).success, {
    message: "Formato de correo inválido",
  });
