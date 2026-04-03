import { ApiError } from "./ApiError";
import { detectLang, type Lang } from "./detectLang";
import { errorTranslations } from "./errorCodes";
import { messageFallbacks } from "./errorPatterns";

export function getApiErrorCode(err: unknown): string | null {
  if (err instanceof ApiError && err.code) {
    if (errorTranslations[err.code]) return err.code;
  }

  const raw = err instanceof Error ? err.message : String(err);

  if (errorTranslations[raw]) return raw;

  for (const { pattern, code } of messageFallbacks) {
    if (pattern.test(raw)) return code;
  }

  return null;
}

export function parseApiError(err: unknown, lang: Lang = detectLang()): string {
  const code = getApiErrorCode(err);
  if (code) return errorTranslations[code]?.[lang] ?? String(err);

  return err instanceof Error ? err.message : String(err);
}
