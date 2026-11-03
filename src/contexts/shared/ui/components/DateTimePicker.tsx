import {
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { es } from "date-fns/locale";
import { CalendarClock } from "lucide-react";
import { useState } from "react";

/**
 * El valor es el texto de un `datetime-local` —`YYYY-MM-DDTHH:mm`, en hora
 * local—, o `""` para "ahora". Así lo leen `occurredAtFromInput` y
 * `occurredAtToInput`.
 */
interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Lo más temprano que se puede elegir, en el mismo formato. */
  min?: string;
  /**
   * Sin popover propio, para ir dentro de otro (el lápiz del historial). Ahí
   * siempre hay una hora: no ofrece "ahora".
   */
  inline?: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");

const HOURS = Array.from({ length: 24 }, (_, h) => pad(h));
const MINUTES = Array.from({ length: 60 }, (_, m) => pad(m));

/** Sin segundos ni zona: lo que maneja el valor. */
const toValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

/** El texto del valor como fecha local (`new Date` lo lee así sin zona). */
const fromValue = (value: string) => new Date(value);

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const sameDay = (a: Date, b: Date) =>
  startOfDay(a).getTime() === startOfDay(b).getTime();

const formatValue = (value: string) =>
  fromValue(value).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Fecha con el calendario de shadcn y hora con dos selects. Nunca queda a medio
 * llenar: al elegir el día, la hora se completa sola. Lo futuro va
 * deshabilitado —el back lo rechaza—, y también lo anterior a `min`.
 */
export const DateTimePicker = ({ id, value, onChange, min, inline }: Props) => {
  const [open, setOpen] = useState(false);

  const picker = (
    <DateTimeFields value={value} onChange={onChange} min={min} />
  );

  if (inline) return picker;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className="w-full justify-start font-normal"
        >
          <CalendarClock className="mr-2 size-4 text-muted-foreground" />
          {value ? (
            formatValue(value)
          ) : (
            <span className="text-muted-foreground">Ahora</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto space-y-3 p-3" align="start">
        {picker}
        <div className="flex justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            Usar ahora
          </Button>
          <Button type="button" size="sm" onClick={() => setOpen(false)}>
            Listo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const DateTimeFields = ({
  value,
  onChange,
  min,
}: Pick<Props, "value" | "onChange" | "min">) => {
  const now = new Date();
  const minDate = min ? fromValue(min) : null;
  const selected = value ? fromValue(value) : null;

  /** La hora más cercana a `wanted` que cabe en el día: ni futura ni antes
   * de `min`. */
  const clampToDay = (wanted: Date): Date => {
    if (wanted > now) return now;
    if (minDate && wanted < minDate) return minDate;
    return wanted;
  };

  const pickDay = (day: Date | undefined) => {
    if (!day) return;
    // Conserva la hora ya elegida; sin una, la de ahora.
    const time = selected ?? now;
    const wanted = new Date(day);
    wanted.setHours(time.getHours(), time.getMinutes(), 0, 0);
    onChange(toValue(clampToDay(wanted)));
  };

  const pickTime = (hours: number, minutes: number) => {
    const base = new Date(selected ?? now);
    base.setHours(hours, minutes, 0, 0);
    onChange(toValue(clampToDay(base)));
  };

  // Las horas y minutos que no caben en el día elegido van deshabilitados.
  const isToday = !!selected && sameDay(selected, now);
  const isMinDay = !!selected && !!minDate && sameDay(selected, minDate);
  const outOfRange = (hours: number, minutes: number) =>
    (isToday &&
      hours * 60 + minutes > now.getHours() * 60 + now.getMinutes()) ||
    (isMinDay &&
      minDate !== null &&
      hours * 60 + minutes < minDate.getHours() * 60 + minDate.getMinutes());

  const hours = selected?.getHours() ?? null;
  const minutes = selected?.getMinutes() ?? null;

  return (
    <div className="space-y-3">
      <Calendar
        mode="single"
        locale={es}
        selected={selected ?? undefined}
        onSelect={pickDay}
        defaultMonth={selected ?? now}
        disabled={[
          { after: now },
          ...(minDate ? [{ before: startOfDay(minDate) }] : []),
        ]}
        className="p-0"
      />
      <div className={cn("flex items-center gap-2", !selected && "opacity-50")}>
        <Select
          disabled={!selected}
          value={hours === null ? "" : pad(hours)}
          onValueChange={(h) => pickTime(Number(h), minutes ?? 0)}
        >
          <SelectTrigger className="w-20" aria-label="Hora">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {HOURS.map((h) => (
              <SelectItem
                key={h}
                value={h}
                // Una hora cabe si alguno de sus minutos cabe.
                disabled={outOfRange(Number(h), 0) && outOfRange(Number(h), 59)}
              >
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">:</span>
        <Select
          disabled={!selected}
          value={minutes === null ? "" : pad(minutes)}
          onValueChange={(m) => pickTime(hours ?? 0, Number(m))}
        >
          <SelectTrigger className="w-20" aria-label="Minutos">
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {MINUTES.map((m) => (
              <SelectItem
                key={m}
                value={m}
                disabled={hours !== null && outOfRange(hours, Number(m))}
              >
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!selected && (
          <span className="text-xs text-muted-foreground">Elige el día</span>
        )}
      </div>
    </div>
  );
};
