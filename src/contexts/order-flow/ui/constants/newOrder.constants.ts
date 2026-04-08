import type { HQOrderFormValues } from "@contexts/order-flow/domain/schemas/HQOrderForm";
import type { PartnerOrderFormValues } from "@contexts/order-flow/domain/schemas/PartnerOrderForm";

const emptyContactWithAddress = {
  id: null,
  name: "",
  company: "",
  email: "",
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
  pickupAtAddress: false,
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
  },
} as const;

export const hqOrderDefaultValues: HQOrderFormValues = {
  ...baseDefaults,
  orderType: "HQ",
  package: {
    productSearch: "",
    boxId: null,
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
    skydropxCategoryId: "",
    skydropxSubcategoryId: "",
    consignmentNoteClassCode: "",
    consignmentNotePackagingCode: "",
  },
  shippingService: {
    ...baseDefaults.shippingService,
    selectedRate: null,
  },
};

export const partnerOrderDefaultValues: PartnerOrderFormValues = {
  ...baseDefaults,
  orderType: "PARTNER",
  package: {
    boxId: null,
    ownership: "CUSTOMER",
    packageType: "",
    length: "",
    width: "",
    height: "",
    dimensionUnit: "in",
  },
};
