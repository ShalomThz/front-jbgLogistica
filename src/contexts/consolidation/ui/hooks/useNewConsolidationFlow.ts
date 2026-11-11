import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  NEW_CONSOLIDATION_STEP_FIELDS,
  newConsolidationDefaultValues,
  newConsolidationFormSchema,
  type NewConsolidationFormValues,
} from "@contexts/consolidation/domain/schemas/consolidation/NewConsolidationForm";
import { handleConsolidationError } from "@contexts/consolidation/application/errors/handleConsolidationError";
import { useConsolidations } from "@contexts/consolidation/infrastructure/hooks/useConsolidations";
import { useTrailers } from "@contexts/consolidation/infrastructure/hooks/useTrailers";
import { consolidationRepository } from "@contexts/consolidation/infrastructure/services/consolidationRepository";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { consolidationPolicies } from "@contexts/shared/domain/policies/consolidation.policy";
import type { TrailerListItem } from "@contexts/consolidation/domain/schemas/trailer/Trailer";

export const NEW_CONSOLIDATION_STEPS = [
  { key: "datos", label: "Datos del consolidado" },
  { key: "ordenes", label: "Agregar órdenes" },
  { key: "revisar", label: "Revisar y crear" },
] as const;

export type NewConsolidationStep = (typeof NEW_CONSOLIDATION_STEPS)[number]["key"];

/** Id del bloque del tráiler, para llevarlo a la vista si es lo que falta. */
export const TRAILER_FIELD_ID = "new-consolidation-trailer";


/**
 * Estado y navegación del wizard "Nuevo consolidado" — mismo reparto que
 * `useHQOrderFlow`: el hook valida cada paso con `form.trigger` antes de
 * avanzar y hace el envío; los componentes de paso sólo pintan.
 */
