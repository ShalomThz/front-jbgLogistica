import { z } from "zod";

export const findCountriesRequestSchema = z.object({
  search: z.string().optional(),
});

export type FindCountriesRequest = z.infer<typeof findCountriesRequestSchema>;

export const COUNTRIES = [
  { code: "MX", name: "México" },
  { code: "US", name: "Estados Unidos" },
  { code: "GT", name: "Guatemala" },
  { code: "HN", name: "Honduras" },
  { code: "SV", name: "El Salvador" },
  { code: "NI", name: "Nicaragua" },
  { code: "CR", name: "Costa Rica" },
  { code: "PA", name: "Panamá" },
  { code: "CO", name: "Colombia" },
  { code: "VE", name: "Venezuela" },
  { code: "EC", name: "Ecuador" },
  { code: "PE", name: "Perú" },
  { code: "BO", name: "Bolivia" },
  { code: "CL", name: "Chile" },
  { code: "AR", name: "Argentina" },
  { code: "UY", name: "Uruguay" },
  { code: "PY", name: "Paraguay" },
  { code: "BR", name: "Brasil" },
  { code: "CU", name: "Cuba" },
  { code: "DO", name: "República Dominicana" },
  { code: "PR", name: "Puerto Rico" },
  { code: "BZ", name: "Belice" },
  { code: "CA", name: "Canadá" },
  { code: "ES", name: "España" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];
