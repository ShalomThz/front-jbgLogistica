import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_PREFIX = "jbg:hidden-columns";

/**
 * Qué columnas escondió el usuario en una tabla.
 *
 * Es una preferencia de vista, así que vive en `localStorage` y no en el
 * servidor — el mismo criterio que el tema claro/oscuro. La diferencia con el
 * tema es que **no hay provider**: el tema es global (lo lee media app y escribe
 * la clase en `<html>`), mientras que ésta la leen la tabla y su menú. En este
 * caso el estado lo sostiene la página, que ya tiene el resto del estado de la
 * vista.
 *
 * El hook se parametriza por `tableId` para que la siguiente tabla que lo
 * necesite no tenga que reimplementarlo.
 *
 * Se guardan las **ocultas** y no las visibles a propósito: si mañana se agrega
 * una columna, aparece para todos. Con la lista de visibles, a quien ya tenía
 * preferencias guardadas le quedaría escondida para siempre sin saber por qué.
 *
 * Ojo: la preferencia es por navegador. Si alguien rota entre máquinas, cada
 * una le muestra lo suyo; para que siga al usuario habría que guardarla en su
 * perfil en el back.
 */
export function useColumnVisibility(tableId: string) {
  const storageKey = `${STORAGE_PREFIX}:${tableId}`;
  const [hiddenIds, setHiddenIds] = useState<string[]>(() => read(storageKey));

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(hiddenIds));
    } catch {
      // Modo privado, storage lleno o bloqueado: la preferencia no sobrevive a
      // la recarga, pero la tabla sigue andando. No vale interrumpir por esto.
    }
  }, [storageKey, hiddenIds]);

  const hidden = useMemo(() => new Set(hiddenIds), [hiddenIds]);

  const toggle = useCallback((columnId: string) => {
    setHiddenIds((current) =>
      current.includes(columnId)
        ? current.filter((id) => id !== columnId)
        : [...current, columnId],
    );
  }, []);

  const showAll = useCallback(() => setHiddenIds([]), []);

  return {
    isHidden: useCallback((columnId: string) => hidden.has(columnId), [hidden]),
    hiddenCount: hidden.size,
    toggle,
    showAll,
  };
}

function read(storageKey: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];

    // Lo guardado puede venir de una versión anterior o estar corrupto: si no
    // es una lista de strings se arranca limpio en vez de romper la tabla.
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}
