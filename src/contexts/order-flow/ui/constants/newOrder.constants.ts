import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";

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
  },
  save: false,
} as const satisfies NewOrderFormValues["sender"];

export const newOrderDefaultValues: NewOrderFormValues = {
  orderType: "HQ",
  orderData: {
    orderNumber: "",
    partnerOrderNumber: "",
  },
  sender: { ...emptyContactWithAddress },
  recipient: { ...emptyContactWithAddress },
  package: {
    productSearch: "",
    boxId: "",
    ownership: "CUSTOMER",
    packageType: "",
    length: "",
    width: "",
    height: "",
    dimensionUnit: "cm",
    weight: "",
    quantity: "1",
    productType: "",
    savePackage: false,
    skydropxCategoryId: "",
    skydropxSubcategoryId: "",
    consignmentNoteClassCode: "",
    consignmentNotePackagingCode: "",
  },
  shippingService: {
    selectedRate: null,
    sosProtection: true,
    sosValue: "1600.00",
    declaredValue: "",
  },
};
