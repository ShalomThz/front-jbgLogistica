import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/shadcn";
import type { RoutePrimitives, RouteStatus } from "../../../domain";

const ROUTE_STATUSES: RouteStatus[] = ["PLANNED", "ACTIVE", "COMPLETED"];

const STATUS_LABELS: Record<RouteStatus, string> = {
  PLANNED: "Planeada",
  ACTIVE: "Activa",
  COMPLETED: "Completada",
};

type RouteFormData = Omit<RoutePrimitives, "id" | "createdAt" | "updatedAt" | "stops" | "mapsMetadata">;

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: RouteFormData) => void;
  route?: RoutePrimitives | null;
}

export const DeliveryRouteFormDialog = ({ open, onClose, onSave, route }: Props) => {
  const [driverId, setDriverId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [status, setStatus] = useState<RouteStatus>("PLANNED");
  const [finishDate, setFinishDate] = useState("");

  useEffect(() => {
    if (open) {
      if (route) {
        setDriverId(route.driverId);
        setLatitude(route.origin.latitude.toString());
        setLongitude(route.origin.longitude.toString());
        setPlaceId(route.origin.placeId || "");
        setStatus(route.status);
        setFinishDate(route.finishDate ? new Date(route.finishDate).toISOString().split("T")[0] : "");
      } else {
        setDriverId("");
        setLatitude("");
        setLongitude("");
        setPlaceId("");
        setStatus("PLANNED");
        setFinishDate("");
      }
    }
  }, [open, route]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      driverId,
      origin: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        placeId: placeId || null,
      },
      status,
      finishDate: finishDate ? new Date(finishDate) : null,
    });
  };

  const isEdit = !!route;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Ruta" : "Crear Ruta"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifica los datos de la ruta." : "Ingresa los datos de la nueva ruta."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="driverId">ID de Conductor *</Label>
            <Input
              id="driverId"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              placeholder="DRV-001"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitud *</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="19.4326"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitud *</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="-99.1332"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="placeId">Place ID (Google Maps)</Label>
            <Input
              id="placeId"
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
            />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as RouteStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROUTE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {status === "COMPLETED" && (
            <div className="space-y-2">
              <Label htmlFor="finishDate">Fecha de Finalización</Label>
              <Input
                id="finishDate"
                type="date"
                value={finishDate}
                onChange={(e) => setFinishDate(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
