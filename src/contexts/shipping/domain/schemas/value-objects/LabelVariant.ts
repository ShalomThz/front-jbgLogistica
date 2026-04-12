export const LABEL_VARIANTS = ["cargo", "agente"] as const;
export type LabelVariant = (typeof LABEL_VARIANTS)[number];
export const DEFAULT_LABEL_VARIANT: LabelVariant = "cargo";

export const LABEL_VARIANT_LABELS: Record<LabelVariant, string> = {
  cargo: "JBG Cargo",
  agente: "JBG Agente",
};
