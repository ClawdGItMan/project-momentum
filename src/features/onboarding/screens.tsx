import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { type Href, useRouter } from "expo-router";

import { theme } from "@/src/design";
import {
  goalOptions,
  pillarOptions,
} from "@/src/data/fixtures/appSeed";
import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import { HiddenDevToolsTrigger } from "@/src/features/dev/HiddenDevToolsTrigger";
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
          <HiddenDevToolsTrigger>
            <Badge label={`Step ${step} / ${total}`} tone="accent" />
          </HiddenDevToolsTrigger>
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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
}

export function WelcomeScreen() {
  const router = useRouter();

  return (
    <ScrollScreen contentContainerStyle={styles.screenContent}>
      <LinearGradient
        colors={["#0F172A", "#0E7490", "#E0F2FE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <HiddenDevToolsTrigger>
          <Badge label="Outtcast" tone="accent" />
        </HiddenDevToolsTrigger>
        <Text style={styles.heroTitle}>Show the work.</Text>
        <Text style={styles.heroBody}>
          Turn workouts, habits, and recovery into visible momentum with people
          who want to see you win.
        </Text>
      </LinearGradient>

      <Card
        title="Why people open Outtcast"
        subtitle="Progress feels different when your effort lives in a trusted circle instead of a noisy feed."
      >
        <Text style={styles.bodyCopy}>
          Keep your momentum visible, stay accountable with friends and squads,
          and let health data support the story without turning your life into a
          public performance.
        </Text>
      </Card>

      <View style={styles.footer}>
        <Button
          label="Start setup"
          onPress={() => router.replace("/(onboarding)/goals")}
        />
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
      subtitle="Start with the parts of your life you want people to understand at a glance."
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
      <Card subtitle="Share the progress that helps your circle understand your momentum. Keep everything else on your terms.">
        <Text style={styles.bodyCopy}>
          Your profile should feel focused and lived-in, not like a dashboard of
          everything you do.
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
      subtitle: "Private groups give your progress a shared rhythm and stronger accountability.",
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
      subtitle="Your circle stays intentional. No public feed, no public profile."
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
      <Card title="How sharing starts" subtitle="Your first check-in starts with Friends unless you post from a squad.">
        <Text style={styles.bodyCopy}>
          Home still opens on Squads to keep accountability grounded in real
          people, not broadcasting.
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
      name: name.trim() ? undefined : "Name helps your profile feel personal.",
      username: username.trim()
        ? undefined
        : "Pick a short handle for friend and squad context.",
      missionLine: missionLine.trim()
        ? undefined
        : "Add a one-line mission so people know what you are focused on.",
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
          helperText="People only see this inside the circles you choose."
        />
        <TextField
          label="Mission line"
          value={missionLine}
          onChangeText={setMissionLine}
          multiline
          errorText={errors.missionLine}
          helperText="Example: Rebuilding my baseline one strong week at a time."
        />
        <TextField
          label="City"
          value={city}
          onChangeText={setCity}
          helperText="Optional, if place matters to your story."
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
    manualFallbackEnabled,
  } = useMomentumSession();

  const statusCopy = useMemo(() => {
    switch (healthConnection.state) {
      case "connected":
        return "Apple Health is connected and ready to support your check-ins.";
      case "connected_limited":
        return "Apple Health is connected. Refresh after a little more recent activity or sleep data to fill out your summary.";
      case "needs_attention":
        return (
          healthConnection.lastError ??
          "Outtcast needs a little more access before your health summary can stay up to date. Review Apple Health sharing, then try again."
        );
      case "unavailable":
        return (
          healthConnection.lastError ??
          "Apple Health is not available right now. You can keep going with manual entry and reconnect later."
        );
      case "error":
        return (
          healthConnection.lastError ??
          "Apple Health could not finish syncing. Try again or keep moving with manual entry for now."
        );
      case "authorizing":
        return "Connecting Apple Health and pulling your latest summary.";
      default:
        return "Connect Apple Health to bring workouts, steps, sleep, and active energy into the app.";
    }
  }, [healthConnection.lastError, healthConnection.state]);

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
      subtitle="Sync Apple Health so workouts, sleep, steps, and active energy can support your check-ins."
      backHref="/(onboarding)/profile-basics"
      footer={
        <Button
          label="Choose your squad"
          disabled={!canContinue}
          onPress={() => router.replace("/(onboarding)/squad")}
        />
      }
    >
      <Card title="Connection state" subtitle="Syncing makes your updates faster, clearer, and more grounded in what you actually did.">
        <View style={styles.row}>
          <Badge
            label={formatConnectionState(healthConnection.state)}
            tone={connectionTone}
          />
          {manualFallbackEnabled ? (
            <Badge label="Manual entry active" tone="warning" />
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
        {(healthConnection.state === "connected" ||
          healthConnection.state === "connected_limited") &&
        healthConnection.lastError ? (
          <Card
            title="Health summary needs one more try"
            subtitle="Apple Health connected on this device, but the latest summary did not save cleanly yet."
          >
            <Text style={styles.bodyCopy}>{healthConnection.lastError}</Text>
          </Card>
        ) : null}
        {healthConnection.state === "unavailable" ||
        healthConnection.state === "needs_attention" ||
        healthConnection.state === "error" ? (
          <ErrorState
            title="Apple Health still needs attention"
            message={statusCopy}
          />
        ) : null}
        {manualFallbackEnabled ? (
          <Card subtitle="Manual entry is on">
            <Text style={styles.bodyCopy}>
              You can still share workouts and progress even when syncing is not
              ready yet.
            </Text>
          </Card>
        ) : null}
        <View style={styles.stack}>
          <Button
            label="Connect Apple Health"
            loading={healthLoading}
            onPress={() => void connectHealth()}
          />
          <Button
            label="Use manual entry for now"
            variant="ghost"
            onPress={enableManualFallback}
          />
        </View>
      </Card>

      <Card title="What sync can include" subtitle="Outtcast looks for workouts, steps, sleep, and active energy.">
        {healthConnection.coverage.map((item) => (
          <StatRow
            key={item.key}
            label={formatMetricLabel(item.key)}
            value={item.available ? "Available" : "Missing"}
            hint={formatCoverageReason(item.reason)}
          />
        ))}
      </Card>

      <Card title="Privacy posture" subtitle="Shared updates use a summary of your progress, not a stream of raw personal data.">
        <Text style={styles.bodyCopy}>
          Apple Health data stays private by default. Outtcast uses a simple
          summary to support the progress you choose to share.
        </Text>
      </Card>
    </StepShell>
  );
}

export function SquadStepScreen() {
  const router = useRouter();
  const { currentUser, joinDayOnesSquad, setSelectedSquad, squads } = useMomentumSession();
  const visibleSquads = squads;
  const [joiningDayOnes, setJoiningDayOnes] = useState(false);
  const [joinDayOnesError, setJoinDayOnesError] = useState<string | null>(null);
  const dayOnesSquad = visibleSquads.find((squad) => squad.handle === "day-ones");

  const joinStarterSquad = async () => {
    setJoinDayOnesError(null);
    setJoiningDayOnes(true);

    try {
      await joinDayOnesSquad();
    } catch (error) {
      setJoinDayOnesError(
        getErrorMessage(error, "Unable to join Day ones right now."),
      );
    } finally {
      setJoiningDayOnes(false);
    }
  };

  return (
    <StepShell
      step={6}
      total={7}
      title="Choose a squad to anchor the first loop"
      subtitle="Skip this for now, or choose a room that keeps your effort accountable."
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
        {!dayOnesSquad ? (
          <Card
            title="Join Day ones"
            subtitle="A starter squad for people building from the beginning."
          >
            <Text style={styles.bodyCopy}>
              Jump into a room where people are showing up, posting honestly, and
              helping each other stay consistent.
            </Text>
            <Button
              label="Join Day ones"
              loading={joiningDayOnes}
              onPress={() => void joinStarterSquad()}
            />
          </Card>
        ) : null}
        {joinDayOnesError ? (
          <ErrorState
            title="Couldn’t join Day ones"
            message={joinDayOnesError}
          />
        ) : null}
        {visibleSquads.map((squad) => (
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
    squads,
  } = useMomentumSession();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedSquad = squads.find((squad) => squad.id === currentUser.selectedSquadId);

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      await completeOnboarding();
      router.replace("/(app)/check-in");
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to finish onboarding."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StepShell
      step={7}
      total={7}
      title="You’re set up to show the work"
      subtitle="Next up: share your first workout so your circle can see the work."
      backHref="/(onboarding)/squad"
      footer={
        <Button
          label="Start first workout check-in"
          loading={submitting}
          onPress={() => void submit()}
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
          {selectedSquad ? <Badge label={selectedSquad.name} tone="neutral" /> : null}
        </View>
      </Card>
      <ConsistencyCard consistency={consistency} compact />
      {submitError ? (
        <ErrorState
          title="Setup still needs one fix"
          message={submitError}
        />
      ) : null}
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
