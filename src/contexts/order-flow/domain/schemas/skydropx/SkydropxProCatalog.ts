import { z } from "zod";

// Skydropx Pro catalogs are flat + paginated: { data: [...], meta }.

export const skydropxProPackagingSchema = z.object({
  code: z.string(),
  name: z.string(),
});

export type SkydropxProPackaging = z.infer<typeof skydropxProPackagingSchema>;

export const skydropxProConsignmentNoteSchema = z.object({
  // SAT codes come back as strings and may carry leading zeros (e.g.
  // "01010101"), so keep them as strings — never coerce to number.
  consignment_note: z.string(),
  description: z.string(),
});

export type SkydropxProConsignmentNote = z.infer<
  typeof skydropxProConsignmentNoteSchema
>;
