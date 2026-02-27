import { Camera, SwitchCamera, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
} from "@contexts/shared/shadcn";

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
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
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
        setCameraError("No se pudo acceder a la cámara. Verifica los permisos del navegador.");
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
    const base64s = await Promise.all(files.slice(0, remaining).map(fileToBase64));
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
            <DialogTitle>Tomar foto</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {cameraError ? (
              <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {cameraError}
              </p>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-md bg-muted aspect-video object-cover"
              />
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setFacingMode((f) => (f === "user" ? "environment" : "user"))
                }
              >
                <SwitchCamera className="size-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                className="flex-1 gap-2"
                onClick={handleCapture}
                disabled={!!cameraError}
              >
                <Camera className="size-4" />
                Capturar ({value.length}/{MAX_PHOTOS})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
