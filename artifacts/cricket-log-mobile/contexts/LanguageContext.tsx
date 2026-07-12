import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { I18nManager } from "react-native";
import * as Localization from "expo-localization";
import { i18n, type LocaleCode, SUPPORTED_LOCALES } from "@/i18n";

const LANG_KEY = "@cricvault:language";

function deviceLocale(): LocaleCode {
  const tag = Localization.getLocales?.()?.[0]?.languageCode ?? "en";
  const match = SUPPORTED_LOCALES.find((l) => l.code === tag);
  return match ? match.code : "en";
}

interface LanguageContextValue {
  locale: LocaleCode;
  setLocale: (code: LocaleCode) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>("en");

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((stored) => {
      const valid = SUPPORTED_LOCALES.find((l) => l.code === stored);
      const chosen = valid ? (stored as LocaleCode) : deviceLocale();
      setLocaleState(chosen);
      i18n.locale = chosen;
      I18nManager.forceRTL(chosen === "ur");
    });
  }, []);

  const setLocale = useCallback((code: LocaleCode) => {
    setLocaleState(code);
    i18n.locale = code;
    AsyncStorage.setItem(LANG_KEY, code);
    I18nManager.forceRTL(code === "ur");
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
