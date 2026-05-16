import { useBoxSale } from "@contexts/inventory/infrastructure/hooks/boxSales/useBoxSale";
import type { BoxSaleListViewPrimitives } from "@contexts/inventory/domain/schemas/boxSale/BoxSaleListView";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Drives the box-sale detail dialog from the URL (`?saleId=<id>`), so deep
 * links — including the QR code on the printed receipt — open the matching
 * sale directly. Mirrors `usePackageDialog` from the warehouse context.
 */
export const useBoxSaleDialog = (sales: BoxSaleListViewPrimitives[]) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSaleId = searchParams.get("saleId");

  const selectedFromList = useMemo(
    () => sales.find((s) => s.id === selectedSaleId) ?? null,
    [sales, selectedSaleId],
  );

  // Fallback fetch when the deep-linked sale isn't on the current page.
  const { data: fetchedSale } = useBoxSale(
    selectedSaleId && !selectedFromList ? selectedSaleId : undefined,
  );

  const selectedSale = selectedFromList ?? fetchedSale ?? null;

  const handleOpenDialog = (sale: BoxSaleListViewPrimitives) => {
    const next = new URLSearchParams(searchParams);
    next.set("saleId", sale.id);
    setSearchParams(next);
  };

  const handleCloseDialog = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("saleId");
    setSearchParams(next);
  };

  return {
    selectedSaleId,
    selectedSale,
    handleOpenDialog,
    handleCloseDialog,
  };
};
