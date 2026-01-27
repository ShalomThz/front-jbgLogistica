import { z } from 'zod';

// Base Money schema
export const MoneySchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.string().default('MXN'),
});

export type Money = z.infer<typeof MoneySchema>;

// Identifiers
export const IdentifierSchema = z.string().uuid();

export type StoreId = z.infer<typeof IdentifierSchema>;
export type CustomerId = z.infer<typeof IdentifierSchema>;
export type OrderId = z.infer<typeof IdentifierSchema>;
export type WaybillId = z.infer<typeof IdentifierSchema>;
export type DriverId = z.infer<typeof IdentifierSchema>;
export type ZoneId = z.infer<typeof IdentifierSchema>;
export type BoxSizeId = z.infer<typeof IdentifierSchema>;
export type BusinessClientId = z.infer<typeof IdentifierSchema>;

export const generateId = (): string => crypto.randomUUID();
