import type { StorePrimitives } from "@contexts/iam/domain/schemas/store/Store";
import { ContactColumn } from "../../shared/ContactColumn";
import { OrderReferencesCard } from "./OrderReferencesCard";

interface HQContactStepProps {
  stores?: Pick<StorePrimitives, "id" | "name">[];
  selectedStoreId?: string;
  onStoreChange?: (storeId: string) => void;
}

export function HQContactStep({ stores, selectedStoreId, onStoreChange }: HQContactStepProps = {}) {
  return (
    <>
      <OrderReferencesCard stores={stores} selectedStoreId={selectedStoreId} onStoreChange={onStoreChange} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContactColumn fieldPrefix="sender" title="Remitente" />
        <ContactColumn fieldPrefix="recipient" title="Destinatario" />
      </div>
    </>
  );
}
