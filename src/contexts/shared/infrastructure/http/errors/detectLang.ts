export type Lang = "es" | "en" | "pt";

export function detectLang(): Lang {
  const browserLang = navigator.language.slice(0, 2).toLowerCase();
  if (browserLang === "es") return "es";
  if (browserLang === "pt") return "pt";
  return "en";
}
