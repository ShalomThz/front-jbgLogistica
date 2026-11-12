import { useState } from "react";
import { es } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import {
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@contexts/shared/shadcn";
import {
  departureFromInput,
  departureToInput,
  formatDeparture,
} from "@contexts/consolidation/domain/departureDate";

interface Props {
  id?: string;
  /** `YYYY-MM-DD` en hora local, o `""` sin fecha. */
  value: string;
  onChange: (value: string) => void;
}

/** Día de salida con el calendario de shadcn. A diferencia de
 * `DateTimePicker` (eventos que ya pasaron), aquí lo normal es una fecha
 * futura, y la fecha es opcional. */
export const DepartureDatePicker = ({ id, value, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const iso = departureFromInput(value);
  const selected = iso ? new Date(iso) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className="w-full justify-start font-normal"
        >
          <CalendarDays className="mr-2 size-4 text-muted-foreground" />
          {iso ? formatDeparture(iso) : <span className="text-muted-foreground">Sin fecha</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto space-y-3 p-3" align="start">
        <Calendar
          mode="single"
          locale={es}
          selected={selected}
          defaultMonth={selected ?? new Date()}
          onSelect={(day) => {
            if (!day) return;
            onChange(departureToInput(day.toISOString()));
            setOpen(false);
          }}
          className="p-0"
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            Quitar fecha
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
};
