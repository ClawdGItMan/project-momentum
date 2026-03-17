import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { type Href, useRouter } from "expo-router";

import { theme } from "@/src/design";
import {
  goalOptions,
  pillarOptions,
  squadsSeed,
} from "@/src/data/fixtures/appSeed";
import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import type {
  AccountabilityStyle,
  FocusPillar,
} from "@/src/features/app/sessionTypes";
import {
  formatConnectionState,
  formatCoverageReason,
  formatMetricLabel,
} from "@/src/lib/formatters";
import {
  Badge,
  Button,
  Card,
  Chip,
  ErrorState,
  LoadingSkeleton,
  MetricPill,
  Pill,
  ScrollScreen,
  StatRow,
  TextField,
} from "@/src/ui/primitives";
import { ConsistencyCard } from "@/src/ui/composites/ConsistencyCard";

type StepShellProps = {
  step: number;
  total: number;
  title: string;
  subtitle: string;
  backHref?: Href;
  children: React.ReactNode;
  footer: React.ReactNode;
};

function StepShell({
  step,
  total,
  title,
  subtitle,
  backHref,
  children,
  footer,
}: StepShellProps) {
  const router = useRouter();

  return (
    <ScrollScreen contentContainerStyle={styles.screenContent}>
      <View style={styles.stepHeader}>
        <View style={styles.stepRow}>
          <Badge label={`Step ${step} / ${total}`} tone="accent" />
          {backHref ? (
            <Button
              label="Back"
              variant="ghost"
              fullWidth={false}
              onPress={() => router.replace(backHref)}
            />
          ) : null}
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.progressTrack}>
          {Array.from({ length: total }, (_, index) => (
            <View
              key={`progress-${index + 1}`}
              style={[
                styles.progressSegment,
                index < step ? styles.progressSegmentActive : styles.progressSegmentIdle,
              ]}
            />
          ))}
        </View>
      </View>
      <View style={styles.body}>{children}</View>
      <View style={styles.footer}>{footer}</View>
    </ScrollScreen>
  );
}

