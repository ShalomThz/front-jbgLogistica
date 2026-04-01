import { useRef, useEffect, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@contexts/shared/shadcn/components/button";
import { Trash2 } from "lucide-react";

interface SignaturePadProps {
    onSignatureChange: (signatureBase64: string | null) => void;
}

export const SignaturePad = ({ onSignatureChange }: SignaturePadProps) => {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 160 });

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setCanvasSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };

        const observer = new ResizeObserver(() => updateSize());
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        updateSize();
        return () => observer.disconnect();
    }, []);

    const clearSignature = () => {
        sigCanvas.current?.clear();
        onSignatureChange(null);
    };

    const handleEnd = () => {
        if (sigCanvas.current?.isEmpty()) {
            onSignatureChange(null);
        } else {
            const base64 = sigCanvas.current?.getCanvas().toDataURL("image/png");
            onSignatureChange(base64 ?? null);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Firma del Cliente (Opcional)</span>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearSignature}
                    className="h-8 px-2 text-muted-foreground"
                >
                    <Trash2 className="mr-2 size-4" />
                    Limpiar
                </Button>
            </div>
            {/* El contenedor define el tamaño visual y le pasamos los pixeles exactos al canvas */}
            <div ref={containerRef} className="h-40 w-full rounded-md border bg-white dark:bg-zinc-950 overflow-hidden">
                <SignatureCanvas
                    ref={sigCanvas}
                    onEnd={handleEnd}
                    penColor="black"
                    canvasProps={{
                        width: canvasSize.width,
                        height: canvasSize.height,
                        className: "cursor-crosshair touch-none", // touch-none evita que la página haga scroll al firmar con el dedo/pluma
                    }}
                />
            </div>
        </div>
    );
};
