import { z } from "zod";

export const sendCloverCheckoutEmailResponseSchema = z.object({
  recipientEmail: z.email(),
});

export type SendCloverCheckoutEmailResponse = z.infer<
  typeof sendCloverCheckoutEmailResponseSchema
>;
