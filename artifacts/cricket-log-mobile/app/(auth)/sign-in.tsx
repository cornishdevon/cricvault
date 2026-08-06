import { useSignIn } from "@clerk/expo";
import * as WebBrowser from "expo-web-browser";
import { type Href, Link, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  useWarmUpBrowser();
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const colors = useColors();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const navigateHome = ({ session, decorateUrl }: any) => {
    if (session?.currentTask) {
      console.log(session?.currentTask);
      return;
    }
    const url = decorateUrl("/");
    if (typeof url === "string" && url.startsWith("http")) {
      // @ts-ignore web only
      window.location.href = url;
    } else {
      router.push(url as Href);
    }
  };

  const handleSubmit = async () => {
    const { error } = await signIn.password({ emailAddress, password });
    if (error) return;

    if (signIn.status === "complete") {
      await signIn.finalize({ navigate: navigateHome });
    } else if (signIn.status === "needs_client_trust") {
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === "email_code",
      );
      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode();
      }
    }
  };

  const handleVerify = async () => {
    await signIn.mfa.verifyEmailCode({ code });
    if (signIn.status === "complete") {
      await signIn.finalize({ navigate: navigateHome });
    }
  };

  const s = makeStyles(colors);
  const busy = fetchStatus === "fetching";

  if (signIn.status === "needs_client_trust") {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.container}>
          <Text style={s.brand}>CricVault</Text>
          <Text style={s.title}>Verify your account</Text>
          <Text style={s.subtitle}>Enter the code we emailed you</Text>
          <TextInput
            style={s.input}
            value={code}
            placeholder="Verification code"
            placeholderTextColor={colors.mutedForeground}
            onChangeText={setCode}
            keyboardType="numeric"
          />
          {errors.fields.code && <Text style={s.error}>{errors.fields.code.message}</Text>}
          <Pressable style={[s.button, busy && s.buttonDisabled]} onPress={handleVerify} disabled={busy}>
            <Text style={s.buttonText}>Verify</Text>
          </Pressable>
          <Pressable style={s.linkBtn} onPress={() => signIn.mfa.sendEmailCode()}>
            <Text style={s.link}>I need a new code</Text>
          </Pressable>
          <Pressable style={s.linkBtn} onPress={() => signIn.reset()}>
            <Text style={s.link}>Start over</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.container}>
          <Text style={s.brand}>CricVault</Text>
          <Text style={s.title}>Welcome back</Text>
          <Text style={s.subtitle}>Sign in to your cricket career</Text>

          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            autoCapitalize="none"
            value={emailAddress}
            placeholder="you@example.com"
            placeholderTextColor={colors.mutedForeground}
            onChangeText={setEmailAddress}
            keyboardType="email-address"
          />
          {errors.fields.identifier && (
            <Text style={s.error}>{errors.fields.identifier.message}</Text>
          )}

          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input}
            value={password}
            placeholder="Your password"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
            onChangeText={setPassword}
          />
          {errors.fields.password && (
            <Text style={s.error}>{errors.fields.password.message}</Text>
          )}
          {errors.global.length > 0 && (
            <Text style={s.error}>{errors.global[0].message}</Text>
          )}

          <Pressable
            style={[s.button, (!emailAddress || !password || busy) && s.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!emailAddress || !password || busy}
          >
            <Text style={s.buttonText}>{busy ? "Signing in…" : "Sign in"}</Text>
          </Pressable>

          <View style={s.footerRow}>
            <Text style={s.footerText}>New to CricVault? </Text>
            <Link href="/(auth)/sign-up">
              <Text style={s.link}>Create an account</Text>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
    brand: {
      fontFamily: "Inter_700Bold",
      fontSize: 28,
      color: colors.primary,
      textAlign: "center",
      marginBottom: 24,
    },
    title: {
      fontFamily: "Inter_700Bold",
      fontSize: 22,
      color: colors.foreground,
      textAlign: "center",
    },
    subtitle: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: "center",
      marginTop: 4,
      marginBottom: 24,
    },
    label: {
      fontFamily: "Inter_500Medium",
      fontSize: 13,
      color: colors.foreground,
      marginBottom: 6,
      marginTop: 10,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      color: colors.foreground,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: "Inter_400Regular",
      fontSize: 15,
    },
    error: {
      color: "#dc2626",
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      marginTop: 6,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 20,
    },
    buttonDisabled: { opacity: 0.5 },
    buttonText: {
      color: "#ffffff",
      fontFamily: "Inter_600SemiBold",
      fontSize: 15,
    },
    dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 18 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: {
      marginHorizontal: 10,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 13,
    },
    googleButton: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    googleButtonText: {
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      fontSize: 15,
    },
    footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 22 },
    footerText: {
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 14,
    },
    link: {
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
      fontSize: 14,
    },
    linkBtn: { alignItems: "center", marginTop: 14 },
  });
