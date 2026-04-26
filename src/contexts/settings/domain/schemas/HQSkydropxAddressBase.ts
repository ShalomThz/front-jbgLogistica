import z from "zod";
import { emailSchema } from "../../../shared/domain/schemas/Email";

export const hqSkydropxBaseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  email: emailSchema,
  phone: z.string().min(1, "Phone is required"),
});
