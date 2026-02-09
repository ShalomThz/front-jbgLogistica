import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Search, MapPin } from "lucide-react";
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
} from "@/shared/shadcn";
import { CustomerDetailDialog } from "../components/customer/CustomerDetailDialog";
import { CustomerFormDialog } from "../components/customer/CustomerFormDialog";
import { CustomerDeleteDialog } from "../components/customer/CustomerDeleteDialog";
import { useCustomers } from "../../infrastructure/hooks";
import type { CustomerPrimitives } from "@/contexts/sales/domain";

type CreateCustomerData = Omit<CustomerPrimitives, "id" | "createdAt" | "updatedAt">;

const LIMIT_OPTIONS = [10, 20, 50];

export const CustomersPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(LIMIT_OPTIONS[0]);

  const {
    customers,
    pagination,
    totalPages,
    isLoading,
    refetch,
    createCustomer,
    isCreating,
    updateCustomer,
    isUpdating,
    deleteCustomer,
    isDeleting,
  } = useCustomers({ page, limit });

  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<CustomerPrimitives | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<CustomerPrimitives | null>(null);
  const [deleteCustomerDialog, setDeleteCustomerDialog] = useState<CustomerPrimitives | null>(null);

  const filtered = customers.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      searchQuery === "" ||
      c.name.toLowerCase().includes(query) ||
      c.company.toLowerCase().includes(query) ||
      c.phone.includes(searchQuery) ||
      c.email.toLowerCase().includes(query)
    );
  });

  const handleCreate = async (data: CreateCustomerData) => {
    await createCustomer(data);
    setFormOpen(false);
    setPage(1);
  };

  const handleUpdate = async (data: CreateCustomerData) => {
    if (!editCustomer) return;
    await updateCustomer(editCustomer.id, data);
    setEditCustomer(null);
  };

  const handleDelete = async () => {
    if (!deleteCustomerDialog) return;
    await deleteCustomer(deleteCustomerDialog.id);
    setDeleteCustomerDialog(null);
    setPage(1);
  };

  const handleEditFromDetail = (customer: CustomerPrimitives) => {
    setSelected(null);
    setEditCustomer(customer);
  };

  const handleDeleteFromDetail = (customer: CustomerPrimitives) => {
    setSelected(null);
    setDeleteCustomerDialog(customer);
  };

  const from = pagination ? pagination.offset + 1 : 0;
  const to = pagination ? pagination.offset + customers.length : 0;
  const total = pagination?.total ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando clientes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            Crear Cliente
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, empresa, teléfono o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={String(limit)}
          onValueChange={(v) => {
            setLimit(Number(v));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LIMIT_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={String(opt)}>
                {opt} por página
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">Dirección</TableHead>
              <TableHead className="hidden lg:table-cell">Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No se encontraron clientes.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.company}</TableCell>
                  <TableCell className="hidden sm:table-cell">{c.phone}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{c.email}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant="outline" className="gap-1">
                      <MapPin className="size-3" />
                      {c.address.city}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString("es-MX")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {from}-{to} de {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="size-4" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasMore}
            >
              Siguiente
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
      <CustomerDetailDialog
        customer={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
      />
      <CustomerFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleCreate}
        isLoading={isCreating}
      />
      <CustomerFormDialog
        open={!!editCustomer}
        onClose={() => setEditCustomer(null)}
        onSave={handleUpdate}
        customer={editCustomer}
        isLoading={isUpdating}
      />
      <CustomerDeleteDialog
        customer={deleteCustomerDialog}
        open={!!deleteCustomerDialog}
        onClose={() => setDeleteCustomerDialog(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};
