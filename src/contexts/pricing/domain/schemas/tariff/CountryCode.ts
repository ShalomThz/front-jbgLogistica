import { z } from "zod";
export const countryCodeSchema = z.stringFormat("country-code", /^[A-Z]{2}$/);