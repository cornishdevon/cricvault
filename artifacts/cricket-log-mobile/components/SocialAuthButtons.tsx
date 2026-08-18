import { useSSO } from "@clerk/expo";
import { useSignInWithApple } from "@clerk/expo/apple";
import * as AppleAuthentication from "expo-apple-authentication";
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
 * "Sign in with Apple" (native, Apple-approved button) and
 * "Continue with Google" (Clerk SSO browser flow) buttons.
 *
 * Both sign up new users AND sign in existing ones — no email
 * verification codes involved. Added for App Store review, where the
 * reviewer's device cannot receive emails (guideline 4.8 also requires
 * Sign in with Apple when other social logins are offered).
 */
export function SocialAuthButtons() {
  const { startSSOFlow } = useSSO();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
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

  const finish = useCallback(
    async (result: { createdSessionId: string | null; setActive?: any }) => {
      const { createdSessionId, setActive } = result;
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId, navigate });
      } else {
        setError(
          "Sign in didn't complete. Please try again, or use email and password.",
        );
      }
    },
    [navigate],
  );

  const handleApple = useCallback(async () => {
    setError(null);
    setBusy("apple");
    try {
      await finish(await startAppleAuthenticationFlow());
    } catch (err: any) {
      // User cancelled the native Apple sheet — not an error
      if (err?.code === "ERR_REQUEST_CANCELED") return;
      setError(
        err?.errors?.[0]?.longMessage ??
          err?.errors?.[0]?.message ??
          "Apple sign in didn't complete. Please try again.",
      );
    } finally {
      setBusy(null);
    }
  }, [finish, startAppleAuthenticationFlow]);

  const handleGoogle = useCallback(async () => {
    setError(null);
    setBusy("google");
    try {
      await finish(
        await startSSOFlow({
          strategy: "oauth_google",
          redirectUrl: AuthSession.makeRedirectUri({ scheme: "cricvault" }),
        }),
      );
    } catch (err: any) {
      setError(
        err?.errors?.[0]?.longMessage ??
          err?.errors?.[0]?.message ??
          "Google sign in didn't complete. Please try again.",
      );
    } finally {
      setBusy(null);
    }
  }, [finish, startSSOFlow]);

  const s = makeStyles(colors);

  return (
    <View>
      <View style={s.dividerRow}>
        <View style={s.dividerLine} />
        <Text style={s.dividerText}>or</Text>
        <View style={s.dividerLine} />
      </View>

      {Platform.OS === "ios" && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={
            scheme === "dark"
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={12}
          style={s.appleButton}
          onPress={busy ? () => {} : handleApple}
        />
      )}

      <Pressable
        style={[s.socialButton, busy === "google" && s.disabled]}
        onPress={handleGoogle}
        disabled={busy !== null}
      >
        <Text style={s.socialButtonText}>
          {busy === "google" ? "Opening…" : "Continue with Google"}
        </Text>
      </Pressable>

      {error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
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
      height: 48,
      marginBottom: 10,
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
