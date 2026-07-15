import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

export const PRO_SKU = "com.cricvault.app.pro_annual";

interface ProContextValue {
  isPro: boolean;
  isLoading: boolean;
  error: string | null;
  purchasePro: () => Promise<void>;
  restorePurchases: () => Promise<boolean>;
  clearError: () => void;
}

const ProContext = createContext<ProContextValue>({
  isPro: false,
  isLoading: false,
  error: null,
  purchasePro: async () => {},
  restorePurchases: async () => false,
  clearError: () => {},
});

export function ProProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const purchaseUpdateSub = useRef<{ remove: () => void } | null>(null);
  const purchaseErrorSub = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;
    let active = true;

    async function init() {
      try {
        const iap = await import("expo-iap");

        await iap.initConnection();
        if (!active) return;

        const purchases = await iap.getAvailablePurchases();
        if (active && purchases.some((p: any) => p.productId === PRO_SKU)) {
          setIsPro(true);
        }

        purchaseUpdateSub.current = iap.purchaseUpdatedListener(
          async (purchase: any) => {
            if (purchase.productId === PRO_SKU) {
              try {
                await iap.finishTransaction({ purchase, isConsumable: false });
                setIsPro(true);
              } catch {}
              setIsLoading(false);
            }
          }
        );

        purchaseErrorSub.current = iap.purchaseErrorListener((err: any) => {
          if (err?.code !== "E_USER_CANCELLED") {
            setError("Purchase failed. Please try again.");
          }
          setIsLoading(false);
        });
      } catch {
        // IAP not available in Expo Go or simulator — silently skip
      }
    }

    init();

    return () => {
      active = false;
      purchaseUpdateSub.current?.remove();
      purchaseErrorSub.current?.remove();
      import("expo-iap").then((iap) => iap.endConnection()).catch(() => {});
    };
  }, []);

  const purchasePro = useCallback(async () => {
    if (Platform.OS === "web") return;
    setIsLoading(true);
    setError(null);
    try {
      const iap = await import("expo-iap");
      await iap.requestSubscription({ sku: PRO_SKU });
      // Result handled by purchaseUpdatedListener
    } catch (e: any) {
      if (e?.code !== "E_USER_CANCELLED") {
        setError("Purchase failed. Please try again.");
      }
      setIsLoading(false);
    }
  }, []);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") return false;
    setIsLoading(true);
    setError(null);
    try {
      const iap = await import("expo-iap");
      const purchases = await iap.getAvailablePurchases();
      const found = purchases.some((p: any) => p.productId === PRO_SKU);
      if (found) {
        setIsPro(true);
      } else {
        setError("No active CricVault Pro subscription found.");
      }
      return found;
    } catch {
      setError("Restore failed. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <ProContext.Provider
      value={{ isPro, isLoading, error, purchasePro, restorePurchases, clearError }}
    >
      {children}
    </ProContext.Provider>
  );
}

export function usePro() {
  return useContext(ProContext);
}
