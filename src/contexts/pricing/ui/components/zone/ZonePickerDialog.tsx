import { useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@contexts/shared/shadcn";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { CountrySelect } from "@contexts/shared/ui/components/CountrySelect";
import { useCountries } from "@contexts/shared/infrastructure/hooks/useCountries";
import { useZones } from "@contexts/pricing/infrastructure/hooks/zones/useZones";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Map,
  MapPin,
  Search,
} from "lucide-react";
import type { ZonePrimitives } from "@contexts/pricing/domain/schemas/zone/Zone";

type StepKey = "country" | "state" | "zone";

const STEPS: { key: StepKey; label: string; title: string }[] = [
  {
    key: "country",
    label: "País",
    title: "País donde se encuentra la zona",
  },
  {
    key: "state",
    label: "Estado",
    title: "Estado de la zona que estás buscando",
  },
  { key: "zone", label: "Zona", title: "Zonas disponibles" },
];

interface ZonePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (zone: ZonePrimitives) => void;
  /** Zona actual, para abrir el diálogo ya situado en su país y estado. */
  current?: ZonePrimitives | null;
}

/**
 * Elige la zona bajando por país → estado → zona, un paso por pantalla.
 *
 * En vez de un buscador de texto: los nombres de zona no son únicos ni
 * descriptivos ("Zona Centro" existe en varios estados), así que teclear no
 * desambigua — hay que saber antes de qué estado se habla.
 *
 * Y en vez de los tres niveles apilados: apilados, el diálogo crecía con cada
 * elección y lo que se iba a clickear se movía bajo el cursor. Un paso a la vez
 * mantiene el alto estable y deja una sola decisión en pantalla.
 */
export function ZonePickerDialog({
  open,
  onClose,
  onSelect,
  current,
}: ZonePickerDialogProps) {
  const [step, setStep] = useState<StepKey>("country");
  const [country, setCountry] = useState(current?.country ?? "MX");
  const [state, setState] = useState<string | null>(current?.state ?? null);
  const [search, setSearch] = useState("");

  const { countries } = useCountries();
  const countryName = useMemo(
    () => countries.find((c) => c.code === country)?.name ?? country,
    [countries, country],
  );

  // Zonas del país: de acá salen los estados y las zonas de cada uno. Una sola
  // consulta, acotada al país, en vez de una por nivel.
  const countryFilters = useMemo(
    () => [{ field: "country", filterOperator: "=" as const, value: country }],
    [country],
  );
  const { zones: countryZones, isLoading } = useZones({
    filters: countryFilters,
    limit: 200,
    enabled: open && !!country,
  });

  const states = useMemo(
    () =>
      [...new Set(countryZones.map((z) => z.state).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [countryZones],
  );

  const zonesInState = useMemo(() => {
    const inState = countryZones.filter((z) => z.state === state);
    const q = search.trim().toLowerCase();
    if (!q) return inState;

    return inState.filter(
      (z) =>
        z.name.toLowerCase().includes(q) ||
        z.description.toLowerCase().includes(q),
    );
  }, [countryZones, state, search]);

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const goToCountry = (code: string) => {
    setCountry(code);
    // "Jalisco" no significa nada con otro país.
    setState(null);
    setSearch("");
    setStep("state");
  };

  const goToState = (next: string) => {
    setState(next);
    setSearch("");
    setStep("zone");
  };

  const back = () => setStep(STEPS[stepIndex - 1].key);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      {/* Tres regiones: encabezado y pie fijos, contenido con el scroll.
          El diálogo mide lo que mide su contenido; solo cuando pasaría del 85%
          de la pantalla se topa y el scroll queda en el contenido, nunca en el
          diálogo entero. */}
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 gap-3 border-b px-6 py-4">
          <div className="space-y-1">
            <DialogTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4" />
              Elegir zona
            </DialogTitle>
            <DialogDescription className="text-xs">
              {STEPS[stepIndex].key === "zone"
                ? `Zonas disponibles en ${countryName} → ${state}`
                : STEPS[stepIndex].title}
            </DialogDescription>
          </div>

          {/* Migas: dónde vas y qué elegiste. Los pasos ya recorridos vuelven
              atrás con un clic, sin perder lo elegido después. Van en el
              encabezado porque son navegación, no contenido del paso. */}
          <div className="flex items-center gap-1 text-xs">
          {STEPS.map((s, i) => {
            const done = i < stepIndex;
            const value =
              s.key === "country" ? countryName : s.key === "state" ? state : null;

            return (
              <div key={s.key} className="flex min-w-0 items-center gap-1">
                {i > 0 && (
                  <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
                )}
                <button
                  type="button"
                  disabled={!done}
                  onClick={() => setStep(s.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors",
                    i === stepIndex && "bg-primary/10 font-medium text-primary",
                    done && "text-muted-foreground hover:bg-accent",
                    i > stepIndex && "text-muted-foreground/50",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                      i === stepIndex
                        ? "bg-primary text-primary-foreground"
                        : done
                          ? "bg-muted-foreground/20"
                          : "bg-muted",
                    )}
                  >
                    {done ? <Check className="size-2.5" /> : i + 1}
                  </span>
                  <span className="truncate">{(done && value) || s.label}</span>
                </button>
              </div>
            );
          })}
          </div>
        </DialogHeader>

        {/* La única región con scroll. `min-h-0` es lo que se lo permite: sin
            eso un hijo flex nunca se encoge por debajo de su contenido y el
            scroll se va al diálogo entero, llevándose el encabezado. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {step === "country" && <CountrySelect value={country} onChange={goToCountry} />}

          {step === "state" && (
            <>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : states.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 rounded-md border border-dashed p-4 text-center">
                  <Map className="size-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No hay zonas dadas de alta en {countryName}.
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={back}>
                    Elegir otro país
                  </Button>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {states.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => goToState(s)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                        s === state && "bg-accent font-medium",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Map className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{s}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {countryZones.filter((z) => z.state === s).length}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {step === "zone" && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nombre o descripción..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="space-y-0.5">
                {zonesInState.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => {
                      onSelect(zone);
                      onClose();
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                      zone.id === current?.id && "bg-accent",
                    )}
                  >
                    <Check
                      className={cn(
                        "size-4 shrink-0 text-primary",
                        zone.id === current?.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{zone.name}</span>
                      {zone.description && (
                        <span className="truncate text-xs text-muted-foreground">
                          {zone.description}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
                {zonesInState.length === 0 && (
                  <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                    {search.trim()
                      ? "Ninguna zona coincide con la búsqueda."
                      : `No hay zonas en ${state}.`}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-4 sm:justify-between">
          {stepIndex > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={back}
              className="gap-1.5"
            >
              <ArrowLeft className="size-4" />
              Atrás
            </Button>
          ) : (
            <span />
          )}
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
