import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, UserPlus } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/shadcn";

interface ContactData {
  name: string;
  email: string;
  phone: string;
}

interface AddressData {
  country: string;
  address1: string;
  address2: string;
  zip: string;
  province: string;
  city: string;
  reference: string;
  geolocation: { latitude: number; longitude: number; placeId?: string };
}

interface SavedContact {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email: string;
  address: AddressData;
}

const MOCK_SAVED_SENDERS: SavedContact[] = [
  {
    id: "s-1",
    name: "JBG Logística - Centro",
    company: "JBG Logística",
    phone: "5512340000",
    email: "centro@jbg.com",
    address: { country: "México", address1: "Av. Central 100", address2: "", zip: "06000", province: "CDMX", city: "CDMX", reference: "Edificio azul", geolocation: { latitude: 19.4326, longitude: -99.1332 } },
  },
  {
    id: "s-2",
    name: "JBG Logística - Norte",
    company: "JBG Logística",
    phone: "5512340001",
    email: "norte@jbg.com",
    address: { country: "México", address1: "Blvd. Industrial 200", address2: "A", zip: "64000", province: "Nuevo León", city: "Monterrey", reference: "", geolocation: { latitude: 25.6866, longitude: -100.3161 } },
  },
];

const MOCK_SAVED_RECIPIENTS: SavedContact[] = [
  {
    id: "r-1",
    name: "Carlos Mendoza",
    phone: "5512345678",
    email: "carlos@email.com",
    address: { country: "México", address1: "Av. Reforma 123", address2: "", zip: "06600", province: "CDMX", city: "CDMX", reference: "Frente al parque", geolocation: { latitude: 19.4284, longitude: -99.1677 } },
  },
  {
    id: "r-2",
    name: "María López",
    phone: "5587654321",
    email: "maria@email.com",
    address: { country: "México", address1: "Calle Hidalgo 456", address2: "3B", zip: "64000", province: "Nuevo León", city: "Monterrey", reference: "", geolocation: { latitude: 25.6714, longitude: -100.3090 } },
  },
];

const COUNTRIES = ["México", "Estados Unidos", "Guatemala", "Belice", "Honduras"];

const MEXICO_STATES = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "CDMX", "Coahuila", "Colima", "Durango",
  "Estado de México", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco",
  "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla",
  "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora",
  "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
];

const emptyContact: ContactData = { name: "", email: "", phone: "" };
const emptyAddress: AddressData = { country: "México", address1: "", address2: "", zip: "", province: "", city: "", reference: "", geolocation: { latitude: 0, longitude: 0 } };

