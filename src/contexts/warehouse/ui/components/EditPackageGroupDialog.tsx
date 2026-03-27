import { useState } from "react";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@contexts/shared/shadcn";
import {
    warehousePackageStatuses,
    type WarehousePackageStatus,
} from "@/contexts/warehouse/domain/WarehousePackageSchema";
import type { EditPackageGroupRequest } from "@/contexts/warehouse/domain/PackageGroupSchema";

const STATUS_LABELS: Record<WarehousePackageStatus, string> = {
    WAREHOUSE: "En bodega",
    SHIPPED: "Enviado",
    DELIVERED: "Entregado",
    REPACKED: "Reempacado",
    AUTHORIZED: "Autorizado",
};

type Props = {
    open: boolean;
    groupId: string | null;
    initialStatus: WarehousePackageStatus;
    isLoading?: boolean;
    onClose: () => void;
    onSave: (groupId: string, payload: EditPackageGroupRequest) => Promise<void>;
};

export function EditPackageGroupDialog({
    open,
    groupId,
    initialStatus,
    isLoading,
    onClose,
    onSave,
}: Props) {
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [status, setStatus] = useState<WarehousePackageStatus>(initialStatus);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!groupId) return;

        await onSave(groupId, {
            invoiceNumber: invoiceNumber.trim() || undefined,
            status,
        });
    };

    return (
        <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar grupo</DialogTitle>
                    <DialogDescription>
                        Actualiza el estado o número de factura del grupo.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="edit-group-invoice">Número de factura</Label>
                        <Input
                            id="edit-group-invoice"
                            placeholder="FAC-2026-001"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label>Estado del grupo</Label>
                        <Select
                            value={status}
                            onValueChange={(value) => setStatus(value as WarehousePackageStatus)}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {warehousePackageStatuses.map((value) => (
                                    <SelectItem key={value} value={value}>
                                        {STATUS_LABELS[value]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading || !groupId}>
                            {isLoading ? "Guardando..." : "Guardar cambios"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
