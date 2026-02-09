import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
} from "@/shared/shadcn";
import { ArrowLeft, ChevronDown, Edit, Package, Search, Truck, UserPlus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userRepository } from "../../../iam";

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

interface PackageData {
  productSearch: string;
  packageType: string;
  length: string;
  width: string;
  height: string;
  weight: string;
  quantity: string;
  productType: string;
  savePackage: boolean;
}

interface SavedProduct {
  id: string;
  name: string;
  description?: string;
  packageType: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  weight: number;
}

interface ShippingRate {
  id: string;
  courier: string;
  service: string;
  logo: string;
  deliveryTime: string;
  deliveryDate: string;
  serviceType: string;
  price: number;
  currency: string;
  isBestPrice?: boolean;
}

interface ShippingService {
  selectedRate: ShippingRate | null;
  sosProtection: boolean;
  sosValue: string;
  declaredValue: string;
}

interface OrderData {
  orderNumber: string;
  orderPartnerNumber: string;
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

const MOCK_SAVED_PRODUCTS: SavedProduct[] = [
  {
    id: "p-1",
    name: "Documentos A4",
    description: "Sobre manila con documentos",
    packageType: "sobre",
    dimensions: { length: 30, width: 21, height: 1 },
    weight: 0.2,
  },
  {
    id: "p-2",
    name: "Caja estándar",
    description: "Caja de cartón corrugado",
    packageType: "caja",
    dimensions: { length: 40, width: 30, height: 20 },
    weight: 2.5,
  },
];

const MOCK_SHIPPING_RATES: ShippingRate[] = [
  {
    id: "dhl-express",
    courier: "DHL",
    service: "Express",
    logo: "🚚",
    deliveryTime: "1 día hábil",
    deliveryDate: "Mar - 10/feb/26",
    serviceType: "Dejar en sucursal, Recolección",
    price: 183.28,
    currency: "MXN",
  },
  {
    id: "dhl-standard",
    courier: "DHL",
    service: "Standard",
    logo: "🚚",
    deliveryTime: "1 día hábil",
    deliveryDate: "Mar - 10/feb/26",
    serviceType: "Dejar en sucursal, Recolección",
    price: 183.28,
    currency: "MXN",
  },
  {
    id: "tresguerras",
    courier: "TRESGUERRAS",
    service: "Standard",
    logo: "📦",
    deliveryTime: "5 días hábiles",
    deliveryDate: "Sáb - 14/feb/26",
    serviceType: "Dejar en sucursal, Recolección",
    price: 423.00,
    currency: "MXN",
  },
  {
    id: "paquetexpress",
    courier: "Paquetexpress",
    service: "Nacional",
    logo: "📮",
    deliveryTime: "6 días hábiles",
    deliveryDate: "Dom - 15/feb/26",
    serviceType: "Dejar en sucursal, Recolección",
    price: 194.83,
    currency: "MXN",
  },
  {
    id: "fedex-saver",
    courier: "FedEx",
    service: "Express saver",
    logo: "✈️",
    deliveryTime: "2 días hábiles",
    deliveryDate: "Mié - 11/feb/26",
    serviceType: "Dejar en sucursal, Recolección",
    price: 153.12,
    currency: "MXN",
    isBestPrice: true,
  },
];

const PACKAGE_TYPES = [
  "Sobre",
  "Caja",
  "Paquete",
  "Cilindro",
  "Irregular",
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
const emptyPackage: PackageData = {
  productSearch: "",
  packageType: "",
  length: "",
  width: "",
  height: "",
  weight: "",
  quantity: "1",
  productType: "",
  savePackage: false,
};
const emptyShipping: ShippingService = {
  selectedRate: null,
  sosProtection: true,
  sosValue: "1600.00",
  declaredValue: "",
};
const emptyOrder: OrderData = {
  orderNumber: "",
  orderPartnerNumber: "",
};

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
                <SelectTrigger className="w-full">
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
  const [step, setStep] = useState<"contact" | "package" | "rate">("contact");

  const navigate = useNavigate();
  

  // Initialize with some test data to better show the rate step
  const [senderContact, setSenderContact] = useState<ContactData>({
    name: "JOEL AGUILAR AGUILAR LOPEZ",
    email: "joel@jbg.com",
    phone: "+529517425948"
  });
  const [senderAddress, setSenderAddress] = useState<AddressData>({
    country: "México",
    address1: "CALLE- JASMINES #108, El Arroyo, CP",
    address2: "68140",
    zip: "68140",
    province: "Oaxaca",
    city: "Oaxaca de Juárez",
    reference: "jbg-12337",
    geolocation: { latitude: 17.0732, longitude: -96.7266 }
  });
  const [saveSender, setSaveSender] = useState(false);

  const [recipientContact, setRecipientContact] = useState<ContactData>({
    name: "ADA LIDIA HERNANDEZ ARROYO",
    email: "ada@example.com",
    phone: "+525514439002"
  });
  const [recipientAddress, setRecipientAddress] = useState<AddressData>({
    country: "México",
    address1: "BAMBU MZ 7 LT-27 IZCUILLA",
    address2: "Santiago Acahualtepec 2a. Ampliación,",
    zip: "09609",
    province: "Ciudad de México",
    city: "Iztapalapa",
    reference: "jbg-10580",
    geolocation: { latitude: 19.3573, longitude: -99.0368 }
  });
  const [saveRecipient, setSaveRecipient] = useState(false);

  const [packageData, setPackageData] = useState<PackageData>({ ...emptyPackage });
  const [activeTab, setActiveTab] = useState<"dimensions" | "recommendation">("dimensions");

  const [shippingService, setShippingService] = useState<ShippingService>({ ...emptyShipping });
  const [orderData, setOrderData] = useState<OrderData>({ ...emptyOrder });

  const handleSelectSender = (c: SavedContact) => {
    setSenderContact({ name: c.name, email: c.email, phone: c.phone });
    setSenderAddress(c.address);
  };

  const handleSelectRecipient = (c: SavedContact) => {
    setRecipientContact({ name: c.name, email: c.email, phone: c.phone });
    setRecipientAddress(c.address);
  };

  const handleSelectProduct = (product: SavedProduct) => {
    setPackageData({
      ...packageData,
      productSearch: product.name,
      packageType: product.packageType,
      length: product.dimensions.length.toString(),
      width: product.dimensions.width.toString(),
      height: product.dimensions.height.toString(),
      weight: product.weight.toString(),
    });
  };

  const calculateVolumetricWeight = () => {
    const l = parseFloat(packageData.length) || 0;
    const w = parseFloat(packageData.width) || 0;
    const h = parseFloat(packageData.height) || 0;
    return (l * w * h) / 5000; // Standard divisor for volumetric weight
  };

  const calculateBillableWeight = () => {
    const actualWeight = parseFloat(packageData.weight) || 0;
    const volumetricWeight = calculateVolumetricWeight();
    return Math.max(actualWeight, volumetricWeight);
  };

  const calculateTotal = () => {
    const shippingPrice = shippingService.selectedRate?.price || 0;
    const sosPrice = shippingService.sosProtection ? 14.00 : 0;
    return shippingPrice + sosPrice;
  };

  const handleRateSelection = (rate: ShippingRate) => {
    setShippingService({ ...shippingService, selectedRate: rate });
  };

  const handleSubmit = () => {
    // TODO: integrate with API
    console.log({
      order: orderData,
      sender: { contact: senderContact, address: senderAddress, save: saveSender },
      recipient: { contact: recipientContact, address: recipientAddress, save: saveRecipient },
      package: packageData,
      shipping: shippingService,
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

      {(step === "contact") && (
        <>
          {/* Order Information */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Información de la Orden</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="order-number">Número de Orden</Label>
                  <Input
                    id="order-number"
                    placeholder="Ej: ORD-001234"
                    value={orderData.orderNumber}
                    onChange={(e) => setOrderData({ ...orderData, orderNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="partner-number">Número de Socio/Partner</Label>
                  <Input
                    id="partner-number"
                    placeholder="Ej: PART-567890"
                    value={orderData.orderPartnerNumber}
                    onChange={(e) => setOrderData({ ...orderData, orderPartnerNumber: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

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
        </>
      )}

      {(step === "package") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Package Configuration */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="size-4" />
                  Dimensiones y tipo de producto
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Medidas, peso y contenido del paquete
                </p>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {/* Saved Products */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">
                    Productos guardados
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Busca o selecciona un producto"
                      value={packageData.productSearch}
                      onChange={(e) => setPackageData({ ...packageData, productSearch: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                  {packageData.productSearch && (
                    <div className="rounded-md border max-h-40 overflow-y-auto">
                      {MOCK_SAVED_PRODUCTS
                        .filter((p) =>
                          p.name.toLowerCase().includes(packageData.productSearch.toLowerCase())
                        )
                        .map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                            onClick={() => {
                              handleSelectProduct(product);
                            }}
                          >
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-muted-foreground">{product.description}</div>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "dimensions"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    onClick={() => setActiveTab("dimensions")}
                  >
                    Dimensiones del paquete
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "recommendation"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    onClick={() => setActiveTab("recommendation")}
                  >
                    <Badge variant="secondary" className="ml-2">Recomendación</Badge>
                  </button>
                </div>

                {activeTab === "dimensions" && (
                  <div className="space-y-4">
                    {/* Package Type */}
                    <div>
                      <Label>Tipo de embalaje *</Label>
                      <Select
                        value={packageData.packageType}
                        onValueChange={(v) => setPackageData({ ...packageData, packageType: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {PACKAGE_TYPES.map((type) => (
                            <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dimensions */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="length">Largo *</Label>
                        <div className="relative">
                          <Input
                            id="length"
                            placeholder="0"
                            value={packageData.length}
                            onChange={(e) => setPackageData({ ...packageData, length: e.target.value })}
                            className="pr-8"
                          />
                          <span className="absolute right-2.5 top-2.5 text-sm text-muted-foreground">cm</span>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="width">Ancho *</Label>
                        <div className="relative">
                          <Input
                            id="width"
                            placeholder="0"
                            value={packageData.width}
                            onChange={(e) => setPackageData({ ...packageData, width: e.target.value })}
                            className="pr-8"
                          />
                          <span className="absolute right-2.5 top-2.5 text-sm text-muted-foreground">cm</span>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="height">Alto *</Label>
                        <div className="relative">
                          <Input
                            id="height"
                            placeholder="0"
                            value={packageData.height}
                            onChange={(e) => setPackageData({ ...packageData, height: e.target.value })}
                            className="pr-8"
                          />
                          <span className="absolute right-2.5 top-2.5 text-sm text-muted-foreground">cm</span>
                        </div>
                      </div>
                    </div>

                    {/* Weight */}
                    <div>
                      <Label htmlFor="weight">Peso *</Label>
                      <div className="relative">
                        <Input
                          id="weight"
                          placeholder="0"
                          value={packageData.weight}
                          onChange={(e) => setPackageData({ ...packageData, weight: e.target.value })}
                          className="pr-8"
                        />
                        <span className="absolute right-2.5 top-2.5 text-sm text-muted-foreground">kg</span>
                      </div>
                    </div>

                    {/* Weight Calculations */}
                    {(packageData.length && packageData.width && packageData.height) && (
                      <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                        <h4 className="font-medium text-sm">Cálculo de las dimensiones</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Peso masa</div>
                            <div className="font-medium">{packageData.weight || 0} kg</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Peso volumétrico</div>
                            <div className="font-medium">{calculateVolumetricWeight().toFixed(2)} kg</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Peso a cotizar</div>
                            <div className="font-medium">{calculateBillableWeight().toFixed(2)} kg</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quantity */}
                    <div>
                      <Label htmlFor="quantity">Cantidad de paquetes</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={packageData.quantity}
                        onChange={(e) => setPackageData({ ...packageData, quantity: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {activeTab === "recommendation" && (
                  <div className="space-y-4 py-8 text-center text-muted-foreground">
                    <Package className="size-12 mx-auto opacity-50" />
                    <p>Las recomendaciones aparecerán aquí basadas en las dimensiones ingresadas</p>
                  </div>
                )}

                <Separator />

                {/* Product Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">
                    Tipo de producto
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Busca y selecciona qué tipo de producto enviarás
                  </p>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Busca por palabra clave o núm. de producto"
                      value={packageData.productType}
                      onChange={(e) => setPackageData({ ...packageData, productType: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Save Package */}
                <div className="flex items-center justify-between pt-2">
                  <Label htmlFor="save-package" className="text-sm">
                    Guardar dimensiones y tipo de producto
                  </Label>
                  <Switch
                    id="save-package"
                    checked={packageData.savePackage}
                    onCheckedChange={(v) => setPackageData({ ...packageData, savePackage: v })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shipping Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resumen de envío</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {/* Sender Summary */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">Remitente</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep("contact")}
                      className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                    >
                      <Edit className="size-3 mr-1" />
                      Editar
                    </Button>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="font-medium">{senderContact.name || "Sin nombre"}</div>
                    <div className="text-muted-foreground">{senderContact.phone || "Sin teléfono"}</div>
                    {senderAddress.address1 && (
                      <div className="text-muted-foreground text-xs">
                        {senderAddress.address1}
                        {senderAddress.address2 && `, ${senderAddress.address2}`}
                        <br />
                        {senderAddress.zip} {senderAddress.city}, {senderAddress.province}
                        <br />
                        {senderAddress.country}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Recipient Summary */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">Destinatario</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep("contact")}
                      className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                    >
                      <Edit className="size-3 mr-1" />
                      Editar
                    </Button>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="font-medium">{recipientContact.name || "Sin nombre"}</div>
                    <div className="text-muted-foreground">{recipientContact.phone || "Sin teléfono"}</div>
                    {recipientAddress.address1 && (
                      <div className="text-muted-foreground text-xs">
                        {recipientAddress.address1}
                        {recipientAddress.address2 && `, ${recipientAddress.address2}`}
                        <br />
                        {recipientAddress.zip} {recipientAddress.city}, {recipientAddress.province}
                        <br />
                        {recipientAddress.country}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {(step === "rate") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rate Selection */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("package")}
                className="p-0 h-auto text-sm text-primary hover:text-primary/80"
              >
                <ArrowLeft className="size-3 mr-1" />
                Regresar
              </Button>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="size-4" />
                  Selecciona un servicio de paquetería
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 pt-0">
                {/* Headers */}
                <div className="grid grid-cols-12 gap-3 pb-3 text-xs font-medium text-muted-foreground border-b">
                  <div className="col-span-2">Paquetería</div>
                  <div className="col-span-3">Entrega estimada</div>
                  <div className="col-span-4">Envío de paquetes</div>
                  <div className="col-span-3 text-right">Precio</div>
                </div>

                {/* Rate Options */}
                <div className="space-y-0">
                  {MOCK_SHIPPING_RATES.map((rate) => (
                    <div
                      key={rate.id}
                      className={`grid grid-cols-12 gap-3 py-4 border-b cursor-pointer transition-colors ${shippingService.selectedRate?.id === rate.id
                        ? "bg-primary/5 border-primary"
                        : "hover:bg-muted/50"
                        }`}
                      onClick={() => handleRateSelection(rate)}
                    >
                      <div className="col-span-2 flex items-center gap-2">
                        <div className="text-lg">{rate.logo}</div>
                        <div>
                          <div className="font-medium text-sm">{rate.courier}</div>
                          <div className="text-xs text-muted-foreground">{rate.service}</div>
                        </div>
                      </div>

                      <div className="col-span-3 flex items-center">
                        <div>
                          <div className="font-medium text-sm">{rate.deliveryTime}</div>
                          <div className="text-xs text-muted-foreground">{rate.deliveryDate}</div>
                        </div>
                      </div>

                      <div className="col-span-4 flex items-center">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Dejar en sucursal</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Recolección</span>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-3 flex items-center justify-end">
                        <div className="text-right">
                          <div className="font-bold">${rate.price.toFixed(2)} {rate.currency}</div>
                          {rate.isBestPrice && (
                            <Badge variant="secondary" className="text-xs">Mejor precio</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shipping Summary */}
          <div className="space-y-4">
            {/* Shipping Details */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Resumen de envío</CardTitle>
                  <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                    <ChevronDown className="size-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Detalles del servicio</CardTitle>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                      <ChevronDown className="size-3" />
                    </Button>
                  </div>

                  {shippingService.selectedRate && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="text-lg">{shippingService.selectedRate.logo}</div>
                        <div>
                          <div className="font-medium text-sm">{shippingService.selectedRate.courier}</div>
                          <div className="text-xs text-muted-foreground">{shippingService.selectedRate.service}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                          Dejar en sucursal
                        </Button>
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="font-medium">Horarios</div>
                        <div className="text-muted-foreground">
                          - Lun a Vie de 9:00 am a 7:00 pm y Sáb 10:00 am a 2:00 pm.
                        </div>

                        <div className="mt-2">
                          <div className="font-medium">🔄 Recolección programada</div>
                          <div className="text-muted-foreground">
                            - Solicítala antes de las 12:00 pm para que suceda el mismo día.
                            - Si la solicitas más tarde, se hará el día hábil siguiente.
                          </div>
                        </div>

                        <div className="mt-2 text-muted-foreground">
                          Para programar una recolección hazlo en la sección de Recolecciones.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* SOS Protection */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={shippingService.sosProtection}
                    onCheckedChange={(checked) =>
                      setShippingService({ ...shippingService, sosProtection: !!checked })
                    }
                  />
                  <div className="space-y-2 flex-1">
                    <div className="font-medium text-sm">SOS Protección</div>
                    <div className="text-xs text-muted-foreground">
                      Protege el envío ante robo, daño y más. Al usar la opción, aceptas los{" "}
                      <Button variant="link" className="h-auto p-0 text-xs text-blue-600">
                        términos y condiciones
                      </Button>
                      .
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Valor declarado</Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">$</span>
                        <Input
                          value={shippingService.sosValue}
                          onChange={(e) => setShippingService({ ...shippingService, sosValue: e.target.value })}
                          className="pl-6 text-xs"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Declara un valor entre $100 MXN y $100,000 MXN.
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {shippingService.selectedRate && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Precio del envío</span>
                        <span>${shippingService.selectedRate.price.toFixed(2)} MXN</span>
                      </div>

                      {shippingService.sosProtection && (
                        <div className="flex justify-between text-sm">
                          <span>SOS Protección</span>
                          <span>$14.00 MXN</span>
                        </div>
                      )}

                      <Separator />

                      <div className="flex justify-between font-bold">
                        <span>Monto total:</span>
                        <div className="text-right">
                          <div className="text-blue-600">${calculateTotal().toFixed(2)} MXN</div>
                          <div className="text-xs text-muted-foreground">(Incluye IVA)</div>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={handleSubmit}
                      >
                        Crear envío
                      </Button>
                    </>
                  )}

                  {!shippingService.selectedRate && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Selecciona un servicio para ver el total
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        {(step !== "rate") && (
          <>
            <Button variant="outline" onClick={() => navigate("/orders")}>
              Cancelar
            </Button>
            <Button onClick={() => {
              if (step === "contact") {
                setStep("package");
              } else if (step === "package") {
                setStep("rate");
              }
            }}>
              {step === "contact" ? "Siguiente" : step === "package" ? "Cotizar" : "Crear Orden"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
