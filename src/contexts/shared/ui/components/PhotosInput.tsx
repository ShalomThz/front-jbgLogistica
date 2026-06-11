import {
  Camera,
  HelpCircle,
  Image as ImageIcon,
  SwitchCamera,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import packagePhotoSample from "@/assets/package-photo-sample.png";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@contexts/shared/shadcn";

const CAPTURE_HINT =
  "Toma una foto clara del paquete en una superficie plana, asegurándote de que se vean todas sus caras.";

const MAX_PHOTOS = 4;

interface Props {
  value: string[];
  onChange: (photos: string[]) => void;
  disabled?: boolean;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PhotosInput({ value, onChange, disabled }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
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

  // Start / restart camera when dialog opens or facing mode changes
  useEffect(() => {
    if (cameraOpen) {
      startCamera(facingMode);
    } else {
      stopStream();
    }
    return stopStream;
  }, [cameraOpen, facingMode, startCamera, stopStream]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const next = [...value, dataUrl];
    onChange(next);
    if (next.length >= MAX_PHOTOS) setCameraOpen(false);
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = MAX_PHOTOS - value.length;
    const base64s = await Promise.all(
      files.slice(0, remaining).map(fileToBase64),
    );
    onChange([...value, ...base64s]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Fotos</Label>
        <span className="text-xs text-muted-foreground">
          {value.length} / {MAX_PHOTOS}
        </span>
      </div>

      {/* Thumbnails */}
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {value.map((src, i) => (
            <div
              key={i}
              className="relative group aspect-square rounded-md overflow-hidden border"
            >
              <img
                src={src}
                alt={`Foto ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                disabled={disabled}
                className="absolute top-0.5 right-0.5 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add buttons */}
      {value.length < MAX_PHOTOS && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => setCameraOpen(true)}
            disabled={disabled}
          >
            <Camera className="size-4" />
            Cámara
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Upload className="size-4" />
            Archivo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFiles}
          />
        </div>
      )}

      {/* Camera dialog */}
      <Dialog
        open={cameraOpen}
        onOpenChange={(v) => {
          if (!v) setCameraOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5">
              Tomar foto
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <HelpCircle className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  avoidCollisions={false}
                  className="max-w-xs space-y-2 p-2"
                >
                  <img
                    src={packagePhotoSample}
                    alt="Ejemplo de foto del paquete"
                    className="w-full rounded-md"
                  />
                  <p>{CAPTURE_HINT}</p>
                </TooltipContent>
              </Tooltip>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
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
                  className="h-full w-full object-cover"
                />

                {/* Framing brackets */}
                <div className="pointer-events-none absolute inset-4">
                  <span className="absolute left-0 top-0 size-7 rounded-tl-lg border-l-[3px] border-t-[3px] border-white/80" />
                  <span className="absolute right-0 top-0 size-7 rounded-tr-lg border-r-[3px] border-t-[3px] border-white/80" />
                  <span className="absolute bottom-0 left-0 size-7 rounded-bl-lg border-b-[3px] border-l-[3px] border-white/80" />
                  <span className="absolute bottom-0 right-0 size-7 rounded-br-lg border-b-[3px] border-r-[3px] border-white/80" />
                </div>

                {/* Photo counter */}
                <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white">
                  {value.length}/{MAX_PHOTOS}
                </span>

                {/* Control bar */}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-6 py-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Elegir de la galería"
                    className="text-white/90 transition-colors hover:text-white"
                  >
                    <ImageIcon className="size-6" />
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
                      setFacingMode((f) =>
                        f === "user" ? "environment" : "user",
                      )
                    }
                    aria-label="Cambiar cámara"
                    className="text-white/90 transition-colors hover:text-white"
                  >
                    <SwitchCamera className="size-6" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
