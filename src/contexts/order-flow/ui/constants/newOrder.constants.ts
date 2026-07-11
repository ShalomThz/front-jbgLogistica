import type { HQOrderFormValues } from "@contexts/order-flow/domain/schemas/HQOrderForm";
import type { PartnerOrderFormValues } from "@contexts/order-flow/domain/schemas/PartnerOrderForm";

const emptyContactWithAddress = {
  id: null,
  name: "",
  company: "",
  email: null,
  phone: "",
  address: {
    country: "MX",
    address1: "",
    address2: "",
    zip: "",
    province: "",
    city: "",
    reference: "",
    geolocation: { latitude: 0, longitude: 0, placeId: null },
  },
  save: false,
} as const;

const baseDefaults = {
  orderData: {
    orderNumber: "",
    partnerOrderNumber: "",
  },
  sender: { ...emptyContactWithAddress },
  recipient: { ...emptyContactWithAddress },
  emptyBoxDelivery: false,
  homePickup: false,
  advanceAmount: "",
  customerSignature: null,
  shippingService: {
    currency: "USD",
    costBreakdownCurrency: "USD",
    costBreakdown: {
      insurance: "",
      tools: "",
      additionalCost: "",
      wrap: "",
      tape: "",
    },
    discount: {
      amount: "",
      currency: "MXN",
      concept: "",
    },
  },
} as const;

export const hqOrderDefaultValues: HQOrderFormValues = {
  ...baseDefaults,
  orderType: "HQ",
  package: {
    productSearch: "",
    boxId: "",
    ownership: "CUSTOMER",
    packageType: "",
    length: "",
    width: "",
    height: "",
    dimensionUnit: "in",
    weight: "",
    weightUnit: "lb",
    productType: "",
    savePackage: false,
    consignmentNoteClassCode: "",
    consignmentNotePackagingCode: "",
    photos: [],
  },
  shippingService: {
    ...baseDefaults.shippingService,
    selectedRate: null,
    tariff: null,
  },
};

export const partnerOrderDefaultValues: PartnerOrderFormValues = {
  ...baseDefaults,
  orderType: "PARTNER",
  package: {
    boxId: "",
    ownership: "CUSTOMER",
    packageType: "",
    length: "",
    width: "",
    height: "",
    dimensionUnit: "in",
  },
};
