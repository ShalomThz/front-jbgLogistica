import { Camera, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button, Label } from "@contexts/shared/shadcn";
import { CustomerAvatar } from "./CustomerAvatar";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_DIMENSION = 1200;

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

async function compressPhoto(file: File): Promise<string> {
  const source = await readFile(file);
  const image = await loadImage(source);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo procesar la fotografía");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.85);
}

export const CustomerPhotoInput = ({
  value,
  name,
  onChange,
  error,
  disabled,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
      <Label htmlFor="customer-photo">Fotografía del cliente</Label>
      <div className="flex items-center gap-4 rounded-md border p-3">
        <CustomerAvatar
          photo={value || null}
          name={name}
          className="size-20"
        />
        <div className="flex-1 space-y-2">
          <p className="text-sm text-muted-foreground">
            Usa una fotografía clara del rostro del cliente.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isProcessing}
            onClick={() => inputRef.current?.click()}
          >
            {value ? <Camera className="size-4" /> : <Upload className="size-4" />}
            {isProcessing
              ? "Procesando..."
              : value
                ? "Cambiar fotografía"
                : "Agregar fotografía"}
          </Button>
          <input
            ref={inputRef}
            id="customer-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="user"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      </div>
      {(fileError || error) && (
        <p className="text-xs text-destructive">{fileError ?? error}</p>
      )}
    </div>
  );
};
