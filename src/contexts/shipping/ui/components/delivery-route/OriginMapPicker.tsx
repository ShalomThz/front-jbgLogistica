import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// Vite bundles PNG imports as asset URLs — must re-wire Leaflet's default icon
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import { Loader2, MapPin, Search, X } from "lucide-react";
import { Button } from "@contexts/shared/shadcn";

// Module-level fix — runs once, keeps bundled icon paths correct
const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OriginPickerValue {
  latitude: number;
  longitude: number;
  placeId: string | null;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

const DEFAULT_CENTER: [number, number] = [19.4326, -99.1332]; // Mexico City

/** Pans the map when flyTo target changes — must live inside <MapContainer> */
const MapFlyTo = ({ target }: { target: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 15, { duration: 0.8 });
  }, [target, map]);
  return null;
};

/** Captures click events from the map canvas — must live inside <MapContainer> */
const MapClickHandler = ({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) => {
  useMapEvents({ click: (e) => onClick(e.latlng.lat, e.latlng.lng) });
  return null;
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  value: OriginPickerValue | null;
  onChange: (v: OriginPickerValue | null) => void;
  externalFlyTo?: [number, number] | null;
}

export const OriginMapPicker = ({ value, onChange, externalFlyTo }: Props) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (externalFlyTo) setFlyTo(externalFlyTo);
  }, [externalFlyTo]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const markerPos: [number, number] | null = value
    ? [value.latitude, value.longitude]
    : null;

  // Debounced Nominatim search
  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&accept-language=es&countrycodes=mx`,
          { headers: { "Accept-Language": "es" } },
        );
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handleSelectSuggestion = (s: NominatimResult) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setFlyTo([lat, lng]);
    setQuery(s.display_name.split(",").slice(0, 2).join(","));
    setShowSuggestions(false);
    onChange({ latitude: lat, longitude: lng, placeId: null });
  };

  const handleMapClick = (lat: number, lng: number) => {
    onChange({ latitude: lat, longitude: lng, placeId: null });
    setQuery("");
    setSuggestions([]);
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Address search */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Buscar dirección, colonia o lugar…"
            className="flex h-11 w-full rounded-md border border-input bg-background pl-9 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          {searching && (
            <Loader2 className="absolute right-8 size-4 animate-spin text-muted-foreground" />
          )}
          {(query || value) && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 size-8"
              onClick={handleClear}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 top-full z-[9999] mt-1 max-h-52 overflow-y-auto rounded-md border bg-background shadow-lg"
          >
            {suggestions.map((s) => {
              const [main, ...rest] = s.display_name.split(", ");
              return (
                <button
                  key={s.place_id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(s); }}
                  className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors"
                >
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{main}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {rest.slice(0, 3).join(", ")}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative h-[300px] sm:h-[340px] overflow-hidden rounded-lg border">
        <MapContainer
          center={markerPos ?? DEFAULT_CENTER}
          zoom={13}
          style={{ width: "100%", height: "100%" }}
          zoomControl
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapFlyTo target={flyTo} />
          <MapClickHandler onClick={handleMapClick} />
          {markerPos && <Marker position={markerPos} />}
        </MapContainer>

        {/* Overlay hint */}
        {!value && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center z-[1000]">
            <span className="flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1 text-xs text-white backdrop-blur-sm">
              <MapPin className="size-3" />
              Haz clic en el mapa para marcar el punto de salida
            </span>
          </div>
        )}
      </div>

      {/* Coordinate readout */}
      {value && (
        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs">
          <MapPin className="size-3.5 text-primary shrink-0" />
          <span className="font-mono text-muted-foreground">
            {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
          </span>
          <span className="ml-auto text-green-600 font-medium">✓ Punto seleccionado</span>
        </div>
      )}
    </div>
  );
};
