import { Camera, SwitchCamera, Upload, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
} from "@contexts/shared/shadcn";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
/** Suficiente para leer una etiqueta o un remito; más pesa sin aportar. */
const MAX_DIMENSION = 1600;

interface Props {
  id: string;
  label: string;
  value: File[];
  onChange: (photos: File[]) => void;
  /** Cuántas fotos se aceptan. Una sola para la firma, varias para la
   * evidencia. */
  max?: number;
  /** Título de la ventana de la cámara. */
  cameraTitle?: string;
  disabled?: boolean;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("El archivo no contiene una imagen válida"));
    };
    image.src = url;
  });
}

/**
 * Dibuja la fuente achicada hasta `MAX_DIMENSION` y la devuelve como JPEG. La
 * usan los dos caminos —cámara y archivo— para que la evidencia pese lo mismo
 * venga de donde venga.
 */
function toCompressedFile(
  source: CanvasImageSource,
  width: number,
  height: number,
): Promise<File> {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("No se pudo procesar la foto"));

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(new File([blob], "foto.jpg", { type: "image/jpeg" }))
          : reject(new Error("No se pudo procesar la foto")),
      "image/jpeg",
      0.85,
    );
  });
}

/**
 * Fotos de evidencia: se toman con la cámara —la del celular, la tablet o la
 * webcam— o se suben de archivos. Mismo patrón que la foto de la credencial
 * (`CustomerPhotoInput`), pero entrega `File`s en vez de base64, que es lo que
 * viaja en el multipart de los eventos del rastreo.
 *
 * Con la cámara abierta se pueden sacar varias seguidas; se cierra sola al
 * llegar al máximo, o con "Listo".
 */
export const CameraPhotoInput = ({
  id,
  label,
  value,
  onChange,
  max = 1,
  cameraTitle = "Tomar foto",
  disabled,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // La lista más reciente, para que capturar varias seguidas no pise la anterior
  // con una versión vieja de `value`.
  const valueRef = useRef(value);
  valueRef.current = value;

  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  // Arranca en la trasera: se fotografía una caja o un papel, no a quien sostiene.
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );
  const [cameraError, setCameraError] = useState<string | null>(null);

  const remaining = max - value.length;
  const isFull = remaining <= 0;

  const previewUrls = useMemo(
    () => value.map((file) => URL.createObjectURL(file)),
    [value],
  );
  useEffect(
    () => () => previewUrls.forEach((url) => URL.revokeObjectURL(url)),
    [previewUrls],
  );

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
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setCameraError(
          "No se pudo acceder a la cámara. Verifica los permisos del navegador, o sube un archivo.",
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

  const add = (photos: File[]) => {
    const next = [...valueRef.current, ...photos].slice(0, max);
    valueRef.current = next;
    onChange(next);
    if (next.length >= max) setCameraOpen(false);
  };

  const remove = (index: number) =>
    onChange(value.filter((_, i) => i !== index));

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      add([await toCompressedFile(video, video.videoWidth, video.videoHeight)]);
    } catch {
      setCameraError("No se pudo capturar la foto");
    }
  };

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(
      0,
      Math.max(0, max - valueRef.current.length),
    );
    event.target.value = "";
    if (files.length === 0) return;

    setError(null);
    if (files.some((file) => !file.type.startsWith("image/"))) {
      setError("Selecciona solo archivos de imagen");
      return;
    }
    if (files.some((file) => file.size > MAX_FILE_BYTES)) {
      setError("Cada foto debe pesar menos de 10 MB");
      return;
    }

    setIsProcessing(true);
    try {
      const compressed = await Promise.all(
        files.map(async (file) => {
          const image = await loadImage(file);
          return toCompressedFile(image, image.width, image.height);
        }),
      );
      add(compressed);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "No se pudo procesar la foto",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
        {max > 1 && value.length > 0 && (
          <span className="font-normal text-muted-foreground">
            {" "}
            · {value.length} de {max}
          </span>
        )}
      </Label>

      {previewUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previewUrls.map((url, index) => (
            <div key={url} className="relative">
              <img
                src={url}
                alt={`${label} ${index + 1}`}
                className="size-20 rounded-md border object-cover"
              />
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={disabled}
                aria-label="Quitar foto"
                className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!isFull && (
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
            {value.length > 0 ? "Tomar otra" : "Tomar foto"}
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
            {isProcessing
              ? "Procesando..."
              : value.length > 0
                ? "Subir más"
                : "Subir archivo"}
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        multiple={max > 1}
        className="hidden"
        onChange={handleFiles}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}

      <Dialog open={cameraOpen} onOpenChange={(v) => !v && setCameraOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{cameraTitle}</DialogTitle>
          </DialogHeader>

          {cameraError ? (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {cameraError}
            </p>
          ) : (
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted sm:aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="size-full object-cover"
              />
              {max > 1 && (
                <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                  {value.length} de {max}
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-6 py-3">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  aria-label="Subir archivo"
                  className="text-white/90 transition-colors hover:text-white"
                >
                  <Upload className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={handleCapture}
                  aria-label="Capturar foto"
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

          {max > 1 && (
            <Button type="button" onClick={() => setCameraOpen(false)}>
              Listo
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
