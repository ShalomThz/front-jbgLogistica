import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RoutePrimitives } from "../../../domain/schemas/route/Route";
import { decodePolyline } from "../../../domain/services/decodePolyline";

interface RouteMapProps {
  route: RoutePrimitives;
}

const STOP_COLORS: Record<string, string> = {
  PENDING: "#3b82f6",
  DELIVERED: "#16a34a",
  FAILED: "#f59e0b",
  RETURNED: "#dc2626",
};

/** Round pin with a number/letter, colored by stop status */
const pinIcon = (label: string, color: string) =>
  L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:9999px;background:${color};color:#fff;font-size:11px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)">${label}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

/** Fits the viewport to every point of the route — must live inside the map */
const FitToRoute = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
  }, [map, points]);
  return null;
};

/**
 * Route viewer on Leaflet + OpenStreetMap — no Google key required to render.
 * Draws the Routes API polyline when the route was optimized; otherwise a
 * dashed straight line following the current stop order.
 */
export const RouteMap = ({ route }: RouteMapProps) => {
  const origin: [number, number] = [
    route.origin.latitude,
    route.origin.longitude,
  ];

  const orderedStops = useMemo(
    () => [...route.stops].sort((a, b) => a.stopOrder - b.stopOrder),
    [route.stops],
  );

  const optimizedPath = useMemo(
    () =>
      route.mapsMetadata?.polyline
        ? decodePolyline(route.mapsMetadata.polyline)
        : [],
    [route.mapsMetadata?.polyline],
  );

  // Without an optimized polyline, connect origin → stops → back to origin
  // (routes are round trips, matching the optimizer)
  const fallbackPath = useMemo<[number, number][]>(
    () => [
      origin,
      ...orderedStops.map(
        (s): [number, number] => [
          s.address.geolocation.latitude,
          s.address.geolocation.longitude,
        ],
      ),
      origin,
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [route.origin.latitude, route.origin.longitude, orderedStops],
  );

  const boundsPoints = optimizedPath.length > 0 ? optimizedPath : fallbackPath;

  return (
    <MapContainer
      center={origin}
      zoom={13}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToRoute points={boundsPoints} />

      {/* Origin — warehouse / departure point */}
      <Marker position={origin} icon={pinIcon("O", "#0f172a")}>
        <Tooltip direction="top" offset={[0, -10]}>
          Origen de la ruta
        </Tooltip>
      </Marker>

      {/* Numbered stops, colored by status */}
      {orderedStops.map((stop) => (
        <Marker
          key={stop.id}
          position={[
            stop.address.geolocation.latitude,
            stop.address.geolocation.longitude,
          ]}
          icon={pinIcon(
            String(stop.stopOrder),
            STOP_COLORS[stop.status] ?? "#3b82f6",
          )}
        >
          <Tooltip direction="top" offset={[0, -10]}>
            #{stop.stopOrder} · {stop.address.address1}, {stop.address.city}
          </Tooltip>
        </Marker>
      ))}

      {optimizedPath.length > 0 ? (
        <Polyline
          positions={optimizedPath}
          pathOptions={{ color: "#3b82f6", weight: 4, opacity: 0.85 }}
        />
      ) : (
        orderedStops.length > 0 && (
          <Polyline
            positions={fallbackPath}
            pathOptions={{
              color: "#94a3b8",
              weight: 3,
              opacity: 0.7,
              dashArray: "8 8",
            }}
          />
        )
      )}
    </MapContainer>
  );
};
