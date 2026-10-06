import { ImagePlus, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button, Label } from "@contexts/shared/shadcn";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { useMedia } from "@contexts/shared/infrastructure/hooks/media/useMedia";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
// Un logo se imprime a lo mucho a 100pt de ancho en la etiqueta — de sobra
// para no perder nitidez sin cargar un archivo pesado.
const MAX_DIMENSION = 800;

interface Props {
  value: string;
  onChange: (logo: string) => void;
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
 * transparencia (fondo blanco de la etiqueta se ve igual); el JPEG se rellena
 * de blanco porque no soporta canal alfa.
 */
async function compressLogo(file: File): Promise<string> {
  const isPng = file.type === "image/png";
  const image = await loadImage(await readFile(file));
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo procesar el logo");
  }

  if (!isPng) {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL(isPng ? "image/png" : "image/jpeg", 0.9);
}

export const StoreLabelLogoInput = ({ value, onChange, error, disabled }: Props) => {
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
      setFileError("El logo no debe superar 10 MB");
      return;
    }

    setIsProcessing(true);
    try {
      onChange(await compressLogo(file));
    } catch (caught) {
      setFileError(
        caught instanceof Error ? caught.message : "No se pudo procesar el logo",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Logo para la etiqueta de agente</Label>
      <div className="flex items-center gap-3 rounded-md border p-3">
        <div
          className={cn(
            "flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted",
          )}
        >
          {src ? (
            <img src={src} alt="Logo de la tienda" className="size-full object-contain" />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <p className="text-xs text-muted-foreground">
            Se imprime en la esquina de la etiqueta "Agente" de esta tienda. La
            etiqueta JBG no lo usa.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={disabled || isProcessing}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-4" />
            {isProcessing ? "Procesando..." : src ? "Cambiar logo" : "Subir logo"}
          </Button>
        </div>
        <input
          ref={inputRef}
          id="store-agent-logo"
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
