import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, RefreshCw, MapPin, KeyRound } from "lucide-react";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import {
  Badge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@contexts/shared/shadcn";
import { CustomerDetailDialog } from "../components/customer/CustomerDetailDialog";
import { CustomerFormDialog } from "../components/customer/CustomerFormDialog";
import { CustomerDeleteDialog } from "../components/customer/CustomerDeleteDialog";
import { CustomerPortalAccessDialog } from "../components/customer/CustomerPortalAccessDialog";
import { CustomerFilters } from "../components/customer/CustomerFilters";
import { useCustomers } from "../../infrastructure/hooks/customers/useCustomers";
import { useCustomerFilters } from "../hooks/useCustomerFilters";
import type { CustomerListViewPrimitives } from "@contexts/sales/domain/schemas/customer/CustomerListView";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { customerPolicies } from "@contexts/shared/domain/policies/customer.policy";
import type { CreateCustomerRequest } from "../../application/customer/CreateCustomerRequest";

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
    provisionAccess,
    isProvisioning,
  } = useCustomers({ page, limit });

  const { user } = useAuth();
  const canListAll = user ? customerPolicies.listAll(user) : false;

  const { filters, setFilter, resetFilters, filtered, options } = useCustomerFilters(customers);

  const [selected, setSelected] = useState<CustomerListViewPrimitives | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<CustomerListViewPrimitives | null>(null);
  const [deleteCustomerDialog, setDeleteCustomerDialog] = useState<CustomerListViewPrimitives | null>(null);
  const [accessCustomer, setAccessCustomer] = useState<CustomerListViewPrimitives | null>(null);

  const handleCreate = async (data: CreateCustomerRequest) => {
    await createCustomer(data);
    setFormOpen(false);
    setPage(1);
  };

  const handleUpdate = async (data: CreateCustomerRequest) => {
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

  const handleEditFromDetail = (customer: CustomerListViewPrimitives) => {
    setSelected(null);
    setEditCustomer(customer);
  };

  const handleDeleteFromDetail = (customer: CustomerListViewPrimitives) => {
    setSelected(null);
    setDeleteCustomerDialog(customer);
  };

  const from = pagination ? pagination.offset + 1 : 0;
  const to = pagination ? pagination.offset + customers.length : 0;
  const total = pagination?.total ?? 0;

  if (isLoading) {
    return <PageLoader text="Cargando clientes..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => { resetFilters(); refetch(); }}>
            <RefreshCw className="size-4" />
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            Crear Cliente
          </Button>
        </div>
      </div>

      <CustomerFilters
        filters={filters}
        options={options}
        limit={limit}
        limitOptions={LIMIT_OPTIONS}
        showStoreFilter={canListAll}
        setFilter={setFilter}
        onLimitChange={(v) => {
          setLimit(v);
          setPage(1);
        }}
        onResetAndRefetch={() => { resetFilters(); refetch(); }}
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tienda</TableHead>
              <TableHead className="hidden sm:table-cell">Telefono</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">Direccion</TableHead>
              <TableHead className="hidden lg:table-cell">Registro</TableHead>
              <TableHead className="w-12 text-right">Portal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No se encontraron clientes.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.store.name}</TableCell>
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
                  <TableCell className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={c.user ? "text-primary" : "text-muted-foreground"}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAccessCustomer(c);
                          }}
                        >
                          <KeyRound className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {c.user ? "Renovar acceso al portal" : "Configurar acceso al portal"}
                      </TooltipContent>
                    </Tooltip>
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
      <CustomerPortalAccessDialog
        customer={accessCustomer}
        open={!!accessCustomer}
        onClose={() => setAccessCustomer(null)}
        onProvision={provisionAccess}
        onUpdateEmail={async (id, email) => {
          await updateCustomer(id, { email })
        }}
        isLoading={isProvisioning}
      />
    </div>
  );
};