function SelectableCard({
  title,
  subtitle,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.selectableCard, selected && styles.selectableCardSelected]}
    >
      <Text style={styles.selectableTitle}>{title}</Text>
      <Text style={styles.selectableSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

export function WelcomeScreen() {
  const router = useRouter();
  const { startDemoSession } = useMomentumSession();

  return (
    <ScrollScreen contentContainerStyle={styles.screenContent}>
      <LinearGradient
        colors={["#0F172A", "#0E7490", "#E0F2FE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Badge label="Project Momentum v0.1" tone="accent" />
        <Text style={styles.heroTitle}>Show the work.</Text>
        <Text style={styles.heroBody}>
          Build a life worth showing up for with friends, squads, and proof that
          you actually moved.
        </Text>
      </LinearGradient>

      <Card
        title="What this first build proves"
        subtitle="Fast onboarding, real health posture, selective sharing, and a social loop that feels tighter than a generic feed."
      >
        <Text style={styles.bodyCopy}>
          Workouts and habits stay friend-visible by default. Squads stay the
          main accountability surface. Apple Health leads, manual entry only
          catches what coverage misses.
        </Text>
      </Card>

      <View style={styles.footer}>
        <Button
          label="Start setup"
          onPress={() => router.replace("/(onboarding)/goals")}
        />
        {__DEV__ ? (
          <Button
            label="Load seeded demo"
            variant="ghost"
            onPress={() => {
              void startDemoSession().then(() => {
                router.replace("/(app)/home");
              });
            }}
          />
        ) : null}
      </View>
    </ScrollScreen>
  );
}

export function GoalsScreen() {
  const router = useRouter();
  const { onboardingDraft, setGoals } = useMomentumSession();
  const selected = onboardingDraft.goals;

  const toggleGoal = (goal: string) => {
    if (selected.includes(goal)) {
      setGoals(selected.filter((item) => item !== goal));
      return;
    }

    setGoals([...selected, goal]);
  };

  return (
    <StepShell
      step={1}
      total={7}
      title="What are you actively trying to improve?"
      subtitle="Pick the improvements you want the app to recognize immediately."
      backHref="/(onboarding)/welcome"
      footer={
        <Button
          label="Keep going"
          disabled={selected.length === 0}
          onPress={() => router.replace("/(onboarding)/pillars")}
        />
      }
    >
      <View style={styles.wrap}>
        {goalOptions.map((goal) => (
          <Chip
            key={goal}
            label={goal}
            selected={selected.includes(goal)}
            onPress={() => toggleGoal(goal)}
          />
        ))}
      </View>
    </StepShell>
  );
}

export function PillarsScreen() {
  const router = useRouter();
  const { onboardingDraft, setPillars } = useMomentumSession();
  const selected = onboardingDraft.pillars;

  const togglePillar = (pillar: FocusPillar) => {
    if (selected.includes(pillar)) {
      setPillars(selected.filter((item) => item !== pillar));
      return;
    }
    setPillars([...selected, pillar]);
  };

  return (
    <StepShell
      step={2}
      total={7}
      title="Choose the pillars you want visible"
      subtitle="Fitness leads this prototype, but the identity should still feel like yours."
      backHref="/(onboarding)/goals"
      footer={
        <Button
          label="Continue"
          disabled={selected.length === 0}
          onPress={() => router.replace("/(onboarding)/sharing")}
        />
      }
    >
      <View style={styles.wrap}>
        {pillarOptions.map((pillar) => (
          <Chip
            key={pillar.value}
            label={pillar.label}
            selected={selected.includes(pillar.value)}
            onPress={() => togglePillar(pillar.value)}
          />
        ))}
      </View>
      <Card subtitle="Workouts and habits stay friend-visible by default in v0.1. Everything else remains selective.">
        <Text style={styles.bodyCopy}>
          The first profile should communicate momentum, not look like a life
          dashboard.
        </Text>
      </Card>
    </StepShell>
  );
}

export function SharingScreen() {
  const router = useRouter();
  const { onboardingDraft, setAccountabilityStyle } = useMomentumSession();
  const selected = onboardingDraft.accountabilityStyle;

  const options: {
    value: AccountabilityStyle;
    title: string;
    subtitle: string;
  }[] = [
    {
      value: "friends",
      title: "Friends keep me honest",
      subtitle: "Mutual accountability with people who already know your baseline.",
    },
    {
      value: "squad-first",
      title: "A squad keeps me committed",
      subtitle: "Private groups stay the main accountability surface in this MVP.",
    },
    {
      value: "mixed",
      title: "I need both",
      subtitle: "Friends for daily proof, squads for a tighter rhythm.",
    },
  ];

  return (
    <StepShell
      step={3}
      total={7}
      title="Who keeps your effort honest?"
      subtitle="This app stays selective by default. No public feed, no public profile."
      backHref="/(onboarding)/pillars"
      footer={
        <Button
          label="Set my profile"
          onPress={() => router.replace("/(onboarding)/profile-basics")}
        />
      }
    >
      <View style={styles.stack}>
        {options.map((option) => (
          <SelectableCard
            key={option.value}
            title={option.title}
            subtitle={option.subtitle}
            selected={selected === option.value}
            onPress={() => setAccountabilityStyle(option.value)}
          />
        ))}
      </View>
      <Card title="Locked default" subtitle="Your first check-in starts with Friends unless you launch from a squad.">
        <Text style={styles.bodyCopy}>
          Home still opens on Squads so the product feels like private
          accountability, not shallow broadcasting.
        </Text>
      </Card>
    </StepShell>
  );
}

export function ProfileBasicsScreen() {
  const router = useRouter();
  const { onboardingDraft, setProfileBasics } = useMomentumSession();
  const [name, setName] = useState(onboardingDraft.name);
  const [username, setUsername] = useState(onboardingDraft.username);
  const [missionLine, setMissionLine] = useState(onboardingDraft.missionLine);
  const [city, setCity] = useState(onboardingDraft.city);
  const [errors, setErrors] = useState<{
    name?: string;
    username?: string;
    missionLine?: string;
  }>({});

  const submit = () => {
    const nextErrors = {
      name: name.trim() ? undefined : "Name helps your first profile feel real.",
      username: username.trim()
        ? undefined
        : "Pick a short handle for friend and squad context.",
      missionLine: missionLine.trim()
        ? undefined
        : "Add a one-line mission so people know what you are building.",
    };

    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.username || nextErrors.missionLine) {
      return;
    }

    setProfileBasics({
      name: name.trim(),
      username: username.trim().replace(/^@/, ""),
      missionLine: missionLine.trim(),
      city: city.trim(),
    });
    router.replace("/(onboarding)/connect-health");
  };

  return (
    <StepShell
      step={4}
      total={7}
      title="Build your momentum identity"
      subtitle="Profiles should read like effort and direction, not vanity."
      backHref="/(onboarding)/sharing"
      footer={<Button label="Connect health" onPress={submit} />}
    >
      <View style={styles.stack}>
        <TextField
          label="Name"
          value={name}
          onChangeText={setName}
          errorText={errors.name}
        />
        <TextField
          label="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          errorText={errors.username}
          helperText="This stays private to friends and squads in v0.1."
        />
        <TextField
          label="Mission line"
          value={missionLine}
          onChangeText={setMissionLine}
          multiline
          errorText={errors.missionLine}
          helperText="Example: Building a stronger baseline without the fake grind."
        />
        <TextField
          label="City"
          value={city}
          onChangeText={setCity}
          helperText="Optional, but useful for a believable prototype profile."
        />
      </View>
      <Card title="Profile preview">
        <Text style={styles.previewName}>{name || "Your name"}</Text>
        <Text style={styles.previewUsername}>@{username || "username"}</Text>
        <Text style={styles.bodyCopy}>
          {missionLine || "Your mission line will preview here."}
        </Text>
        <View style={styles.wrap}>
          {onboardingDraft.pillars.map((pillar) => (
            <Pill key={pillar} label={pillar} />
          ))}
        </View>
      </Card>
    </StepShell>
  );
}

export function ConnectHealthScreen() {
  const router = useRouter();
  const {
    connectHealth,
    enableManualFallback,
    healthConnection,
    healthLoading,
    healthSnapshot,
    healthPreviewActive,
    manualFallbackEnabled,
  } = useMomentumSession();

  const statusCopy = useMemo(() => {
    switch (healthConnection.state) {
      case "connected":
        return healthPreviewActive
          ? "Demo preview is active with seeded Apple Health-style metrics for a believable demo path."
          : "Apple Health is connected and the first proof bundle is available.";
      case "connected_limited":
        return "Apple Health is connected, but one or more first-pass metrics still need coverage.";
      case "needs_attention":
        return "Permissions or coverage still need attention before the full proof layer is ready.";
      case "unavailable":
        return "This environment cannot complete the Apple Health path, so manual fallback is your safe bridge.";
      case "error":
        return healthConnection.lastError ?? "The Apple Health bridge hit an unexpected error.";
      case "authorizing":
        return "Authorizing Apple Health and checking the first workout bundle.";
      default:
        return "Connect Apple Health to bring workouts, steps, sleep, and active energy into the app.";
    }
  }, [healthConnection.lastError, healthConnection.state, healthPreviewActive]);

  const connectionTone = useMemo(() => {
    switch (healthConnection.state) {
      case "connected":
        return "success" as const;
      case "connected_limited":
      case "needs_attention":
        return "warning" as const;
      case "unavailable":
      case "error":
        return "danger" as const;
      default:
        return "neutral" as const;
    }
  }, [healthConnection.state]);

  const canContinue =
    manualFallbackEnabled ||
    healthConnection.state === "connected" ||
    healthConnection.state === "connected_limited";

  return (
    <StepShell
      step={5}
      total={7}
      title="Connect Apple Health"
      subtitle="This first build treats Apple Health as the primary proof layer. Manual entry only catches the gaps."
      backHref="/(onboarding)/profile-basics"
      footer={
        <Button
          label="Choose your squad"
          disabled={!canContinue}
          onPress={() => router.replace("/(onboarding)/squad")}
        />
      }
    >
      <Card title="Connection state" subtitle="A development build is the intended path for this integration.">
        <View style={styles.row}>
          <Badge
            label={formatConnectionState(healthConnection.state)}
            tone={connectionTone}
          />
          {healthPreviewActive ? (
            <Badge label="Demo preview" tone="accent" />
          ) : null}
          {manualFallbackEnabled ? (
            <Badge label="Manual fallback" tone="warning" />
          ) : null}
        </View>
        <Text style={styles.bodyCopy}>{statusCopy}</Text>

        {healthLoading ? (
          <View style={styles.stack}>
            <LoadingSkeleton height={16} width="72%" />
            <LoadingSkeleton height={16} width="58%" />
            <LoadingSkeleton height={64} />
          </View>
        ) : null}

        {healthSnapshot ? (
          <View style={styles.metricsWrap}>
            {healthSnapshot.metrics.map((metric) => (
              <MetricPill
                key={metric.key}
                label={formatMetricLabel(metric.key)}
                value={String(metric.value ?? 0)}
                unit={metric.unit}
              />
            ))}
          </View>
        ) : null}
        {healthConnection.state === "unavailable" ||
        healthConnection.state === "needs_attention" ||
        healthConnection.state === "error" ? (
          <ErrorState
            title="Apple Health still needs attention"
            message={
              healthConnection.state === "error"
                ? statusCopy
                : "That’s expected until the app runs in an iOS development build on a physical device. You can still keep the flow moving with manual fallback."
            }
          />
        ) : null}
        {manualFallbackEnabled ? (
          <Card subtitle="Fallback enabled">
            <Text style={styles.bodyCopy}>
              Manual entry will stay available only where coverage is missing or
              the connection cannot complete.
            </Text>
          </Card>
        ) : null}
        <View style={styles.stack}>
          <Button
            label="Connect Apple Health"
            loading={healthLoading}
            onPress={() => connectHealth()}
          />
          <Button
            label={healthPreviewActive ? "Refresh demo preview" : "Use demo preview data"}
            variant="secondary"
            onPress={() => connectHealth({ preview: true })}
          />
          <Button
            label="Use manual fallback"
            variant="ghost"
            onPress={enableManualFallback}
          />
        </View>
      </Card>

      <Card title="Coverage needed for v0.1" subtitle="The first believable proof bundle is workouts, steps, sleep, and active energy.">
        {healthConnection.coverage.map((item) => (
          <StatRow
            key={item.key}
            label={formatMetricLabel(item.key)}
            value={item.available ? "Available" : "Missing"}
            hint={formatCoverageReason(item.reason)}
          />
        ))}
      </Card>

      <Card title="Privacy posture" subtitle="Health data trust has to be explicit in the first demo.">
        <Text style={styles.bodyCopy}>
          Raw HealthKit data stays on-device in the intended native path. Shared posts
          use normalized summaries, not a public stream of private metrics.
        </Text>
      </Card>
    </StepShell>
  );
}

export function SquadStepScreen() {
  const router = useRouter();
  const { currentUser, setSelectedSquad } = useMomentumSession();

  return (
    <StepShell
      step={6}
      total={7}
      title="Choose a squad to anchor the first loop"
      subtitle="This step is skippable, but squads remain the main accountability surface in v0.1."
      backHref="/(onboarding)/connect-health"
      footer={
        <View style={styles.stack}>
          <Button
            label="See my recap"
            onPress={() => router.replace("/(onboarding)/recap")}
          />
          <Button
            label="Skip for now"
            variant="ghost"
            onPress={() => {
              setSelectedSquad(undefined);
              router.replace("/(onboarding)/recap");
            }}
          />
        </View>
      }
    >
      <View style={styles.stack}>
        {squadsSeed.map((squad) => (
          <SelectableCard
            key={squad.id}
            title={squad.name}
            subtitle={`${squad.memberCount} people • ${squad.currentFocus}`}
            selected={currentUser.selectedSquadId === squad.id}
            onPress={() => setSelectedSquad(squad.id)}
          />
        ))}
      </View>
    </StepShell>
  );
}

export function RecapScreen() {
  const router = useRouter();
  const {
    completeOnboarding,
    consistency,
    currentUser,
    healthConnection,
    healthPreviewActive,
    squads,
  } = useMomentumSession();

  const selectedSquad = squads.find((squad) => squad.id === currentUser.selectedSquadId);

  return (
    <StepShell
      step={7}
      total={7}
      title="You’re set up to show the work"
      subtitle="The next move is a fast workout check-in that lands in a believable social context."
      backHref="/(onboarding)/squad"
      footer={
        <Button
          label="Start first workout check-in"
          onPress={() => {
            completeOnboarding();
            router.replace("/(app)/check-in");
          }}
        />
      }
    >
      <Card title={currentUser.name} subtitle={`@${currentUser.username}`}>
        <Text style={styles.bodyCopy}>{currentUser.missionLine}</Text>
        <View style={styles.wrap}>
          {currentUser.pillars.map((pillar) => (
            <Pill key={pillar} label={pillar} />
          ))}
        </View>
        <View style={styles.row}>
          <Badge label={formatConnectionState(healthConnection.state)} tone="accent" />
          {healthPreviewActive ? <Badge label="Demo preview" tone="accent" /> : null}
          {selectedSquad ? <Badge label={selectedSquad.name} tone="neutral" /> : null}
        </View>
      </Card>
      <ConsistencyCard consistency={consistency} compact />
    </StepShell>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
    gap: theme.spacing.lg,
    justifyContent: "space-between",
  },
  hero: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    minHeight: 260,
    justifyContent: "flex-end",
  },
  heroTitle: {
    ...theme.typography.hero,
    color: theme.color.fg.inverse,
  },
  heroBody: {
    ...theme.typography.body,
    color: theme.color.fg.inverse,
    maxWidth: 280,
  },
  stepHeader: {
    gap: theme.spacing.sm,
  },
  progressTrack: {
    flexDirection: "row",
    gap: theme.spacing.xxs,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: theme.radius.pill,
  },
  progressSegmentActive: {
    backgroundColor: theme.color.accent.energy,
  },
  progressSegmentIdle: {
    backgroundColor: theme.color.stroke.subtle,
  },
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    ...theme.typography.title,
    color: theme.color.fg.primary,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.color.fg.secondary,
  },
  body: {
    gap: theme.spacing.md,
  },
  footer: {
    gap: theme.spacing.sm,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  stack: {
    gap: theme.spacing.sm,
  },
  bodyCopy: {
    ...theme.typography.body,
    color: theme.color.fg.secondary,
  },
  previewName: {
    ...theme.typography.heading,
    color: theme.color.fg.primary,
  },
  previewUsername: {
    ...theme.typography.caption,
    color: theme.color.fg.muted,
  },
  selectableCard: {
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth.regular,
    borderColor: theme.color.stroke.subtle,
    backgroundColor: theme.color.bg.surface,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  selectableCardSelected: {
    borderColor: theme.color.accent.energy,
    backgroundColor: theme.color.bg.elevated,
  },
  selectableTitle: {
    ...theme.typography.label,
    color: theme.color.fg.primary,
  },
  selectableSubtitle: {
    ...theme.typography.bodySmall,
    color: theme.color.fg.secondary,
  },
  metricsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
});
