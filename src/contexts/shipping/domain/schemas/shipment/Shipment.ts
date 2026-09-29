import { costBreakdownSchema } from "@contexts/sales/domain/schemas/value-objects/CostBreakdown";
import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";
import { geolocationSchema } from "@contexts/shared/domain/schemas/address/Geolocation";
import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import { carrierSchema } from "../value-objects/Carrier";
import { parcelSchema } from "../value-objects/Parcel";
import { rateSchema } from "../value-objects/Rate";
import { shippingLabelSchema } from "../value-objects/ShippingLabel";
import { shipmentIncidentTypes, shipmentStages } from "./ShipmentStages";
import { shipmentStatuses } from "./ShipmentStatuses";
import { shippingModes } from "./ShippingModes";
import z from "zod";
import { warehouseAddressSchema } from "../value-objects/WarehouseAddress";

export const shipmentIncidentSchema = z.object({
  type: z.enum(shipmentIncidentTypes),
  reason: z.string(),
  openedAt: z.string(),
  openedBy: z.string(),
});

export type ShipmentIncidentPrimitives = z.infer<typeof shipmentIncidentSchema>;

export const shipmentSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  provider: carrierSchema.nullable(),
  label: shippingLabelSchema.nullable(),
  rate: rateSchema.nullable(),
  shippingMode: z.enum(shippingModes).default("GROUND"),
  status: z.enum(shipmentStatuses),
  // La etapa del rastreo. El back la deduce del estatus para los envíos
  // anteriores a las etapas, así que solo es null antes de arrancar (borrador).
  stage: z.enum(shipmentStages).nullable().default(null),
  // La incidencia abierta, si hay una.
  incident: shipmentIncidentSchema.nullable().default(null),
  // Carrier shipment id, stamped while the label is generated asynchronously.
  // While PROVIDER_SELECTED: set = creating (await webhook), null = creation failed.
  providerShipmentId: z.string().nullable().default(null),
  finalPrice: moneySchema.nullable(),
  costBreakdown: costBreakdownSchema.nullable(),
  additionalData: z.record(z.string(), z.string()),
  warehouseAddress: warehouseAddressSchema.nullable(),
  parcel: parcelSchema,
  // Verified routing coordinates filled from the routes UI when the order
  // address was captured without the map picker (recolección / entrega)
  pickupGeolocation: geolocationSchema.nullable().default(null),
  deliveryGeolocation: geolocationSchema.nullable().default(null),
  ...aggregateRootSchema.shape,
});

export type ShipmentStatus = z.infer<typeof shipmentSchema.shape.status>;
export type ShipmentPrimitives = z.infer<typeof shipmentSchema>;
