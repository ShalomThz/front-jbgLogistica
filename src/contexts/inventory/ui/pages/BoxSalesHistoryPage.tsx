import { useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { BoxSaleDetailDialog } from "../components/boxSale/BoxSaleDetailDialog";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@contexts/shared/shadcn";
import { exportBoxSales } from "@contexts/inventory/domain/services/exportBoxSales";
import { useBoxSales } from "@contexts/inventory/infrastructure/hooks/boxSales/useBoxSales";
import { useBoxSaleDialog } from "@contexts/inventory/ui/hooks/useBoxSaleDialog";
import { UNIT_SHORT_LABELS } from "../components/box/constants";

const LIMIT_OPTIONS = [10, 20, 50];

export const BoxSalesHistoryPage = () => {
  const [salesPage, setSalesPage] = useState(1);
  const [salesLimit, setSalesLimit] = useState(LIMIT_OPTIONS[0]);

  const {
    sales,
    pagination: salesPagination,
    totalPages: salesTotalPages,
    isLoading: salesLoading,
    downloadReceipt,
    isDownloadingReceipt,
    printReceipt,
    isPrintingReceipt,
  } = useBoxSales({ page: salesPage, limit: salesLimit });

  const {
    selectedSale,
    handleOpenDialog: openSaleDialog,
    handleCloseDialog: closeSaleDialog,
  } = useBoxSaleDialog(sales);

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      <h1 className="text-2xl font-bold">Historial Venta de Cajas</h1>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => exportBoxSales(sales)}>
          <Download className="size-4" />
          Exportar XLSX
        </Button>
        <Select
          value={String(salesLimit)}
          onValueChange={(v) => {
            setSalesLimit(Number(v));
            setSalesPage(1);
          }}
        >
          <SelectTrigger className="w-[130px]">
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

      <div className="rounded-lg border min-h-0 overflow-hidden [&>div]:max-h-full [&>div]:overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead>Folio</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="hidden sm:table-cell">Vendedor</TableHead>
              <TableHead>Cajas</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <p className="text-muted-foreground">Cargando ventas...</p>
                </TableCell>
              </TableRow>
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <p className="text-muted-foreground">No hay ventas registradas.</p>
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => (
                <TableRow key={sale.id} className="cursor-pointer" onClick={() => openSaleDialog(sale)}>
                  <TableCell className="font-mono text-xs">
                    {sale.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(sale.createdAt).toLocaleString("es-MX")}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">
                    {sale.soldBy?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    <ul className="space-y-0.5">
                      {sale.items.map((item, i) => {
                        const d = item.box?.dimensions;
                        const dims = d
                          ? `${d.length} × ${d.width} × ${d.height} ${UNIT_SHORT_LABELS[d.unit]}`
                          : null;
                        return (
                          <li key={i} className="truncate">
                            <span className="font-medium">
                              {item.box?.name ?? item.boxId}
                            </span>
                            {dims && (
                              <span className="text-muted-foreground">
                                {" "}
                                ({dims})
                              </span>
                            )}
                            <span className="text-muted-foreground"> ×{item.quantity}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${sale.totalAmount.amount.toFixed(2)} {sale.totalAmount.currency}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {salesPagination && salesPagination.total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {salesPagination.offset + 1}-{salesPagination.offset + sales.length} de {salesPagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSalesPage((p) => p - 1)}
              disabled={salesPage <= 1}
            >
              <ChevronLeft className="size-4" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              {salesPage} / {salesTotalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSalesPage((p) => p + 1)}
              disabled={!salesPagination.hasMore}
            >
              Siguiente
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <BoxSaleDetailDialog
        sale={selectedSale}
        open={!!selectedSale}
        onClose={closeSaleDialog}
        onDownloadReceipt={downloadReceipt}
        isDownloadingReceipt={isDownloadingReceipt}
        onPrintReceipt={printReceipt}
        isPrintingReceipt={isPrintingReceipt}
      />
    </div>
  );
};
