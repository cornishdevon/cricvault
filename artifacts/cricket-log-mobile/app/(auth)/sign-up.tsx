import { useAuth, useSignUp } from "@clerk/expo";
import * as WebBrowser from "expo-web-browser";
import { type Href, Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { makeStyles, useWarmUpBrowser } from "./sign-in";

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  useWarmUpBrowser();
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const colors = useColors();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const handleSubmit = async () => {
    const { error } = await signUp.password({ emailAddress, password });
    if (!error) await signUp.verifications.sendEmailCode();
  };

  const handleVerify = async () => {
    await signUp.verifications.verifyEmailCode({ code });
    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            console.log(session?.currentTask);
            return;
          }
          const url = decorateUrl("/");
          if (url.startsWith("http")) {
            // @ts-ignore web only
            window.location.href = url;
          } else {
            router.push(url as Href);
          }
        },
      });
    }
  };

  const s = makeStyles(colors);
  const busy = fetchStatus === "fetching";

  if (signUp.status === "complete" || isSignedIn) {
    return null;
  }

  if (
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0
  ) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.container}>
          <Text style={s.brand}>CricVault</Text>
          <Text style={s.title}>Check your email</Text>
          <Text style={s.subtitle}>Enter the code we sent to {emailAddress}</Text>
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
          <Pressable style={s.linkBtn} onPress={() => signUp.verifications.sendEmailCode()}>
            <Text style={s.link}>I need a new code</Text>
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
          <Text style={s.title}>Create your account</Text>
          <Text style={s.subtitle}>Start tracking your cricket career</Text>

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
          {errors.fields.emailAddress && (
            <Text style={s.error}>{errors.fields.emailAddress.message}</Text>
          )}

          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input}
            value={password}
            placeholder="Choose a password"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
            onChangeText={setPassword}
          />
          {errors.fields.password && (
            <Text style={s.error}>{errors.fields.password.message}</Text>
          )}
          {(errors.global?.length ?? 0) > 0 && (
            <Text style={s.error}>{errors.global![0].message}</Text>
          )}

          <Pressable
            style={[s.button, (!emailAddress || !password || busy) && s.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!emailAddress || !password || busy}
          >
            <Text style={s.buttonText}>{busy ? "Creating account…" : "Sign up"}</Text>
          </Pressable>

          <View style={s.footerRow}>
            <Text style={s.footerText}>Already have an account? </Text>
            <Link href="/(auth)/sign-in">
              <Text style={s.link}>Sign in</Text>
            </Link>
          </View>

          {/* Required for sign-up flows. Clerk's bot sign-up protection is enabled by default */}
          <View nativeID="clerk-captcha" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
