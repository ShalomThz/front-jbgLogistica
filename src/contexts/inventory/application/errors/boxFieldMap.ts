export type BoxErrorTarget = {
  field: string;
  step?: string;
};

export const boxFieldMap: Record<string, BoxErrorTarget> = {
  BOX_NAME_ALREADY_EXISTS: {
    field: "name",
  },
  BOX_DIMENSIONS_ALREADY_EXIST: {
    field: "dimensions.length",
  },
};
