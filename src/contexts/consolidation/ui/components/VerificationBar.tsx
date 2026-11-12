import { cn } from "@contexts/shared/shadcn/lib/utils";
import { TONE_FILL } from "@contexts/shared/domain/schemas/StatusTone";
import { VERIFICATION_TONE } from "@contexts/consolidation/domain/schemas/consolidation/Consolidation";
import type { VerificationCount } from "@contexts/consolidation/domain/countVerification";

/** Barra de verificación con los mismos colores que la columna "Verificación":
 * lo revisado primero, luego las alertas y al final lo pendiente. */
export function VerificationBar({
  count,
  className,
}: {
  count: VerificationCount;
  className?: string;
}) {
  const segments = [
    [count.reviewed, VERIFICATION_TONE.REVIEWED],
    [count.alert, VERIFICATION_TONE.ALERT],
    [count.pending, VERIFICATION_TONE.PENDING],
  ] as const;
  return (
    <div className={cn("flex w-full overflow-hidden rounded-full bg-muted", className)}>
      {count.total > 0 &&
        segments.map(([n, tone]) => (
          <div key={tone} className={TONE_FILL[tone]} style={{ width: `${(n / count.total) * 100}%` }} />
        ))}
    </div>
  );
}
