import { ContactColumn } from "../../shared/ContactColumn";
import { OrderReferencesCard } from "./OrderReferencesCard";

interface HQContactStepProps {
  selectedStoreId?: string;
  onStoreChange?: (storeId: string) => void;
}

export function HQContactStep({ selectedStoreId, onStoreChange }: HQContactStepProps = {}) {
  return (
    <div className="flex-1 min-h-0 overflow-auto space-y-6 p-2">
      <OrderReferencesCard selectedStoreId={selectedStoreId} onStoreChange={onStoreChange} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContactColumn fieldPrefix="sender" title="Remitente" />
        <ContactColumn fieldPrefix="recipient" title="Destinatario" />
      </div>
    </div>
  );
}
