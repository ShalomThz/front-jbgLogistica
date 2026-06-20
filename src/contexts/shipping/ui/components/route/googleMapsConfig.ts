import type { Libraries } from "@react-google-maps/api";

// Must be module-level — @react-google-maps/api watches reference stability.
// Adding "places" here enables Autocomplete in CreateRouteDialog without breaking RouteMap.
export const GOOGLE_MAPS_LIBRARIES: Libraries = ["places", "geometry"];

export const GOOGLE_MAPS_API_KEY = import.meta.env
  .VITE_GOOGLE_MAPS_API_KEY as string;