export const useNewConsolidationFlow = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Crear un consolidado y cargarle órdenes son permisos distintos (roles
  // armados antes de la dependencia pueden tener sólo el primero): sin el de
  // órdenes, el paso no aparece y se agregan después desde el detalle. Sin
  // permiso de ver el detalle, al crear se vuelve a la lista.
  const canManageOrders = user ? consolidationPolicies.manageOrders(user) : false;
  const canViewDetail = user ? consolidationPolicies.view(user) : false;
  const steps = NEW_CONSOLIDATION_STEPS.filter(
    (s) => s.key !== "ordenes" || canManageOrders,
  );
  const stepIndex = (target: NewConsolidationStep) =>
    steps.findIndex((s) => s.key === target);
  const [searchParams] = useSearchParams();
  const { createConsolidation } = useConsolidations();
  const { trailers } = useTrailers();

  const form = useForm<NewConsolidationFormValues>({
    resolver: zodResolver(newConsolidationFormSchema),
    defaultValues: newConsolidationDefaultValues,
  });

  const [step, setStep] = useState<NewConsolidationStep>("datos");
  // Cubre crear Y agregar órdenes: el botón no se rehabilita a la mitad.
  const [submitting, setSubmitting] = useState(false);
  // Guarda síncrona: el estado no alcanza a re-renderizar entre dos clics
  // seguidos, el ref sí.
  const submittingRef = useRef(false);

  // Validar por paso no es un submit, así que React Hook Form nunca
  // revalida al escribir: un campo marcado seguiría en rojo después de
  // corregirlo. Se revalida a mano el campo que cambia si tenía error.
  useEffect(
    () =>
      form.subscribe({
        formState: { values: true },
        callback: ({ name }) => {
          const field = name as keyof NewConsolidationFormValues | undefined;
          if (field && form.getFieldState(field).error) void form.trigger(field);
        },
      }),
    [form],
  );

  /** Tráiler en espera de confirmación: ya está en otro consolidado abierto. */
  const [trailerToConfirm, setTrailerToConfirm] =
    useState<TrailerListItem | null>(null);
  /** Folios que el usuario ya vio y aceptó al elegir el tráiler. */
  // Guarda de qué tráiler son: si después se elige otro, no aplican.
  const confirmedInUse = useRef<{ trailerId: string; folios: string[] } | null>(
    null,
  );

  /** Elegir un tráiler trae su capacidad como punto de partida. */
  const applyTrailer = (id: string) => {
    form.setValue("trailerId", id);
    const trailer = trailers.find((t) => t.id === id);
    if (trailer) {
      form.setValue("capacityLinearFeet", String(trailer.capacityLinearFeet), {
        shouldValidate: true,
      });
    }
    form.clearErrors("trailerId");
  };

  /** Un tráiler que ya va en otro consolidado sin conciliar no se asigna
   * directo: primero se pide confirmación. */
  const selectTrailer = (id: string) => {
    const trailer = trailers.find((t) => t.id === id);
    if (trailer && trailer.openInFolios.length > 0 && id !== form.getValues("trailerId")) {
      setTrailerToConfirm(trailer);
      return;
    }
    applyTrailer(id);
  };

  const confirmTrailer = () => {
    if (!trailerToConfirm) return;
    confirmedInUse.current = {
      trailerId: trailerToConfirm.id,
      folios: trailerToConfirm.openInFolios,
    };
    applyTrailer(trailerToConfirm.id);
    setTrailerToConfirm(null);
  };

  const cancelTrailer = () => setTrailerToConfirm(null);

  // Preselecciona la unidad cuando se llega desde "Crear consolidado" en la
  // fila de un tráiler (Tráilers → ?trailerId=...), una sola vez, en cuanto
  // carga el catálogo. Sólo activos: la lista no muestra los inactivos.
  // Se resuelve durante el render (no en un efecto): si el tráiler ya está en
  // otro consolidado abierto se abre la confirmación, igual que al elegirlo.
  const paramTrailerId = searchParams.get("trailerId");
  const [paramHandled, setParamHandled] = useState(false);
  const [preselectId, setPreselectId] = useState<string | null>(null);
  const paramTrailer = !paramHandled
    ? trailers.find((t) => t.id === paramTrailerId && t.isActive)
    : undefined;
  if (paramTrailer) {
    setParamHandled(true);
    if (paramTrailer.openInFolios.length > 0) setTrailerToConfirm(paramTrailer);
    else setPreselectId(paramTrailer.id);
  }
  // Escribir en el formulario sí es un efecto (React Hook Form es externo).
  useEffect(() => {
    if (preselectId && !form.getValues("trailerId")) applyTrailer(preselectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectId]);

  const validateStep = (current: NewConsolidationStep) =>
    current === "revisar"
      ? Promise.resolve(true)
      : form.trigger([...NEW_CONSOLIDATION_STEP_FIELDS[current]], {
          shouldFocus: true,
        });

  /** Lleva a la vista lo que impidió avanzar cuando no es un input al que
   * React Hook Form pueda hacer foco. */
  const revealStepError = (current: NewConsolidationStep) => {
    const { errors } = form.formState;
    if (current === "datos" && errors.trailerId) {
      const otherFieldFailed = NEW_CONSOLIDATION_STEP_FIELDS.datos.some(
        (field) => field !== "trailerId" && errors[field],
      );
      // Si falló otro campo, el foco ya lleva a ese.
      if (!otherFieldFailed) {
        document
          .getElementById(TRAILER_FIELD_ID)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    if (current === "ordenes" && errors.orders) {
      toast.error("Captura los pies lineales de las órdenes marcadas.");
    }
  };

  const handleNext = async () => {
    if (!(await validateStep(step))) {
      revealStepError(step);
      return;
    }
    setStep(steps[stepIndex(step) + 1].key);
  };

  const handleBack = () => {
    if (step === "datos") navigate("/consolidations");
    else setStep(steps[stepIndex(step) - 1].key);
  };

  /** Sólo hacia atrás (lo ya validado), como el `StepIndicator`. */
  const navigateToStep = (target: NewConsolidationStep) => {
    if (stepIndex(target) < stepIndex(step)) setStep(target);
  };

  const handleCreate = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      // Normalmente ya está validado paso por paso; si algo no pasa, se
      // vuelve al primer paso con errores para que se vea qué falta.
      if (!(await form.trigger())) {
        const { errors } = form.formState;
        const failedStep = (["datos", "ordenes"] as const).find(
          (s) =>
            stepIndex(s) !== -1 &&
            NEW_CONSOLIDATION_STEP_FIELDS[s].some((field) => errors[field]),
        );
        if (failedStep) {
          setStep(failedStep);
          toast.error("Revisa los campos marcados antes de crear el consolidado.");
        }
        return;
      }
      const values = form.getValues();

      let created;
      try {
        created = await createConsolidation({
          folio: values.folio.trim(),
          origin: { label: values.origin.trim(), geolocation: null },
          destination: { label: values.destination.trim(), geolocation: null },
          trailerId: values.trailerId,
          driverId: values.driverId || null,
          capacityLinearFeet: Number(values.capacityLinearFeet),
          linearFeetDivisor: Number(values.linearFeetDivisor),
        });
      } catch (error) {
        handleConsolidationError(error, {
          form,
          setStep: (s) => setStep(s as NewConsolidationStep),
        });
        return;
      }

      const { consolidation, trailerInUseBy } = created;
      // Sólo avisa lo que no se confirmó al elegirlo (otro consolidado lo
      // tomó mientras tanto).
      const confirmed =
        confirmedInUse.current?.trailerId === values.trailerId
          ? confirmedInUse.current.folios
          : [];
      const newlyInUse = trailerInUseBy.filter(
        (folio) => !confirmed.includes(folio),
      );
      if (newlyInUse.length > 0) {
        toast.warning(
          `El tráiler también está asignado a: ${newlyInUse.join(", ")}`,
        );
      }

      // El consolidado ya existe: si cargarle las órdenes falla, se entra a
      // él igual (reintentar aquí chocaría con el folio) y se agregan desde
      // ahí.
      try {
        if (canManageOrders && values.orders.length > 0) {
          await consolidationRepository.addOrders(consolidation.id, {
            orders: values.orders.map((o) => ({
              orderId: o.orderId,
              linearFeet: o.linearFeet,
              section: o.section || null,
            })),
          });
        }
        toast.success(`Consolidado ${consolidation.folio} creado`);
      } catch (error) {
        toast.error(
          `Consolidado ${consolidation.folio} creado, pero no se pudieron agregar las órdenes: ${parseApiError(error)}`,
        );
      }
      navigate(
        canViewDetail ? `/consolidations/${consolidation.id}` : "/consolidations",
        { replace: true },
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return {
    form,
    steps,
    canManageOrders,
    step,
    navigateToStep,
    handleNext,
    handleBack,
    handleCreate,
    submitting,
    trailers,
    selectTrailer,
    trailerToConfirm,
    confirmTrailer,
    cancelTrailer,
  };
};
