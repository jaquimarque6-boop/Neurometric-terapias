import { createContext, useContext } from "react";
import es from "./locales/es";
import en from "./locales/en";
import type { Translations } from "./locales/es";

export type Language = "es" | "en";

export const translations: Record<Language, Translations> = { es, en };

export const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}>({
  language: "es",
  setLanguage: () => {},
  t: es,
});

export const useLanguage = () => useContext(LanguageContext);

/** Simple string interpolation: interpolate("Hello {{name}}", { name: "Ana" }) → "Hello Ana" */
export function interpolate(str: string, vars: Record<string, string | number>): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? `{{${key}}}`));
}
