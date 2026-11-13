import z from "zod";

export const addPaymentNoteRequestSchema = z.object({
  /** Lo genera el formulario al capturar la nota y lo conserva hasta que se
   * registra: si la respuesta se pierde y se reintenta, el back reconoce el
   * mismo id y no la vuelve a registrar. */
  id: z.uuid().optional(),
  text: z.string().trim().min(1).max(1000),
});

export type AddPaymentNoteRequest = z.infer<typeof addPaymentNoteRequestSchema>;
