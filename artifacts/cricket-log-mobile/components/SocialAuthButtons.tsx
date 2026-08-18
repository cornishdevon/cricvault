import { useSSO } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import { type Href, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";

import { useColors } from "@/hooks/useColors";

/**
 * "Continue with Apple" and "Continue with Google" buttons using Clerk's
 * SSO browser flow (ASWebAuthenticationSession on iOS).
 *
 * Both sign up new users AND sign in existing ones — no email
 * verification codes involved. Added for App Store review, where the
 * reviewer's device cannot receive emails (guideline 4.8 also requires
 * Sign in with Apple when other social logins are offered).
 *
 * The browser-based Apple flow is used deliberately: it needs no
 * Sign in with Apple entitlement in the provisioning profile, which we
 * cannot regenerate without a working App Store Connect API key.
 */
export function SocialAuthButtons() {
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const colors = useColors();
  const scheme = useColorScheme();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"apple" | "google" | null>(null);

  const navigate = useCallback(
    async ({ session, decorateUrl }: any) => {
      if (session?.currentTask) {
        console.log(session.currentTask);
        return;
      }
      const url = decorateUrl("/");
      if (typeof url === "string" && url.startsWith("http")) {
        // @ts-ignore web only
        window.location.href = url;
      } else {
        router.push(url as Href);
      }
    },
    [router],
  );

  const handleSSO = useCallback(
    (provider: "apple" | "google") => async () => {
      setError(null);
      setBusy(provider);
      try {
        const { createdSessionId, setActive } = await startSSOFlow({
          strategy: provider === "apple" ? "oauth_apple" : "oauth_google",
          redirectUrl: AuthSession.makeRedirectUri({ scheme: "cricvault" }),
        });
        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId, navigate });
        } else {
          // User closed the browser sheet or flow needs more steps — stay quiet
          // unless nothing at all happened is unexpected; show gentle message.
          setError(null);
        }
      } catch (err: any) {
        if (err?.code === "ERR_REQUEST_CANCELED") return;
        setError(
          err?.errors?.[0]?.longMessage ??
            err?.errors?.[0]?.message ??
            "Sign in didn't complete. Please try again.",
        );
      } finally {
        setBusy(null);
      }
    },
    [navigate, startSSOFlow],
  );

  const s = makeStyles(colors, scheme === "dark");

  return (
    <View>
      <View style={s.dividerRow}>
        <View style={s.dividerLine} />
        <Text style={s.dividerText}>or</Text>
        <View style={s.dividerLine} />
      </View>

      {Platform.OS === "ios" && (
        <Pressable
          style={[s.appleButton, busy === "apple" && s.disabled]}
          onPress={handleSSO("apple")}
          disabled={busy !== null}
          accessibilityLabel="Continue with Apple"
        >
          <Text style={s.appleLogo}></Text>
          <Text style={s.appleButtonText}>
            {busy === "apple" ? "Opening…" : "Continue with Apple"}
          </Text>
        </Pressable>
      )}

      <Pressable
        style={[s.socialButton, busy === "google" && s.disabled]}
        onPress={handleSSO("google")}
        disabled={busy !== null}
        accessibilityLabel="Continue with Google"
      >
        <Text style={s.socialButtonText}>
          {busy === "google" ? "Opening…" : "Continue with Google"}
        </Text>
      </Pressable>

      {error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>, dark: boolean) =>
  StyleSheet.create({
    dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 18 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: {
      marginHorizontal: 10,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 13,
    },
    appleButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: dark ? "#FFFFFF" : "#000000",
      borderRadius: 12,
      paddingVertical: 14,
      marginBottom: 10,
      gap: 6,
    },
    appleLogo: {
      color: dark ? "#000000" : "#FFFFFF",
      fontSize: 17,
      marginTop: -2,
    },
    appleButtonText: {
      color: dark ? "#000000" : "#FFFFFF",
      fontFamily: "Inter_600SemiBold",
      fontSize: 15,
    },
    socialButton: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    socialButtonText: {
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      fontSize: 15,
    },
    disabled: { opacity: 0.5 },
    error: {
      color: "#dc2626",
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      marginTop: 8,
      textAlign: "center",
    },
  });
