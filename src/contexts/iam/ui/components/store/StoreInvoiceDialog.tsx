import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Building2, MapPin, Phone, Mail } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@contexts/shared/shadcn";
import type { z } from "zod";
import type { StoreListViewPrimitives } from "@contexts/iam/domain/schemas/store/StoreListView";
import {
  editStoreInvoiceBrandingSchema,
  type EditStoreInvoiceBrandingPrimitives,
} from "@contexts/iam/application/store/CreateStoreRequest";
import { StoreInvoiceColorInput } from "./StoreInvoiceColorInput";
import { StoreInvoiceLogoInput } from "./StoreInvoiceLogoInput";

const DEFAULT_PRIMARY_COLOR = "#15295C";
const DEFAULT_ACCENT_COLOR = "#C62433";

type InvoiceFormInput = z.input<typeof editStoreInvoiceBrandingSchema>;

interface Props {
  store: StoreListViewPrimitives | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: EditStoreInvoiceBrandingPrimitives) => Promise<void> | void;
  isLoading?: boolean;
}

export const StoreInvoiceDialog = ({
  store,
  open,
  onClose,
  onSave,
  isLoading,
}: Props) => {
  const form = useForm<InvoiceFormInput, unknown, EditStoreInvoiceBrandingPrimitives>({
    resolver: zodResolver(editStoreInvoiceBrandingSchema),
    defaultValues: {
      invoiceBranding: {
        logo: store?.invoiceBranding?.logo ?? "",
        primaryColor: store?.invoiceBranding?.primaryColor ?? "",
        accentColor: store?.invoiceBranding?.accentColor ?? "",
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
        invoiceBranding: {
          logo: store.invoiceBranding?.logo ?? "",
          primaryColor: store.invoiceBranding?.primaryColor ?? "",
          accentColor: store.invoiceBranding?.accentColor ?? "",
        },
      });
    }
  }, [open, store, reset]);

  const watchedPrimary = useWatch({
    control,
    name: "invoiceBranding.primaryColor",
  });
  const watchedAccent = useWatch({
    control,
    name: "invoiceBranding.accentColor",
  });
  const primaryPreview =
    watchedPrimary && /^#[0-9A-Fa-f]{6}$/.test(watchedPrimary)
      ? watchedPrimary
      : DEFAULT_PRIMARY_COLOR;
  const accentPreview =
    watchedAccent && /^#[0-9A-Fa-f]{6}$/.test(watchedAccent)
      ? watchedAccent
      : DEFAULT_ACCENT_COLOR;

  const onSubmit = handleSubmit((data) => onSave(data));

  if (!store) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>
            <div>
              <DialogTitle>Personalizar Factura</DialogTitle>
              <DialogDescription>
                Diseño e identidad de la factura que {store.name} emite a sus clientes.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Resumen de Datos de la Empresa Emisora */}
        <div className="rounded-lg border bg-muted/40 p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
            <Building2 className="size-4 text-muted-foreground" />
            <span>Datos de la empresa emisora</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-medium text-foreground">Nombre:</span>
              <span className="truncate">{store.name}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <Phone className="size-3.5 shrink-0" />
              <span className="font-medium text-foreground">Teléfono:</span>
              <span className="truncate">{store.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="size-3.5 shrink-0" />
              <span className="font-medium text-foreground">Dirección:</span>
              <span className="truncate">
                {store.address.address1}, {store.address.city}
              </span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <Mail className="size-3.5 shrink-0" />
              <span className="font-medium text-foreground">Email:</span>
              <span className="truncate">{store.contactEmail || "—"}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground border-t pt-2">
            La cabecera de la factura toma automáticamente estos datos. Puedes modificarlos desde &quot;Editar Tienda&quot;.
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {/* Logo */}
          <Controller
            name="invoiceBranding.logo"
            control={control}
            render={({ field }) => (
              <StoreInvoiceLogoInput
                value={field.value ?? ""}
                onChange={field.onChange}
                error={errors.invoiceBranding?.logo?.message}
                disabled={isLoading}
              />
            )}
          />

          {/* Colores */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="invoiceBranding.primaryColor"
              control={control}
              render={({ field }) => (
                <StoreInvoiceColorInput
                  label="Color principal (barras y títulos)"
                  value={field.value ?? ""}
                  defaultColor={DEFAULT_PRIMARY_COLOR}
                  onChange={field.onChange}
                  error={errors.invoiceBranding?.primaryColor?.message}
                  disabled={isLoading}
                />
              )}
            />
            <Controller
              name="invoiceBranding.accentColor"
              control={control}
              render={({ field }) => (
                <StoreInvoiceColorInput
                  label="Color de acento (totales y destacados)"
                  value={field.value ?? ""}
                  defaultColor={DEFAULT_ACCENT_COLOR}
                  onChange={field.onChange}
                  error={errors.invoiceBranding?.accentColor?.message}
                  disabled={isLoading}
                />
              )}
            />
          </div>

          {/* Vista previa de paleta de colores */}
          <div className="rounded-md border p-3 bg-card space-y-2">
            <span className="text-xs font-medium text-muted-foreground">
              Vista previa de la paleta
            </span>
            <div className="flex items-center gap-3">
              <div
                className="h-7 flex-1 rounded flex items-center justify-center text-white text-xs font-semibold shadow-xs"
                style={{ backgroundColor: primaryPreview }}
              >
                FACTURA #{store.name}
              </div>
              <div
                className="h-7 px-4 rounded flex items-center justify-center text-white text-xs font-semibold shadow-xs"
                style={{ backgroundColor: accentPreview }}
              >
                TOTAL
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
              {isLoading ? "Guardando..." : "Guardar Factura"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
