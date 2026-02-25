import boxCleanSvg from "@/assets/box-clean.svg";

interface PageLoaderProps {
  text?: string;
}

export function PageLoader({ text = "Cargando..." }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <img
        src={boxCleanSvg}
        alt=""
        className="w-20 h-auto animate-blink"
      />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
