import { z } from "zod";

export const aggregateRootSchema = z.object({
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export type AggregateRootPrimitives = z.infer<typeof aggregateRootSchema>;
