import { z } from 'zod';
import { IdentifierSchema } from '@/shared/domain';
import { AddressSchema } from '../value-objects/Address';
import { CustomerProfileSchema } from '../value-objects/CustomerProfile';
import { OrderReferencesSchema } from '../value-objects/OrderReferences';
import { OrderFinancialsSchema } from './OrderFinancials';

export const ShipmentOrderStatusSchema = z.enum(['DRAFT', 'PENDING_HQ_PROCESS', 'COMPLETED']);

export type ShipmentOrderStatus = z.infer<typeof ShipmentOrderStatusSchema>;

export const ShipmentOrderSchema = z.object({
  id: IdentifierSchema,
  origin: IdentifierSchema,
  customer: CustomerProfileSchema,
  destination: AddressSchema,
  financials: OrderFinancialsSchema,
  references: OrderReferencesSchema,
  status: ShipmentOrderStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ShipmentOrder = z.infer<typeof ShipmentOrderSchema>;

// Schema para crear una orden (sin campos autogenerados)
export const CreateShipmentOrderSchema = z.object({
  origin: IdentifierSchema,
  customer: CustomerProfileSchema,
  destination: AddressSchema,
  partnerInvoiceNumber: z.string().optional(),
});

export type CreateShipmentOrderInput = z.infer<typeof CreateShipmentOrderSchema>;
