export type ConsolidationErrorTarget = {
  field: string;
  step?: string;
};

export const consolidationFieldMap: Record<string, ConsolidationErrorTarget> = {
  CONSOLIDATION_FOLIO_TAKEN: {
    field: "folio",
    step: "datos",
  },
};
