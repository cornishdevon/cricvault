import { I18n } from "i18n-js";
import en from "@/locales/en";
import hi from "@/locales/hi";
import ur from "@/locales/ur";
import bn from "@/locales/bn";
import si from "@/locales/si";
import af from "@/locales/af";

export const SUPPORTED_LOCALES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "ur", label: "اردو" },
  { code: "bn", label: "বাংলা" },
  { code: "si", label: "සිංහල" },
  { code: "af", label: "Afrikaans" },
] as const;

export type LocaleCode = typeof SUPPORTED_LOCALES[number]["code"];

export const i18n = new I18n({ en, hi, ur, bn, si, af });
i18n.defaultLocale = "en";
i18n.locale = "en";
i18n.enableFallback = true;
