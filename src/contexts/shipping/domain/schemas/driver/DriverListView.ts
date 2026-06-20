import { userSchema } from "@contexts/iam/domain/schemas/user/User";
import type { z } from "zod";
import { driverSchema } from "./Driver";

// `user` es un snapshot denormalizado: se excluyen `passwordHash` (no debe
// viajar) y `role` (autorización, no se usa aquí y acoplaría al enum de permisos).
export const driverListViewSchema = driverSchema
  .omit({ userId: true })
  .extend({ user: userSchema.omit({ passwordHash: true, role: true }) });

export type DriverListViewPrimitives = z.infer<typeof driverListViewSchema>;
