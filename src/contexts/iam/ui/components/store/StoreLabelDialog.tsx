import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tag, Info } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@contexts/shared/shadcn";
import type { StoreListViewPrimitives } from "@contexts/iam/domain/schemas/store/StoreListView";
import type { z } from "zod";
import {
  editStoreAgentLabelBrandingSchema,
  type EditStoreAgentLabelBrandingPrimitives,
} from "@contexts/iam/application/store/CreateStoreRequest";
import { StoreLabelColorInput } from "./StoreLabelColorInput";
import { StoreLabelLogoInput } from "./StoreLabelLogoInput";

const DEFAULT_BANNER_COLOR = "#2B5C8F";
const DEFAULT_CP_BOX_COLOR = "#333333";

type LabelFormInput = z.input<typeof editStoreAgentLabelBrandingSchema>;

interface Props {
  store: StoreListViewPrimitives | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: EditStoreAgentLabelBrandingPrimitives) => Promise<void> | void;
  isLoading?: boolean;
}

export const StoreLabelDialog = ({
  store,
  open,
  onClose,
  onSave,
  isLoading,
}: Props) => {
  const form = useForm<LabelFormInput, unknown, EditStoreAgentLabelBrandingPrimitives>({
    resolver: zodResolver(editStoreAgentLabelBrandingSchema),
    defaultValues: {
      agentLabelBranding: {
        logo: store?.agentLabelBranding?.logo ?? "",
        primaryColor: store?.agentLabelBranding?.primaryColor ?? "",
        secondaryColor: store?.agentLabelBranding?.secondaryColor ?? "",
      },
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open && store) {
      reset({
        agentLabelBranding: {
          logo: store.agentLabelBranding?.logo ?? "",
          primaryColor: store.agentLabelBranding?.primaryColor ?? "",
          secondaryColor: store.agentLabelBranding?.secondaryColor ?? "",
        },
      });
    }
  }, [open, store, reset]);

  const watchedBanner = useWatch({
    control,
    name: "agentLabelBranding.primaryColor",
  });
  const watchedCp = useWatch({
    control,
    name: "agentLabelBranding.secondaryColor",
  });
  const bannerPreview =
    watchedBanner && /^#[0-9A-Fa-f]{6}$/.test(watchedBanner)
      ? watchedBanner
      : DEFAULT_BANNER_COLOR;
  const cpPreview =
    watchedCp && /^#[0-9A-Fa-f]{6}$/.test(watchedCp)
      ? watchedCp
      : DEFAULT_CP_BOX_COLOR;

  const onSubmit = handleSubmit((data) => onSave(data));

  if (!store) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Tag className="size-5" />
            </div>
            <div>
              <DialogTitle>Personalizar Etiqueta</DialogTitle>
              <DialogDescription>
                Diseño y colores de las guías de envío de {store.name} (formato térmico 4x6&quot;).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Nota informativa */}
        <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
          <Info className="size-4 text-primary shrink-0 mt-0.5" />
          <p>
            Esta configuración se aplica a las guías térmicas impresas bajo las variantes
            <strong className="text-foreground"> &quot;Agente&quot;</strong>,
            <strong className="text-foreground"> &quot;Agente Cliente&quot;</strong> y
            <strong className="text-foreground"> &quot;Anticipo&quot;</strong>. La guía institucional &quot;Cargo&quot; de JBG mantiene su diseño estándar.
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {/* Logo */}
          <Controller
            name="agentLabelBranding.logo"
            control={control}
            render={({ field }) => (
              <StoreLabelLogoInput
                value={field.value ?? ""}
                onChange={field.onChange}
                error={errors.agentLabelBranding?.logo?.message}
                disabled={isLoading}
              />
            )}
          />

          {/* Colores */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="agentLabelBranding.primaryColor"
              control={control}
              render={({ field }) => (
                <StoreLabelColorInput
                  label="Color del banner de tracking"
                  value={field.value ?? ""}
                  defaultColor={DEFAULT_BANNER_COLOR}
                  onChange={field.onChange}
                  error={errors.agentLabelBranding?.primaryColor?.message}
                  disabled={isLoading}
                />
              )}
            />
            <Controller
              name="agentLabelBranding.secondaryColor"
              control={control}
              render={({ field }) => (
                <StoreLabelColorInput
                  label="Color del bloque de C.P."
                  value={field.value ?? ""}
                  defaultColor={DEFAULT_CP_BOX_COLOR}
                  onChange={field.onChange}
                  error={errors.agentLabelBranding?.secondaryColor?.message}
                  disabled={isLoading}
                />
              )}
            />
          </div>

          {/* Vista previa visual */}
          <div className="rounded-md border p-3 bg-card space-y-2">
            <span className="text-xs font-medium text-muted-foreground">
              Vista previa de la guía
            </span>
            <div className="space-y-2">
              <div
                className="h-8 rounded flex items-center justify-center text-white text-xs font-bold tracking-wider shadow-xs"
                style={{ backgroundColor: bannerPreview }}
              >
                JBG-20261006-TRACKING
              </div>
              <div
                className="h-9 px-3 rounded flex items-center justify-between text-white text-xs font-bold shadow-xs"
                style={{ backgroundColor: cpPreview }}
              >
                <span>C.P.</span>
                <span className="text-sm tracking-widest">{store.address.zip || "64000"}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Etiqueta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
