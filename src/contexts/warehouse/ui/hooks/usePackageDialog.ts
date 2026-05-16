import { usePackage } from "@/contexts/warehouse/infrastructure/hooks/usePackage";
import type { PackageListViewPrimitives } from "@/contexts/warehouse/domain/WarehousePackageSchema";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Drives the warehouse detail dialog from the URL (`?packageId=<id>`), so
 * deep links — including the QR code on the printed receipt — open the
 * matching package directly. Mirrors the orders dialog pattern.
 */
export const usePackageDialog = (packages: PackageListViewPrimitives[]) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPackageId = searchParams.get("packageId");

  const selectedFromList = useMemo(
    () => packages.find((p) => p.id === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  );

  // Fallback fetch when the deep-linked package isn't on the current page.
  const { data: fetchedPackage } = usePackage(
    selectedPackageId && !selectedFromList ? selectedPackageId : undefined,
  );

  const selectedPackage = selectedFromList ?? fetchedPackage ?? null;

  const handleOpenDialog = (pkg: PackageListViewPrimitives) => {
    const next = new URLSearchParams(searchParams);
    next.set("packageId", pkg.id);
    setSearchParams(next);
  };

  const handleCloseDialog = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("packageId");
    setSearchParams(next);
  };

  return {
    selectedPackageId,
    selectedPackage,
    handleOpenDialog,
    handleCloseDialog,
  };
};