function ContactColumn({
  title,
  savedContacts,
  contact,
  address,
  saveContact,
  onContactChange,
  onAddressChange,
  onSaveContactToggle,
  onSelectSaved,
}: {
  title: string;
  savedContacts: SavedContact[];
  contact: ContactData;
  address: AddressData;
  saveContact: boolean;
  onContactChange: (c: ContactData) => void;
  onAddressChange: (a: AddressData) => void;
  onSaveContactToggle: (v: boolean) => void;
  onSelectSaved: (c: SavedContact) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = savedContacts.filter(
    (c) =>
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="size-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Saved contacts search */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-muted-foreground">
            {title}s guardados
          </Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder={`Buscar ${title.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {search && filtered.length > 0 && (
            <div className="rounded-md border max-h-40 overflow-y-auto">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                  onClick={() => {
                    onSelectSaved(c);
                    setSearch("");
                  }}
                >
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.phone}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {search && filtered.length === 0 && (
            <p className="text-xs text-muted-foreground">Sin resultados</p>
          )}
        </div>

        <Separator />

        {/* Personal data */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-muted-foreground">
            Datos personales
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor={`${title}-name`}>Nombre completo</Label>
              <Input
                id={`${title}-name`}
                placeholder="Nombre completo"
                value={contact.name}
                onChange={(e) => onContactChange({ ...contact, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor={`${title}-email`}>Correo electrónico</Label>
              <Input
                id={`${title}-email`}
                type="email"
                placeholder="correo@ejemplo.com"
                value={contact.email}
                onChange={(e) => onContactChange({ ...contact, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor={`${title}-phone`}>Teléfono</Label>
              <Input
                id={`${title}-phone`}
                placeholder="10 dígitos"
                value={contact.phone}
                onChange={(e) => onContactChange({ ...contact, phone: e.target.value })}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Address */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-muted-foreground">
            Dirección
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>País</Label>
              <Select
                value={address.country}
                onValueChange={(v) => onAddressChange({ ...address, country: v, province: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar país" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado / Provincia</Label>
              <Select
                value={address.province}
                onValueChange={(v) => onAddressChange({ ...address, province: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {address.country === "México"
                    ? MEXICO_STATES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))
                    : <SelectItem value="otro">Otro</SelectItem>
                  }
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor={`${title}-address1`}>Dirección línea 1</Label>
              <Input
                id={`${title}-address1`}
                placeholder="Calle y número exterior"
                value={address.address1}
                onChange={(e) => onAddressChange({ ...address, address1: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor={`${title}-address2`}>Dirección línea 2</Label>
              <Input
                id={`${title}-address2`}
                placeholder="Núm. interior, colonia, etc."
                value={address.address2}
                onChange={(e) => onAddressChange({ ...address, address2: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor={`${title}-zip`}>Código postal</Label>
              <Input
                id={`${title}-zip`}
                placeholder="5 dígitos"
                value={address.zip}
                onChange={(e) => onAddressChange({ ...address, zip: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor={`${title}-city`}>Ciudad</Label>
              <Input
                id={`${title}-city`}
                placeholder="Ciudad"
                value={address.city}
                onChange={(e) => onAddressChange({ ...address, city: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor={`${title}-ref`}>Referencias</Label>
              <Input
                id={`${title}-ref`}
                placeholder="Referencias de la dirección"
                value={address.reference}
                onChange={(e) => onAddressChange({ ...address, reference: e.target.value })}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Save toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor={`${title}-save`} className="text-sm">
            Guardar {title.toLowerCase()}
          </Label>
          <Switch
            id={`${title}-save`}
            checked={saveContact}
            onCheckedChange={onSaveContactToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export const NewOrderPage = () => {
  const navigate = useNavigate();

  const [senderContact, setSenderContact] = useState<ContactData>({ ...emptyContact });
  const [senderAddress, setSenderAddress] = useState<AddressData>({ ...emptyAddress });
  const [saveSender, setSaveSender] = useState(false);

  const [recipientContact, setRecipientContact] = useState<ContactData>({ ...emptyContact });
  const [recipientAddress, setRecipientAddress] = useState<AddressData>({ ...emptyAddress });
  const [saveRecipient, setSaveRecipient] = useState(false);

  const handleSelectSender = (c: SavedContact) => {
    setSenderContact({ name: c.name, email: c.email, phone: c.phone });
    setSenderAddress(c.address);
  };

  const handleSelectRecipient = (c: SavedContact) => {
    setRecipientContact({ name: c.name, email: c.email, phone: c.phone });
    setRecipientAddress(c.address);
  };

  const handleSubmit = () => {
    // TODO: integrate with API
    console.log({
      sender: { contact: senderContact, address: senderAddress, save: saveSender },
      recipient: { contact: recipientContact, address: recipientAddress, save: saveRecipient },
    });
    navigate("/orders");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/orders")}>
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-2xl font-bold">Nueva Orden</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContactColumn
          title="Remitente"
          savedContacts={MOCK_SAVED_SENDERS}
          contact={senderContact}
          address={senderAddress}
          saveContact={saveSender}
          onContactChange={setSenderContact}
          onAddressChange={setSenderAddress}
          onSaveContactToggle={setSaveSender}
          onSelectSaved={handleSelectSender}
        />

        <ContactColumn
          title="Destinatario"
          savedContacts={MOCK_SAVED_RECIPIENTS}
          contact={recipientContact}
          address={recipientAddress}
          saveContact={saveRecipient}
          onContactChange={setRecipientContact}
          onAddressChange={setRecipientAddress}
          onSaveContactToggle={setSaveRecipient}
          onSelectSaved={handleSelectRecipient}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate("/orders")}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit}>
          Crear Orden
        </Button>
      </div>
    </div>
  );
};
