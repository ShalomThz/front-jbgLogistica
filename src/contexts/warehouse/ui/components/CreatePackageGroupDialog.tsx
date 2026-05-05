import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@contexts/shared/shadcn";
import type { PackageListViewPrimitives } from "@/contexts/warehouse/domain/WarehousePackageSchema";

type Props = {
    open: boolean;
    selectedPackages: PackageListViewPrimitives[];
    isLoading?: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
};

export function CreatePackageGroupDialog({
    open,
    selectedPackages,
    isLoading,
    onClose,
    onConfirm,
}: Props) {
    const count = selectedPackages.length;
    const anchor = selectedPackages[0];
    const canConfirm = count >= 2 && !isLoading;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!canConfirm) return;
        await onConfirm();
    };

    return (
        <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Agrupar paquetes</DialogTitle>
                    <DialogDescription>
                        {count < 2
                            ? "Selecciona al menos 2 paquetes para crear un grupo."
                            : `Se creará un grupo con ${count} paquetes.`}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {anchor && (
                        <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-2">
                            <div className="flex justify-between gap-2">
                                <span className="text-muted-foreground">Cliente</span>
                                <span className="font-medium text-right">{anchor.customer.name}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                                <span className="text-muted-foreground">Tienda</span>
                                <span className="font-medium text-right">{anchor.store.name}</span>
                            </div>
                        </div>
                    )}

                    {count > 0 && (
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                                Paquetes a agrupar ({count})
                            </p>
                            <ul className="max-h-40 overflow-y-auto rounded-md border divide-y text-sm">
                                {selectedPackages.map((p) => (
                                    <li key={p.id} className="px-3 py-1.5 font-mono text-xs">
                                        {p.officialInvoice || p.id.slice(0, 8)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={!canConfirm}>
                            {isLoading ? "Agrupando..." : "Confirmar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
