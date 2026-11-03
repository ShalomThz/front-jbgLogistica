import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import truckSideImg from "@/assets/truck-side.png";

interface TruckVisualProps {
  /** Pies lineales ya confirmados en el consolidado. */
  usedLinearFeet: number;
  /** Pies lineales de lo que se está seleccionando ahora mismo (picker),
   * antes de confirmar — se dibuja como el mismo relleno, la gráfica no
   * distingue "ya guardado" de "por guardar" porque para el usuario es un
   * solo número mientras carga el tráiler. */
  pendingLinearFeet?: number;
  capacityLinearFeet: number;
  className?: string;
}

// ease-out fuerte — la básica de CSS se siente débil para una entrada/cambio de estado deliberado
const EASE = [0.23, 1, 0.32, 1] as const;
// Coordenadas del hueco de la caja dentro de `truck-side.png` (978x477) — el
// PNG trae la cabina, llantas y el contorno de la caja ya dibujados, con el
// interior de la caja transparente a propósito. El relleno animado va DEBAJO
// de la imagen, recortado a este rect, y se ve a través de ese hueco; el
// contorno opaco de la imagen lo tapa en cuanto se pasa de sus bordes.
const VIEWBOX_W = 978;
const VIEWBOX_H = 477;
const TRAILER_X = 366;
const TRAILER_W = 590;
const TRAILER_Y = 14;
const TRAILER_H = 298;

/**
 * Tráiler visto de perfil — ilustración generada a juego con la paleta de
 * `assets/box-isometric.svg` (línea azul marino + rellenos celestes), con la
 * caja de carga vacía/transparente a propósito. El relleno de la caja
 * representa la capacidad usada y se anima con `motion` (ya es dependencia
 * del proyecto) al cargar o al cambiar, pintado debajo de la imagen.
 */
export const TruckVisual = ({
  usedLinearFeet,
  pendingLinearFeet = 0,
  capacityLinearFeet,
  className,
}: TruckVisualProps) => {
  const totalFeet = usedLinearFeet + pendingLinearFeet;
  const pct =
    capacityLinearFeet > 0 ? Math.round((totalFeet / capacityLinearFeet) * 100) : 0;
  const overCapacity = totalFeet > capacityLinearFeet;

  const reduceMotion = useReducedMotion();
  const progress = useMotionValue(0); // 0..1 — ancho del relleno, capado a 100%
  const displayPct = useMotionValue(0); // puede pasar de 100 para el número

  const mounted = useRef(false);
  useEffect(() => {
    const targetFill = Math.min(pct, 100) / 100;
    const instant = reduceMotion || !mounted.current;
    const controlsFill = animate(progress, targetFill, {
      duration: instant ? 0 : 0.45,
      ease: EASE,
    });
    const controlsNum = animate(displayPct, pct, {
      duration: instant ? 0 : 0.45,
      ease: EASE,
    });
    mounted.current = true;
    return () => {
      controlsFill.stop();
      controlsNum.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct, reduceMotion]);

  const fillWidth = useTransform(progress, (v) => v * TRAILER_W);
  const roundedPct = useTransform(displayPct, (v) => Math.round(v));

  const tone = overCapacity ? "text-destructive" : "text-primary";

  return (
    <div
      className={cn(
        "flex items-center gap-4 overflow-hidden rounded-xl border bg-card p-5 sm:p-6",
        className,
      )}
    >
      <motion.svg
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        className="h-24 w-auto shrink-0 sm:h-28 lg:h-32"
        initial={reduceMotion ? false : { opacity: 0, transform: "translateX(-16px)" }}
        animate={{ opacity: 1, transform: "translateX(0px)" }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <defs>
          <clipPath id="trailer-clip">
            <rect x={TRAILER_X} y={TRAILER_Y} width={TRAILER_W} height={TRAILER_H} />
          </clipPath>
        </defs>

        {/* relleno animado, pintado debajo de la ilustración — se asoma por
            el hueco transparente de la caja y queda tapado por el resto */}
        <g clipPath="url(#trailer-clip)">
          <motion.rect
            x={TRAILER_X}
            y={TRAILER_Y}
            height={TRAILER_H}
            style={{ width: fillWidth }}
            className={tone}
            fill="currentColor"
            fillOpacity="0.85"
          />
          {/* franja diagonal — mismo guiño visual que la banda de la
              referencia, sin depender de un gradiente con hex fijo */}
          <motion.rect
            x={TRAILER_X}
            y={TRAILER_Y}
            height={TRAILER_H}
            style={{ width: fillWidth }}
            className={tone}
            fill="currentColor"
            fillOpacity="0.15"
            transform={`skewX(-18) translate(14, 0)`}
          />
        </g>

        <image
          href={truckSideImg}
          x="0"
          y="0"
          width={VIEWBOX_W}
          height={VIEWBOX_H}
          preserveAspectRatio="xMidYMid meet"
        />
      </motion.svg>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <motion.span className={cn("text-3xl font-bold tabular-nums", tone)}>
            {roundedPct}
          </motion.span>
          <span className={cn("text-xl font-bold", tone)}>%</span>
          <span className="text-sm text-muted-foreground">cargado</span>
        </div>
        <p
          className={cn(
            "text-sm",
            overCapacity ? "font-medium text-destructive" : "text-muted-foreground",
          )}
        >
          {totalFeet.toLocaleString("es-MX", { maximumFractionDigits: 1 })} /{" "}
          {capacityLinearFeet.toLocaleString("es-MX", { maximumFractionDigits: 1 })} ft
          lineales
          {overCapacity && " — por encima de la capacidad"}
        </p>
      </div>
    </div>
  );
};
