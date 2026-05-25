export function formatCustomerNumber(customerNumber: number): string {
  return `C-${String(customerNumber).padStart(6, "0")}`;
}
