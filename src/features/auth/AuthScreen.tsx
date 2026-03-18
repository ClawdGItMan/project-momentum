import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import { theme } from "@/src/design";
import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import { Badge, Button, Card, ScrollScreen, TextField } from "@/src/ui/primitives";

export function AuthScreen() {
  const router = useRouter();
  const { authError, authLoading, signIn, signUp, startDemoSession } = useMomentumSession();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [postSubmitNotice, setPostSubmitNotice] = useState<string | null>(null);

  const helperCopy = useMemo(
    () =>
      mode === "sign-in"
        ? "Use the account you created for founder alpha testing."
        : "Create a real founder-alpha account before the onboarding flow starts.",
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
            "Check your inbox to confirm this account, then come back and sign in.",
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
        <Badge label="Founder alpha" tone="accent" />
        <Text style={styles.heroTitle}>Build momentum with real accounts.</Text>
        <Text style={styles.heroBody}>
          The product stays private-by-default: real people, real squads, and a
          stronger proof loop than a generic social feed.
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
          {__DEV__ ? (
            <Button
              label="Load seeded demo"
              variant="secondary"
              onPress={() => {
                void startDemoSession().then(() => {
                  router.replace("/(app)/home");
                });
              }}
            />
          ) : null}
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
