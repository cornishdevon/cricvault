import { useSSO } from "@clerk/expo";
import { useSignInWithApple } from "@clerk/expo/apple";
import * as AppleAuthentication from "expo-apple-authentication";
import * as AuthSession from "expo-auth-session";
import { type Href, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import {
  authErrorMessage,
  isAuthCancelled,
  signInWithAppleFallback,
} from "@/utils/appleSignIn";

/**
 * "Sign in with Apple" (native, Apple-approved button) and
 * "Continue with Google" (Clerk SSO browser flow) buttons.
 *
 * Both sign up new users AND sign in existing ones — no email
 * verification codes involved. Added for App Store review, where the
 * reviewer's device cannot receive emails (guideline 4.8 also requires
 * Sign in with Apple when other social logins are offered).
 *
 * The native Apple button uses expo-apple-authentication + Clerk's
 * useSignInWithApple hook. This requires the "Sign in with Apple"
 * entitlement in the provisioning profile (appleSignIn: true in
 * app.json) and an EAS build authenticated with the ASC API key so
 * EAS can sync the capability to the profile.
 */
export function SocialAuthButtons() {
  const { startSSOFlow } = useSSO();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const router = useRouter();
  const colors = useColors();
  const scheme = useColorScheme();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"apple" | "google" | null>(null);
  const [browserFallback, setBrowserFallback] = useState<boolean>(false);
  const inFlight = useRef(false);
  type AuthResult = Awaited<ReturnType<typeof startSSOFlow>>;
  type Navigate = NonNullable<Parameters<NonNullable<AuthResult["setActive"]>>[0]["navigate"]>;

  const navigate = useCallback<Navigate>(
    async ({ session, decorateUrl }) => {
      if (session?.currentTask) {
        setError("Your account requires an additional verification step. Complete it on the CricVault website, then sign in again.");
        return;
      }
      if (Platform.OS !== "web") {
        router.replace("/(tabs)");
        return;
      }
      const url = decorateUrl("/");
      if (typeof url === "string" && url.startsWith("http")) {
        // @ts-ignore web only
        window.location.href = url;
      } else {
        router.replace(url as Href);
      }
    },
    [router],
  );

  const finish = useCallback(
    async (result: Pick<AuthResult, "createdSessionId" | "setActive"> & {
      authSessionResult?: AuthResult["authSessionResult"];
    }) => {
      const { createdSessionId, setActive } = result;
      if (result.authSessionResult?.type === "cancel" ||
          result.authSessionResult?.type === "dismiss") return;
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId, navigate });
      } else {
        setError(
          "Sign in didn't complete. Try signing in with your existing account on the CricVault website. You don't need to create another account.",
        );
      }
    },
    [navigate],
  );

  const handleApple = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    setBrowserFallback(false);
    setBusy("apple");
    try {
      const result = await signInWithAppleFallback<
        Pick<AuthResult, "createdSessionId" | "setActive"> & {
          authSessionResult?: AuthResult["authSessionResult"];
        }
      >(
        () => startAppleAuthenticationFlow(),
        () => startSSOFlow({
          strategy: "oauth_apple",
          redirectUrl: AuthSession.makeRedirectUri({ scheme: "cricvault" }),
        }),
        () => setBrowserFallback(true),
      );
      await finish(result);
    } catch (err: unknown) {
      // User cancelled the native Apple sheet — not an error
      if (isAuthCancelled(err)) return;
      setError(authErrorMessage(err, "Apple sign in didn't complete. Please try again."));
    } finally {
      inFlight.current = false;
      setBusy(null);
      setBrowserFallback(false);
    }
  }, [finish, startAppleAuthenticationFlow, startSSOFlow]);

  const handleGoogle = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    setBusy("google");
    try {
      await finish(
        await startSSOFlow({
          strategy: "oauth_google",
          redirectUrl: AuthSession.makeRedirectUri({ scheme: "cricvault" }),
        }),
      );
    } catch (err: unknown) {
      if (isAuthCancelled(err)) return;
      setError(authErrorMessage(err, "Google sign in didn't complete. Please try again."));
    } finally {
      inFlight.current = false;
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

      {busy === "apple" && (
        <Text style={s.dividerText} accessibilityLiveRegion="polite">
          {browserFallback ? "Continuing securely with Apple in your browser…" : "Signing in with Apple…"}
        </Text>
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
