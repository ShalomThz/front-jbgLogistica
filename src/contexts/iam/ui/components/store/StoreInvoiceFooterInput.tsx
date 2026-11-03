import { ImagePlus, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button, Label } from "@contexts/shared/shadcn";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { useMedia } from "@contexts/shared/infrastructure/hooks/media/useMedia";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
// El pie es un banner ancho que ocupa todo el ancho de la factura — más
// margen que el logo para que no se vea pixelado a ese tamaño.
const MAX_DIMENSION = 1600;

interface Props {
  value: string;
  onChange: (footer: string) => void;
  error?: string;
  disabled?: boolean;
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("El archivo no contiene una imagen válida"));
    image.src = src;
  });
}

/**
 * Comprime achicando hasta `MAX_DIMENSION` en el lado largo. El PNG conserva
 * transparencia; el JPEG se rellena de blanco porque no soporta canal alfa.
 */
async function compressFooter(file: File): Promise<string> {
  const isPng = file.type === "image/png";
  const image = await loadImage(await readFile(file));
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo procesar el pie");
  }

  if (!isPng) {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL(isPng ? "image/png" : "image/jpeg", 0.9);
}

/**
 * Pie de página de la factura del socio — totalmente opcional. Si no se
 * configura, la factura sigue usando el banner promocional de JBG; si se
 * sube una imagen, la reemplaza entera (no se combinan). Se ajusta entero
 * dentro del mismo espacio sin importar su proporción — el backend lo centra
 * sin recortar ni estirar.
 */
export const StoreInvoiceFooterInput = ({ value, onChange, error, disabled }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isDataUrl = value.startsWith("data:");
  const { data } = useMedia(value && !isDataUrl ? value : null);
  const src = isDataUrl ? value : data?.url;

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setFileError(null);

    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      setFileError("Selecciona una imagen JPEG o PNG");
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setFileError("El pie no debe superar 10 MB");
      return;
    }

    setIsProcessing(true);
    try {
      onChange(await compressFooter(file));
    } catch (caught) {
      setFileError(
        caught instanceof Error ? caught.message : "No se pudo procesar el pie",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Pie de página (opcional)</Label>
      <div className="flex items-center gap-3 rounded-md border p-3">
        <div
          className={cn(
            "flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted",
          )}
        >
          {src ? (
            <img src={src} alt="Pie de la factura" className="size-full object-contain" />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <p className="text-xs text-muted-foreground">
            Reemplaza por completo el banner promocional de JBG al final de la
            factura. Déjalo vacío para conservar el de JBG.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={disabled || isProcessing}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="size-4" />
              {isProcessing ? "Procesando..." : src ? "Cambiar pie" : "Subir pie"}
            </Button>
            {src && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                disabled={disabled || isProcessing}
                onClick={() => onChange("")}
              >
                <X className="size-4" />
                Quitar
              </Button>
            )}
          </div>
        </div>
        <input
          ref={inputRef}
          id="store-invoice-footer"
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      {(fileError || error) && (
        <p className="text-xs text-destructive">{fileError ?? error}</p>
      )}
    </div>
  );
};
