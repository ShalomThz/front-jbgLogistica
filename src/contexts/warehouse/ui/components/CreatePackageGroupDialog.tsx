import {  useState } from "react";
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Input,
    Label,
} from "@contexts/shared/shadcn";

type Props = {
    open: boolean;
    selectedCount: number;
    isLoading?: boolean;
    onClose: () => void;
    onConfirm: (invoiceNumber?: string) => Promise<void>;
};

export function CreatePackageGroupDialog({
    open,
    selectedCount,
    isLoading,
    onClose,
    onConfirm,
}: Props) {
    const [invoiceNumber, setInvoiceNumber] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await onConfirm(invoiceNumber.trim() || undefined);
    };

    return (
        <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Agrupar paquetes seleccionados</DialogTitle>
                    <DialogDescription>
                        Se agruparán {selectedCount} paquetes en un nuevo grupo.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="group-invoice">Número de factura (opcional)</Label>
                        <Input
                            id="group-invoice"
                            placeholder="FAC-2026-001"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading || selectedCount < 1}>
                            {isLoading ? "Agrupando..." : "Confirmar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
