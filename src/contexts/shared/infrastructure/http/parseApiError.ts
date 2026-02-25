/**
 * Maps backend error codes (or interim English strings) to i18n-ready messages.
 *
 * Architecture note:
 * - The backend should return `{ code, meta }` — never translatable prose.
 * - This file is a bridge layer while the backend is migrated to error codes.
 * - Once the backend returns structured codes, replace the `messageFallbacks`
 *   map with a proper i18next `t("errors.BOX_NAME_ALREADY_EXISTS", meta)` call.
 *
 * Add new entries here as the backend exposes new error codes.
 */

// ─── Known backend error codes ────────────────────────────────────────────────
// Future shape: { code: "BOX_NAME_ALREADY_EXISTS", meta: { name: "caja 15" } }

type Lang = "es" | "en" | "pt";

const errorTranslations: Record<string, Record<Lang, string>> = {
    BOX_NAME_ALREADY_EXISTS: {
        es: 'Ya existe una caja con ese nombre',
        en: 'A box with that name already exists',
        pt: 'Já existe uma caixa com esse nome',
    },
    BOX_NOT_FOUND: {
        es: 'Caja no encontrada',
        en: 'Box not found',
        pt: 'Caixa não encontrada',
    },
    PACKAGE_NOT_FOUND: {
        es: 'Paquete no encontrado',
        en: 'Package not found',
        pt: 'Pacote não encontrado',
    },
    UNAUTHORIZED: {
        es: 'No tienes permiso para realizar esta acción',
        en: 'You are not authorized to perform this action',
        pt: 'Você não tem permissão para realizar esta ação',
    },
};

// ─── Interim: map English prose → code while backend returns strings ──────────
const messageFallbacks: Array<{ pattern: RegExp; code: string }> = [
    { pattern: /already exists/i, code: 'BOX_NAME_ALREADY_EXISTS' },
    { pattern: /box not found/i, code: 'BOX_NOT_FOUND' },
    { pattern: /package not found/i, code: 'PACKAGE_NOT_FOUND' },
    { pattern: /unauthorized|forbidden/i, code: 'UNAUTHORIZED' },
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Resolves a backend error (code or raw message) to a localized user-facing string.
 *
 * Usage:
 *   toast.error(parseApiError(err));
 */
export function parseApiError(
    err: unknown,
    lang: Lang = detectLang(),
): string {
    const raw = err instanceof Error ? err.message : String(err);

    // 1. Try direct code lookup (future backend format)
    if (errorTranslations[raw]) {
        return errorTranslations[raw][lang];
    }

    // 2. Match English prose to a known code (interim)
    for (const { pattern, code } of messageFallbacks) {
        if (pattern.test(raw)) {
            return errorTranslations[code]?.[lang] ?? raw;
        }
    }

    // 3. Unknown error — return raw message as last resort
    return raw;
}

function detectLang(): Lang {
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    if (browserLang === 'es') return 'es';
    if (browserLang === 'pt') return 'pt';
    return 'en';
}
