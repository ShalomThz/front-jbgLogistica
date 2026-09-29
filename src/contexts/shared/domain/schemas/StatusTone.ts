/**
 * El tono de un estado, y cómo se pinta. **La única paleta de estado del
 * sistema.**
 *
 * Vive en `shared` —como `PaymentStatus`— porque lo necesitan las dos puntas:
 * la fila y la barra de la tabla (order-flow) y la línea de tiempo del rastreo
 * (shipping). Cuando cada uno tenía su propia paleta, la misma orden en ruta se
 * veía azul en la tabla y ámbar en el detalle.
 *
 * El tono dice **de quién es la pelota**, no la posición:
 *
 * - `draft` gris — todavía se está capturando, no salió del mostrador
 * - `waiting` ámbar — espera que alguien haga algo: JBG, la paquetería, el chofer
 * - `transit` azul — ya se mueve solo y nadie tiene que intervenir
 * - `done` verde — llegó
 * - `stopped` rojo — se cortó, o tiene una incidencia abierta
 *
 * Los colores salen de los tokens `--status-*`, cuya chroma está deliberadamente
 * por debajo del azul de la marca para que ésta conserve la jerarquía. Y el azul
 * de tránsito está a hue 252, separado de `--primary` (264), que es el color de
 * lo interactivo.
 */
export type StatusTone = "draft" | "waiting" | "transit" | "done" | "stopped";

/** Relleno: barra de avance y punto de estado. */
export const TONE_FILL: Record<StatusTone, string> = {
  draft: "bg-muted-foreground/40",
  waiting: "bg-status-attention",
  transit: "bg-status-transit",
  done: "bg-status-done",
  stopped: "bg-status-problem",
};

/** Texto con contraste AA sobre el fondo de la página. */
export const TONE_TEXT: Record<StatusTone, string> = {
  draft: "text-muted-foreground",
  waiting: "text-status-attention-fg",
  transit: "text-status-transit-fg",
  done: "text-status-done-fg",
  stopped: "text-status-problem-fg",
};

/** Halo del tono, alrededor del paso actual de la línea de tiempo. */
export const TONE_RING: Record<StatusTone, string> = {
  draft: "ring-muted-foreground/30",
  waiting: "ring-status-attention/40",
  transit: "ring-status-transit/40",
  done: "ring-status-done/40",
  stopped: "ring-status-problem/40",
};

/** Relleno sólido con texto encima: el paso de la línea de tiempo donde está
 * la orden. */
export const TONE_SOLID: Record<StatusTone, string> = {
  draft: "border-muted-foreground/40 bg-muted-foreground/40 text-background",
  waiting: "border-status-attention bg-status-attention text-background",
  transit: "border-status-transit bg-status-transit text-background",
  done: "border-status-done bg-status-done text-background",
  stopped: "border-status-problem bg-status-problem text-background",
};

/**
 * Un evento del historial. El más reciente lleva fondo tenue y el borde
 * izquierdo del tono —es "donde estamos", como el paso actual de la línea—; los
 * anteriores solo el borde, atenuado, igual que los pasos cumplidos.
 */
export const TONE_EVENT: Record<StatusTone, { latest: string; earlier: string }> =
  {
    draft: {
      latest: "border-l-muted-foreground/50 bg-muted",
      earlier: "border-l-muted-foreground/25",
    },
    waiting: {
      latest: "border-l-status-attention bg-status-attention-soft",
      earlier: "border-l-status-attention/40",
    },
    transit: {
      latest: "border-l-status-transit bg-status-transit-soft",
      earlier: "border-l-status-transit/40",
    },
    done: {
      latest: "border-l-status-done bg-status-done-soft",
      earlier: "border-l-status-done/40",
    },
    stopped: {
      latest: "border-l-status-problem bg-status-problem-soft",
      earlier: "border-l-status-problem/40",
    },
  };

/** Borde y texto del tono sobre fondo tenue. */
export const TONE_OUTLINE: Record<StatusTone, string> = {
  draft: "border-muted-foreground/40 bg-muted text-muted-foreground",
  waiting:
    "border-status-attention bg-status-attention-soft text-status-attention-fg",
  transit:
    "border-status-transit bg-status-transit-soft text-status-transit-fg",
  done: "border-status-done bg-status-done-soft text-status-done-fg",
  stopped:
    "border-status-problem bg-status-problem-soft text-status-problem-fg",
};

/**
 * Fondo de una fila de tabla o de una card.
 *
 * Usa los tokens `-soft`, que están pensados justo para esto: en claro andan por
 * L 0.96 con chroma 0.03, así que tiñen sin tapar el texto ni competir con los
 * badges de la fila.
 *
 * `draft` va sin tinte a propósito: un lavado gris sobre blanco no se ve, y un
 * borrador tampoco necesita destacarse.
 */
export const TONE_ROW: Record<StatusTone, string> = {
  draft: "",
  waiting: "bg-status-attention-soft hover:bg-status-attention/15",
  transit: "bg-status-transit-soft hover:bg-status-transit/15",
  done: "bg-status-done-soft hover:bg-status-done/15",
  stopped: "bg-status-problem-soft hover:bg-status-problem/15",
};

/** Aviso al pie: fondo tenue del tono. */
export const TONE_CALLOUT: Record<StatusTone, string> = {
  draft: "bg-muted text-muted-foreground",
  waiting: "bg-status-attention-soft text-status-attention-fg",
  transit: "bg-status-transit-soft text-status-transit-fg",
  done: "bg-status-done-soft text-status-done-fg",
  stopped: "bg-status-problem-soft text-status-problem-fg",
};
