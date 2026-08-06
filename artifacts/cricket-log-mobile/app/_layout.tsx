import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppearanceProvider } from "@/contexts/AppearanceContext";
import { PlayerNameProvider } from "@/contexts/PlayerNameContext";
import { SeasonProvider } from "@/contexts/SeasonContext";
import { TabLabelsProvider } from "@/contexts/TabLabelsContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { BadgeNotificationProvider } from "@/contexts/BadgeNotificationContext";

SplashScreen.preventAutoHideAsync();

const domain = process.env.EXPO_PUBLIC_DOMAIN;
if (domain) {
  setBaseUrl(`https://${domain}`);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const clerkProxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

function AuthTokenBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);
  return null;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="match/[id]"
        options={{ title: "Match Details", headerBackTitle: "Back" }}
      />
      <Stack.Screen
        name="settings-modal"
        options={{ title: "Settings", presentation: "modal", headerBackTitle: "Cancel" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      tokenCache={tokenCache}
      proxyUrl={clerkProxyUrl}
    >
      <ClerkLoaded>
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppearanceProvider>
        <LanguageProvider>
        <SeasonProvider>
        <PlayerNameProvider>
        <TabLabelsProvider>
          <QueryClientProvider client={queryClient}>
            <BadgeNotificationProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <AuthTokenBridge />
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
            </BadgeNotificationProvider>
          </QueryClientProvider>
        </TabLabelsProvider>
        </PlayerNameProvider>
        </SeasonProvider>
        </LanguageProvider>
        </AppearanceProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
