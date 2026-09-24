import { IdCard } from "lucide-react";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { useMedia } from "@contexts/shared/infrastructure/hooks/media/useMedia";

interface Props {
  photo: string | null | undefined;
  name: string;
  className?: string;
  /** Distingue las dos caras de la misma identificación. Por default es la
   * única que existió durante mucho tiempo, así que los llamadores que no
   * cargan ambas caras no tienen que decir nada. */
  side?: "front" | "back";
}

const SIDE_LABEL: Record<NonNullable<Props["side"]>, string> = {
  front: "anverso",
  back: "reverso",
};

/**
 * La identificación del cliente, no un retrato.
 *
 * Va entera y sin recortar (`object-contain`): una credencial fotografiada con
 * el teléfono trae márgenes y viene en cualquier proporción, así que estirarla
 * para llenar la caja —lo que hacía el avatar redondo con `object-cover`— se
 * come justo los datos por los que se guarda la foto.
 */
export const CustomerIdPhoto = ({ photo, name, className, side = "front" }: Props) => {
  const isDataUrl = photo?.startsWith("data:") ?? false;
  const { data } = useMedia(photo && !isDataUrl ? photo : null);
  const src = isDataUrl ? photo : data?.url;
  const sideLabel = SIDE_LABEL[side];

  return (
    <div
      className={cn(
        "flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-md border bg-muted",
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={`Identificación (${sideLabel}) de ${name || "cliente"}`}
          className="size-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <IdCard className="size-8" />
          <span className="text-xs">
            {side === "back" ? "Sin reverso" : "Sin identificación"}
          </span>
        </div>
      )}
    </div>
  );
};
