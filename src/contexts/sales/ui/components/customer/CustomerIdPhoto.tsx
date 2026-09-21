import { IdCard } from "lucide-react";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { useMedia } from "@contexts/shared/infrastructure/hooks/media/useMedia";

interface Props {
  photo: string | null | undefined;
  name: string;
  className?: string;
}

/**
 * La identificación del cliente, no un retrato.
 *
 * Va entera y sin recortar (`object-contain`): una credencial fotografiada con
 * el teléfono trae márgenes y viene en cualquier proporción, así que estirarla
 * para llenar la caja —lo que hacía el avatar redondo con `object-cover`— se
 * come justo los datos por los que se guarda la foto.
 */
export const CustomerIdPhoto = ({ photo, name, className }: Props) => {
  const isDataUrl = photo?.startsWith("data:") ?? false;
  const { data } = useMedia(photo && !isDataUrl ? photo : null);
  const src = isDataUrl ? photo : data?.url;

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
          alt={`Identificación de ${name || "cliente"}`}
          className="size-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <IdCard className="size-8" />
          <span className="text-xs">Sin identificación</span>
        </div>
      )}
    </div>
  );
};
