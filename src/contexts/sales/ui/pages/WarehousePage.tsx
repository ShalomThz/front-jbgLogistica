import { useState } from "react";
import { Plus, Search, Package, Weight } from "lucide-react";
import {
  Input,
  Badge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import { WarehouseDetailDialog } from "../components/warehouse/WarehouseDetailDialog";
import { WarehouseFormDialog } from "../components/warehouse/WarehouseFormDialog";
import { WarehouseDeleteDialog } from "../components/warehouse/WarehouseDeleteDialog";
import type { WarehousePackagePrimitives, WarehousePackageStatus } from "../../domain/schemas/warehouse-package/WarehousePackageSchema";

const STATUS_LABELS: Record<WarehousePackageStatus, string> = {
  WAREHOUSE: "En bodega",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  REPACKED: "Reempacado",
  AUTHORIZED: "Autorizado",
};

const STATUS_VARIANT: Record<WarehousePackageStatus, "default" | "secondary" | "outline"> = {
  WAREHOUSE: "secondary",
  SHIPPED: "outline",
  DELIVERED: "default",
  REPACKED: "secondary",
  AUTHORIZED: "default",
};

const now = new Date().toISOString();

const INITIAL_DATA: WarehousePackagePrimitives[] = [
  {
    id: "PKG-001",
    customerId: "cli-001",
    storeId: "store-001",
    officialInvoice: "FAC-2025-0001",
    providerId: "prov-001",
    providerDeliveryPerson: "Roberto Hernández",
    boxId: "box-med-001",
    weightInKg: 5.5,
    packer: "Juan Pérez",
    status: "WAREHOUSE",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "PKG-002",
    customerId: "cli-002",
    storeId: "store-001",
    officialInvoice: "FAC-2025-0002",
    providerId: "prov-002",
    providerDeliveryPerson: "Luis Ramírez",
    boxId: "box-gde-001",
    weightInKg: 12.3,
    packer: "María López",
    status: "AUTHORIZED",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "PKG-003",
    customerId: "cli-003",
    storeId: "store-002",
    officialInvoice: "FAC-2025-0003",
    providerId: "prov-001",
    providerDeliveryPerson: "Roberto Hernández",
    boxId: "box-chk-001",
    weightInKg: 2.1,
    packer: "Carlos García",
    status: "SHIPPED",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "PKG-004",
    customerId: "cli-001",
    storeId: "store-001",
    officialInvoice: "FAC-2025-0004",
    providerId: "prov-003",
    providerDeliveryPerson: "Fernando Díaz",
    boxId: "box-med-002",
    weightInKg: 8.7,
    packer: "Ana Martínez",
    status: "DELIVERED",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "PKG-005",
    customerId: "cli-004",
    storeId: "store-003",
    officialInvoice: "FAC-2025-0005",
    providerId: "prov-002",
    providerDeliveryPerson: "Luis Ramírez",
    boxId: "box-gde-002",
    weightInKg: 15.0,
    packer: "Juan Pérez",
    status: "REPACKED",
    createdAt: now,
    updatedAt: now,
  },
];

export const WarehousePage = () => {
  const [packages, setPackages] = useState<WarehousePackagePrimitives[]>(INITIAL_DATA);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<WarehousePackagePrimitives | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editPkg, setEditPkg] = useState<WarehousePackagePrimitives | null>(null);
  const [deletePkg, setDeletePkg] = useState<WarehousePackagePrimitives | null>(null);

  const filtered = packages.filter((p) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      p.id.toLowerCase().includes(query) ||
      p.officialInvoice.toLowerCase().includes(query) ||
      p.packer.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = (data: Omit<WarehousePackagePrimitives, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newPkg: WarehousePackagePrimitives = {
      ...data,
      id: `PKG-${String(Date.now()).slice(-6)}`,
      createdAt: now,
      updatedAt: now,
    };
    setPackages((prev) => [...prev, newPkg]);
    setFormOpen(false);
  };

  const handleUpdate = (data: Omit<WarehousePackagePrimitives, "id" | "createdAt" | "updatedAt">) => {
    if (!editPkg) return;
    setPackages((prev) =>
      prev.map((p) =>
        p.id === editPkg.id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
      )
    );
    setEditPkg(null);
  };

  const handleDelete = () => {
    if (!deletePkg) return;
    setPackages((prev) => prev.filter((p) => p.id !== deletePkg.id));
    setDeletePkg(null);
  };

  const handleEditFromDetail = (pkg: WarehousePackagePrimitives) => {
    setSelected(null);
    setEditPkg(pkg);
  };

  const handleDeleteFromDetail = (pkg: WarehousePackagePrimitives) => {
    setSelected(null);
    setDeletePkg(pkg);
  };

  const totalWeight = packages.reduce((sum, p) => sum + p.weightInKg, 0);
  const inWarehouse = packages.filter((p) => p.status === "WAREHOUSE").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bodega</h1>
          <p className="text-sm text-muted-foreground">
            {inWarehouse} paquetes en bodega · {totalWeight.toFixed(1)} kg total
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Registrar Paquete
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, factura o empacador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="WAREHOUSE">En bodega</SelectItem>
            <SelectItem value="AUTHORIZED">Autorizado</SelectItem>
            <SelectItem value="SHIPPED">Enviado</SelectItem>
            <SelectItem value="DELIVERED">Entregado</SelectItem>
            <SelectItem value="REPACKED">Reempacado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paquete</TableHead>
              <TableHead className="hidden sm:table-cell">Factura</TableHead>
              <TableHead className="hidden md:table-cell">Empacador</TableHead>
              <TableHead className="text-right">Peso</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No se encontraron paquetes.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelected(p)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="size-4 text-muted-foreground" />
                      <span className="font-medium">{p.id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{p.officialInvoice}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{p.packer}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Weight className="size-3 text-muted-foreground" />
                      <span className="font-mono text-sm">{p.weightInKg} kg</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABELS[p.status]}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <WarehouseDetailDialog
        pkg={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
      />
      <WarehouseFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSave={handleCreate} />
      <WarehouseFormDialog
        open={!!editPkg}
        onClose={() => setEditPkg(null)}
        onSave={handleUpdate}
        pkg={editPkg}
      />
      <WarehouseDeleteDialog
        pkg={deletePkg}
        open={!!deletePkg}
        onClose={() => setDeletePkg(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
