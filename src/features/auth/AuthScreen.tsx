import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import { theme } from "@/src/design";
import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import { HiddenDevToolsTrigger } from "@/src/features/dev/HiddenDevToolsTrigger";
import { Badge, Button, Card, ScrollScreen, TextField } from "@/src/ui/primitives";

export function AuthScreen() {
  const router = useRouter();
  const { authError, authLoading, signIn, signUp } = useMomentumSession();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [postSubmitNotice, setPostSubmitNotice] = useState<string | null>(null);

  const helperCopy = useMemo(
    () =>
      mode === "sign-in"
        ? "Pick up where you left off and keep your progress moving."
        : "Create your account to build consistency with people who actually care.",
    [mode],
  );

  const submit = async () => {
    setSubmitError(null);
    setPostSubmitNotice(null);

    try {
      if (mode === "sign-in") {
        await signIn(email, password);
        router.replace("/(onboarding)/welcome");
      } else {
        const result = await signUp(email, password);
        if (result.needsEmailConfirmation) {
          setPostSubmitNotice(
            "Check your inbox to confirm your email, then come back and sign in.",
          );
          return;
        }
        router.replace("/(onboarding)/welcome");
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Authentication failed.",
      );
    }
  };

  return (
    <ScrollScreen contentContainerStyle={styles.content}>
      <LinearGradient
        colors={["#0F172A", "#0B3B57", "#DFF5FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <HiddenDevToolsTrigger>
          <Badge label="Outtcast" tone="accent" />
        </HiddenDevToolsTrigger>
        <Text style={styles.heroTitle}>Turn effort into visible momentum.</Text>
        <Text style={styles.heroBody}>
          Outtcast helps you stay consistent, share real progress with trusted
          people, and build a life that feels stronger every week.
        </Text>
      </LinearGradient>

      <Card
        title={mode === "sign-in" ? "Sign in" : "Create account"}
        subtitle={helperCopy}
      >
        <View style={styles.form}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            helperText={
              mode === "sign-up"
                ? "If email confirmation is enabled, the app will guide you after signup."
                : undefined
            }
          />
          {submitError || authError ? (
            <Text style={styles.errorText}>{submitError ?? authError}</Text>
          ) : null}
          {postSubmitNotice ? (
            <Text style={styles.noticeText}>{postSubmitNotice}</Text>
          ) : null}
          <Button
            label={mode === "sign-in" ? "Sign in" : "Create account"}
            loading={authLoading}
            onPress={submit}
          />
          <Button
            label={mode === "sign-in" ? "Need an account?" : "Already have one?"}
            variant="ghost"
            onPress={() =>
              setMode((current) =>
                current === "sign-in" ? "sign-up" : "sign-in",
              )
            }
          />
        </View>
      </Card>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.lg,
    justifyContent: "center",
    flexGrow: 1,
  },
  hero: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    minHeight: 220,
    gap: theme.spacing.md,
    justifyContent: "flex-end",
  },
  heroTitle: {
    ...theme.typography.hero,
    color: theme.color.fg.inverse,
    maxWidth: 280,
  },
  heroBody: {
    ...theme.typography.body,
    color: theme.color.fg.inverse,
    maxWidth: 300,
  },
  form: {
    gap: theme.spacing.sm,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.color.accent.danger,
  },
  noticeText: {
    ...theme.typography.caption,
    color: theme.color.accent.success,
  },
});
