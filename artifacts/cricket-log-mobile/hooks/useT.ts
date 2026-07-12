import { useLanguage } from "@/contexts/LanguageContext";
import { i18n } from "@/i18n";

/**
 * Returns a translation function `t` scoped to the current locale.
 * Usage: const t = useT();  t("tabs.home") => "Home" / "होम" / …
 */
export function useT() {
  useLanguage(); // subscribe to locale changes so components re-render
  return (key: string, opts?: Record<string, unknown>) =>
    i18n.t(key, opts) as string;
}
