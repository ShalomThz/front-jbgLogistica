/**
 * Interim: maps English prose from the backend to known error codes.
 * Remove entries as the backend migrates to structured { code, message } responses.
 */
export const messageFallbacks: Array<{ pattern: RegExp; code: string }> = [
  { pattern: /email.*already.*taken|already.*taken.*email/i, code: "EMAIL_ALREADY_TAKEN" },
  { pattern: /order.*same partner order number.*already exists/i, code: "ORDER_DUPLICATE_PARTNER_NUMBER" },
  { pattern: /order.*same references.*already exists/i, code: "ORDER_DUPLICATE_REFERENCES" },
  { pattern: /already exists/i, code: "BOX_NAME_ALREADY_EXISTS" },
  { pattern: /box not found/i, code: "BOX_NOT_FOUND" },
  { pattern: /package not found/i, code: "PACKAGE_NOT_FOUND" },
  { pattern: /unauthorized|forbidden/i, code: "UNAUTHORIZED" },
];
