import { z } from "zod";

export const geolocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  placeId: z.string().nullable(),
});

export type GeolocationPrimitives = z.infer<typeof geolocationSchema>;

export const responseGeolocationSchema = z.object({
  latitude: z
    .number()
    .min(-90)
    .max(90)
    .nullable()
    .transform((v) => v ?? 0),
  longitude: z
    .number()
    .min(-180)
    .max(180)
    .nullable()
    .transform((v) => v ?? 0),
  placeId: z.string().nullable(),
});

export type ResponseGeolocationPrimitives = z.infer<
  typeof responseGeolocationSchema
>;
