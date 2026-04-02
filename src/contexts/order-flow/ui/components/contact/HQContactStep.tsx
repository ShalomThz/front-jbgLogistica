import { ContactColumn } from "./ContactColumn";
import { OrderReferencesCard } from "./OrderReferencesCard";

export function HQContactStep() {
  return (
    <>
      <OrderReferencesCard />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContactColumn fieldPrefix="sender" title="Remitente" />
        <ContactColumn fieldPrefix="recipient" title="Destinatario" />
      </div>
    </>
  );
}
