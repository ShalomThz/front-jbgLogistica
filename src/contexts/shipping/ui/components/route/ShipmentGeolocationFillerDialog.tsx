import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@contexts/shared/shadcn";
import { parseApiError } from "@contexts/shared/infrastructure/http";
import type { PlaceDetailsResponse } from "@contexts/shared/domain/schemas/address/PlaceDetailsResponse";
import { AddressSuggestions } from "@contexts/shared/ui/components/address/autocomplete/AddressSuggestions";
import { BadgeCheck, Check, MapPin, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import type { ShipmentGeolocationKind } from "../../../domain/services/shipmentAddressVerification";
import { useUpdateShipmentGeolocation } from "../../../infrastructure/hooks/shipments/useUpdateShipmentGeolocation";

interface Props {
  open: boolean;
  onClose: () => void;
  order: OrderListView | null;
  /** PICKUP fills the sender's coordinates, DELIVERY the recipient's */
  kind: ShipmentGeolocationKind;
}

interface AddressFields {
  address1: string;
  address2: string;
  city: string;
  province: string;
  zip: string;
  country: string;
}

const buildQuery = (fields: AddressFields): string =>
  [
    fields.address1,
    fields.address2,
    fields.city,
    fields.province,
    fields.zip,
    fields.country,
  ]
    .filter(Boolean)
    .join(", ");

const FIELD_LABELS: { key: keyof AddressFields; label: string }[] = [
  { key: "address1", label: "Calle y número" },
  { key: "address2", label: "Colonia" },
  { key: "city", label: "Ciudad" },
  { key: "province", label: "Estado" },
  { key: "zip", label: "Código postal" },
  { key: "country", label: "País" },
];

/**
 * Filler for orders captured without Google verification: shows the address
 * fields pre-filled, searches Google suggestions with them and requires
 * picking one — the chosen place brings the geocoding (placeId + lat/lng),
 * which is stored on the shipment. The order itself is not modified; the
 * fields here only refine the search.
 */
function FillerForm({
  order,
  kind,
  onClose,
}: {
  order: OrderListView;
  kind: ShipmentGeolocationKind;
  onClose: () => void;
}) {
  const profile = kind === "PICKUP" ? order.origin : order.destination;

  const [fields, setFields] = useState<AddressFields>({
    address1: profile.address.address1 ?? "",
    address2: profile.address.address2 ?? "",
    city: profile.address.city ?? "",
    province: profile.address.province ?? "",
    zip: profile.address.zip ?? "",
    country: profile.address.country ?? "MX",
  });
  // Suggestions search only re-runs on commit (blur/Enter), not per keystroke
  const [query, setQuery] = useState(() => buildQuery(fields));
  const [selectedPlace, setSelectedPlace] =
    useState<PlaceDetailsResponse | null>(null);

  const { updateShipmentGeolocation, isUpdatingGeolocation } =
    useUpdateShipmentGeolocation();

  const changeField = (key: keyof AddressFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    // Editing after picking invalidates the verification — must pick again
    setSelectedPlace(null);
  };

  const commitSearch = () => setQuery(buildQuery(fields));

  const handleSave = async () => {
    if (!order.shipment || !selectedPlace) return;
    try {
      await updateShipmentGeolocation({
        shipmentId: order.shipment.id,
        kind,
        geolocation: selectedPlace.geolocation,
      });
      toast.success("Ubicación verificada para el envío");
      onClose();
    } catch (e) {
      toast.error(parseApiError(e));
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{profile.name}</p>
        {selectedPlace ? (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <BadgeCheck className="size-3.5" />
            Dirección verificada
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
            <TriangleAlert className="size-3.5" />
            Selecciona una sugerencia de Google
          </span>
        )}
      </div>

      {/* Address fields — pre-filled from the order, edit to refine the search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FIELD_LABELS.map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <Input
              value={fields[key]}
              onChange={(e) => changeField(key, e.target.value)}
              onBlur={commitSearch}
              onKeyDown={(e) => e.key === "Enter" && commitSearch()}
            />
          </div>
        ))}
      </div>

      <AddressSuggestions
        query={query}
        country={fields.country || undefined}
        dismissed={!!selectedPlace}
        onSelect={setSelectedPlace}
      />

      {/* Picked suggestion — the geocoding that will be stored on the shipment */}
      {selectedPlace && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50/50 px-3 py-2 text-sm">
          <p className="flex items-center gap-1.5 font-medium text-emerald-700">
            <MapPin className="size-3.5 shrink-0" />
            {selectedPlace.address1}
            {selectedPlace.address2 ? `, ${selectedPlace.address2}` : ""},{" "}
            {selectedPlace.city}, {selectedPlace.province} {selectedPlace.zip}
          </p>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {selectedPlace.geolocation.latitude.toFixed(6)},{" "}
            {selectedPlace.geolocation.longitude.toFixed(6)}
          </p>
        </div>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isUpdatingGeolocation}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!selectedPlace || isUpdatingGeolocation}
          className="gap-1.5"
        >
          {isUpdatingGeolocation ? (
            "Guardando…"
          ) : (
            <>
              <Check className="size-3.5" />
              Guardar ubicación
            </>
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

export const ShipmentGeolocationFillerDialog = ({
  open,
  onClose,
  order,
  kind,
}: Props) => (
  <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
    <DialogContent className="w-[calc(100vw-2rem)] max-w-[95vw] sm:max-w-[640px] max-h-[92vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <MapPin className="size-5 text-primary" />
          Verificar ubicación{" "}
          {kind === "PICKUP" ? "de recolección" : "de entrega"}
        </DialogTitle>
        <DialogDescription>
          Esta orden se creó sin verificación de Google. Ajusta los campos si
          hace falta y elige la sugerencia correcta del{" "}
          {kind === "PICKUP" ? "remitente" : "destinatario"} — la sugerencia
          trae las coordenadas que se guardarán en el envío.
        </DialogDescription>
      </DialogHeader>

      {/* key remounts the form per order so fields re-seed without effects */}
      {order && (
        <FillerForm
          key={`${order.id}-${kind}`}
          order={order}
          kind={kind}
          onClose={onClose}
        />
      )}
    </DialogContent>
  </Dialog>
);
