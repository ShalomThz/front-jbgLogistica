import { z } from 'zod';
import { IdentifierSchema } from '@/shared/domain';
import { PackageDetailsSchema } from '../value-objects/PackageDetails';

export const WaybillProviderSchema = z.enum(['INTERNAL_DRIVER', 'SKYDROPX']);

export type WaybillProvider = z.infer<typeof WaybillProviderSchema>;

export const WaybillStatusSchema = z.enum([
  'PENDING',
  'LABEL_GENERATED',
  'IN_TRANSIT',
  'DELIVERED',
  'FAILED',
]);

export type WaybillStatus = z.infer<typeof WaybillStatusSchema>;

export const WaybillSchema = z.object({
  id: IdentifierSchema,
  orderId: IdentifierSchema,
  provider: WaybillProviderSchema,
  trackingNumber: z.string().nullable(),
  labelUrl: z.string().url().nullable(),
  packageDetails: PackageDetailsSchema,
  driverId: IdentifierSchema.nullable(),
  status: WaybillStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Waybill = z.infer<typeof WaybillSchema>;

export const CreateWaybillSchema = z.object({
  orderId: IdentifierSchema,
  provider: WaybillProviderSchema,
  packageDetails: PackageDetailsSchema,
  driverId: IdentifierSchema.optional(),
});

export type CreateWaybillInput = z.infer<typeof CreateWaybillSchema>;
