import { userListViewSchema } from "@contexts/iam/domain/schemas/user/User";
import type { z } from "zod";
import { driverSchema } from "./Driver";

export const driverListViewSchema = driverSchema
  .omit({ userId: true })
  .extend({ user: userListViewSchema });

export type DriverListViewPrimitives = z.infer<typeof driverListViewSchema>;
