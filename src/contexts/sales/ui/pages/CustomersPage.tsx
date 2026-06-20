import type { CustomerListViewPrimitives } from "@contexts/sales/domain/schemas/customer/CustomerListView";
import { exportCustomers } from "@contexts/sales/domain/services/exportCustomers";
import { formatCustomerNumber } from "@contexts/shared/domain/formatCustomerNumber";
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@contexts/shared/shadcn";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import { ChevronLeft, ChevronRight, KeyRound, MapPin, Plus, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { CreateCustomerRequest } from "../../application/customer/CreateCustomerRequest";
import { useCustomers } from "../../infrastructure/hooks/customers/useCustomers";
import { CustomerDeleteDialog } from "../components/customer/CustomerDeleteDialog";
import { CustomerDetailDialog } from "../components/customer/CustomerDetailDialog";
import { CustomerFilters } from "../components/customer/CustomerFilters";
import { CustomerFormDialog } from "../components/customer/CustomerFormDialog";
import { CustomerPortalAccessDialog } from "../components/customer/CustomerPortalAccessDialog";
import { useCustomerFilters, type CustomerFilterOptions } from "../hooks/useCustomerFilters";
import { customerPolicies } from "@contexts/shared/domain/policies/customer.policy";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";

const LIMIT_OPTIONS = [10, 20, 50];

export const CustomersPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(LIMIT_OPTIONS[0]);

  const { state: filters, setFilter, reset: resetFilters, criteria } = useCustomerFilters();

  const [prevCriteria, setPrevCriteria] = useState(criteria);
  if (criteria !== prevCriteria) {
    setPrevCriteria(criteria);
    setPage(1);
  }

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
  } = useCustomers({ page, limit, ...criteria });

  const { user } = useAuth();
  const canView = user ? customerPolicies.view(user) : false;
  const canCreate = user ? customerPolicies.create(user) : false;
  const canEdit = user ? customerPolicies.edit(user) : false;
  const canDelete = user ? customerPolicies.delete(user) : false;
  const canProvision = user ? customerPolicies.provisionAccess(user) : false;
  const canListAll = user ? customerPolicies.listAll(user) : false;

  const options = useMemo<CustomerFilterOptions>(() => {
    const citySet = new Set<string>();
    for (const c of customers) {
      if (c.address.city) citySet.add(c.address.city);
    }
    return {
      cities: Array.from(citySet).sort(),
    };
  }, [customers]);

  const [selected, setSelected] = useState<CustomerListViewPrimitives | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<CustomerListViewPrimitives | null>(null);
  const [deleteCustomerDialog, setDeleteCustomerDialog] = useState<CustomerListViewPrimitives | null>(null);
  const [accessCustomer, setAccessCustomer] = useState<CustomerListViewPrimitives | null>(null);

  const handleCreate = async (data: CreateCustomerRequest) => {
    try {
      await createCustomer(data);
      toast.success("Cliente creado correctamente");
      setFormOpen(false);
      setPage(1);
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const handleUpdate = async (data: CreateCustomerRequest) => {
    if (!editCustomer) return;
    try {
      await updateCustomer(editCustomer.id, data);
      toast.success("Cliente actualizado correctamente");
      setEditCustomer(null);
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteCustomerDialog) return;
    try {
      await deleteCustomer(deleteCustomerDialog.id);
      toast.success("Cliente eliminado correctamente");
      setDeleteCustomerDialog(null);
      setPage(1);
    } catch (err) {
      toast.error(parseApiError(err));
    }
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
    <div className="flex flex-col h-full min-h-0 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => { resetFilters(); refetch(); }}>
            <RefreshCw className="size-4" />
          </Button>
          {canCreate && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="size-4" />
              Crear Cliente
            </Button>
          )}
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
        onExport={() => exportCustomers(customers)}
      />

      <div className="rounded-lg border min-h-0 overflow-hidden [&>div]:max-h-full [&>div]:overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="w-28 hidden sm:table-cell">#</TableHead>
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
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No se encontraron clientes.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c) => (
                <TableRow key={c.id} className={canView ? "cursor-pointer" : undefined} onClick={canView ? () => setSelected(c) : undefined}>
                  <TableCell className="hidden sm:table-cell font-mono text-xs text-muted-foreground">{formatCustomerNumber(c.customerNumber)}</TableCell>
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
                    {canProvision && (
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
                    )}
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
        onEdit={canEdit ? handleEditFromDetail : undefined}
        onDelete={canDelete ? handleDeleteFromDetail : undefined}
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
