import { useMemo } from "react";
import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";
import type { Libraries } from "@react-google-maps/api";
import type { RoutePrimitives } from "../../../domain/schemas/route/Route";

// IMPORTANT: must be module-level to avoid remount on every render
const LIBRARIES: Libraries = ["geometry"];

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };

const DEFAULT_ZOOM = 12;

interface RouteMapProps {
  route: RoutePrimitives;
}

export const RouteMap = ({ route }: RouteMapProps) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: LIBRARIES,
  });

  const center = useMemo(
    () => ({
      lat: route.origin.latitude,
      lng: route.origin.longitude,
    }),
    [route.origin.latitude, route.origin.longitude],
  );

  // Decode the Google-encoded polyline once the Maps geometry library is ready
  const decodedPath = useMemo(() => {
    if (!isLoaded || !route.mapsMetadata?.polyline) return [];
    return window.google.maps.geometry.encoding
      .decodePath(route.mapsMetadata.polyline)
      .map((latLng) => ({ lat: latLng.lat(), lng: latLng.lng() }));
  }, [isLoaded, route.mapsMetadata?.polyline]);

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No se pudo cargar Google Maps. Revisa tu API key.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Cargando mapa…
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={center}
      zoom={DEFAULT_ZOOM}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      {/* Origin marker — warehouse / departure point */}
      <Marker
        position={center}
        title="Origen de la ruta"
        label={{ text: "O", color: "#ffffff", fontWeight: "bold" }}
      />

      {/* Optimized route polyline */}
      {decodedPath.length > 0 && (
        <Polyline
          path={decodedPath}
          options={{
            strokeColor: "#3b82f6",
            strokeWeight: 4,
            strokeOpacity: 0.85,
          }}
        />
      )}
    </GoogleMap>
  );
};
