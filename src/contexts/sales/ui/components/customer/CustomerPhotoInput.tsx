import { Camera, Image as ImageIcon, SwitchCamera, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
} from "@contexts/shared/shadcn";
import { CustomerIdPhoto } from "./CustomerIdPhoto";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
/** Más alto que para un retrato: acá hay que poder leer la letra chica de una
 * credencial, no reconocer una cara. */
const MAX_DIMENSION = 1600;

interface Props {
  value: string;
  name: string;
  onChange: (photo: string) => void;
  error?: string;
  disabled?: boolean;
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la fotografía"));
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
 * Dibuja la fuente en un canvas achicándola hasta `MAX_DIMENSION` en su lado
 * largo. La usan los dos caminos —archivo y cámara— para que una identificación
 * pese y se lea igual sin importar de dónde salió.
 */
function toCompressedDataUrl(
  source: CanvasImageSource,
  width: number,
  height: number,
): string {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo procesar la fotografía");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.85);
}

async function compressPhoto(file: File): Promise<string> {
  const image = await loadImage(await readFile(file));
  return toCompressedDataUrl(image, image.width, image.height);
}

export const CustomerPhotoInput = ({
  value,
  name,
  onChange,
  error,
  disabled,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [fileError, setFileError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  // Arranca en la trasera: se fotografía un documento, no a quien lo sostiene.
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(
    async (facing: "user" | "environment") => {
      stopStream();
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setCameraError(
          "No se pudo acceder a la cámara. Verifica los permisos del navegador.",
        );
      }
    },
    [stopStream],
  );

  useEffect(() => {
    if (cameraOpen) {
      startCamera(facingMode);
    } else {
      stopStream();
    }
    return stopStream;
  }, [cameraOpen, facingMode, startCamera, stopStream]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      onChange(
        toCompressedDataUrl(video, video.videoWidth, video.videoHeight),
      );
      // Una sola identificación: capturar es terminar.
      setCameraOpen(false);
    } catch {
      setCameraError("No se pudo capturar la fotografía");
    }
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setFileError(null);

    if (!file.type.startsWith("image/")) {
      setFileError("Selecciona un archivo de imagen");
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setFileError("La fotografía no debe superar 10 MB");
      return;
    }

    setIsProcessing(true);
    try {
      onChange(await compressPhoto(file));
      setCameraOpen(false);
    } catch (caught) {
      setFileError(
        caught instanceof Error
          ? caught.message
          : "No se pudo procesar la fotografía",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Identificación del cliente</Label>
      {/* Apilado y no en fila: la credencial es apaisada y necesita el ancho,
          y este mismo bloque entra en la columna angosta del paso de contactos. */}
      <div className="space-y-3 rounded-md border p-3">
        <CustomerIdPhoto
          photo={value || null}
          name={name}
          className="max-w-xs"
        />
        <p className="text-sm text-muted-foreground">
          Foto de la credencial o identificación oficial. Revisa que los datos se
          lean.
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            disabled={disabled || isProcessing}
            onClick={() => setCameraOpen(true)}
          >
            <Camera className="size-4" />
            Cámara
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            disabled={disabled || isProcessing}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-4" />
            {isProcessing ? "Procesando..." : "Archivo"}
          </Button>
        </div>
        <input
          ref={inputRef}
          id="customer-photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      {(fileError || error) && (
        <p className="text-xs text-destructive">{fileError ?? error}</p>
      )}

      <Dialog open={cameraOpen} onOpenChange={(v) => !v && setCameraOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fotografiar identificación</DialogTitle>
          </DialogHeader>

          {cameraError ? (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {cameraError}
            </p>
          ) : (
            <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="size-full object-cover"
              />

              {/* Marco de encuadre, con la proporción de una credencial para
                  que se apoye el documento adentro. */}
              <div className="pointer-events-none absolute inset-x-8 top-1/2 aspect-[1.586] -translate-y-1/2">
                <span className="absolute left-0 top-0 size-7 rounded-tl-lg border-l-[3px] border-t-[3px] border-white/80" />
                <span className="absolute right-0 top-0 size-7 rounded-tr-lg border-r-[3px] border-t-[3px] border-white/80" />
                <span className="absolute bottom-0 left-0 size-7 rounded-bl-lg border-b-[3px] border-l-[3px] border-white/80" />
                <span className="absolute bottom-0 right-0 size-7 rounded-br-lg border-b-[3px] border-r-[3px] border-white/80" />
              </div>

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-6 py-3">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  aria-label="Elegir de la galería"
                  className="text-white/90 transition-colors hover:text-white"
                >
                  <ImageIcon className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={handleCapture}
                  aria-label="Capturar identificación"
                  className="size-14 rounded-full border-4 border-white/90 bg-white/30 backdrop-blur transition-colors hover:bg-white/50 active:bg-white/70"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFacingMode((f) => (f === "user" ? "environment" : "user"))
                  }
                  aria-label="Cambiar cámara"
                  className="text-white/90 transition-colors hover:text-white"
                >
                  <SwitchCamera className="size-6" />
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
