/**
 * La salida planeada se captura como día (`YYYY-MM-DD`, `""` sin fecha) y el
 * back la guarda como ISO. Se toma la medianoche *local*: `new Date("2026-11-14")`
 * la leería en UTC y en México se mostraría como el 13.
 */
export const departureFromInput = (value: string): string | null =>
  value ? new Date(`${value}T00:00`).toISOString() : null;

/** Al revés: el ISO del back como el día local que lo capturó. */
export const departureToInput = (iso: string | null): string => {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const formatDeparture = (iso: string): string =>
  new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
