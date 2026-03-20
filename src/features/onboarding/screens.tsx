import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { type Href, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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
  ErrorState,
  LoadingSkeleton,
  MetricPill,
  Pill,
  ScrollScreen,
  StatRow,
  TextField,
} from "@/src/ui/primitives";
import {
  AmbientEditorialPanel,
  ConsistencyCard,
  EditorialIconBadge,
} from "@/src/ui/composites";

type StepShellProps = {
  step: number;
  total: number;
  title: string;
  subtitle: string;
  backHref?: Href;
  children: React.ReactNode;
  footer: React.ReactNode;
};

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const goalEditorialCopy: Record<
  (typeof goalOptions)[number],
  { eyebrow: string; subtitle: string; note?: string; icon: IconName }
> = {
  "Train more consistently": {
    eyebrow: "Steady rhythm",
    subtitle: "Build a visible cadence so your circle sees the reps, not just the intention.",
    icon: "barbell-outline",
  },
  "Sleep 7+ hours": {
    eyebrow: "Recovery first",
    subtitle: "Make better sleep part of the proof layer instead of a private guess.",
    icon: "moon-outline",
  },
  "Build mental sharpness": {
    eyebrow: "Clear focus",
    subtitle: "Track the habits that keep your head clean when the week gets crowded.",
    icon: "sparkles-outline",
  },
  "Stay accountable with friends": {
    eyebrow: "Trusted people",
    subtitle: "Keep your effort visible to people who know your baseline and want you to win.",
    icon: "people-outline",
  },
  "Finish what I start": {
    eyebrow: "Follow-through",
    subtitle: "Let the app recognize consistency, not just big declarations.",
    icon: "checkmark-circle-outline",
  },
};

const pillarEditorialCopy: Record<
  FocusPillar,
  { eyebrow: string; subtitle: string; icon: IconName }
> = {
  fitness: {
    eyebrow: "Movement",
    subtitle: "Workouts, physical effort, and the proof that you showed up.",
    icon: "barbell-outline",
  },
  mindset: {
    eyebrow: "State of mind",
    subtitle: "Mental clarity, discipline, and the systems that keep you steady.",
    icon: "sparkles-outline",
  },
  learning: {
    eyebrow: "Growth",
    subtitle: "Reading, studying, and the work that expands your range over time.",
    icon: "book-outline",
  },
  recovery: {
    eyebrow: "Repair",
    subtitle: "Sleep, restoration, and the signals that keep momentum sustainable.",
    icon: "moon-outline",
  },
};

const sharingEditorialCopy: Record<
  AccountabilityStyle,
  { eyebrow: string; title: string; subtitle: string; icon: IconName; note?: string }
> = {
  friends: {
    eyebrow: "Accountability lane",
    title: "Friends keep me honest",
    subtitle: "Mutual accountability with people who already know your baseline.",
    icon: "people-outline",
  },
  "squad-first": {
    eyebrow: "Accountability lane",
    title: "A squad keeps me committed",
    subtitle:
      "Private groups give your progress a shared rhythm and stronger accountability.",
    icon: "shield-checkmark-outline",
    note: "Tighter rhythm",
  },
  mixed: {
    eyebrow: "Accountability lane",
    title: "I need both",
    subtitle: "Friends for daily proof, squads for a tighter rhythm.",
    icon: "layers-outline",
  },
};

function getInitials(name?: string) {
  const source = name?.trim();
  if (!source) {
    return "OM";
  }

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

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
      <View style={styles.chromeRow}>
        <HiddenDevToolsTrigger>
          <Text style={styles.wordmark}>OUTTCAST</Text>
        </HiddenDevToolsTrigger>
        {backHref ? (
          <Pressable onPress={() => router.replace(backHref)}>
            <Text style={styles.backLink}>Back</Text>
          </Pressable>
        ) : (
          <Text style={styles.topNote}>Private by design</Text>
        )}
      </View>
      <View style={styles.stepHeader}>
        <HiddenDevToolsTrigger>
          <Badge label={`Step ${step} / ${total}`} tone="accent" />
        </HiddenDevToolsTrigger>
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

function SelectionSlab({
  eyebrow,
  icon,
  title,
  subtitle,
  selected,
  onPress,
  metaLabel,
}: {
  eyebrow: string;
  icon?: IconName;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  metaLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.selectionSlab, selected && styles.selectionSlabSelected]}
    >
      <View style={styles.selectionSlabTop}>
        <View style={styles.selectionLead}>
          {icon ? (
            <View style={styles.selectionIconTile}>
              <View style={styles.selectionIconGlowPrimary} />
              <View style={styles.selectionIconGlowSecondary} />
              <Ionicons
                name={icon}
                size={22}
                color={selected ? theme.color.accent.energy : theme.color.fg.secondary}
              />
            </View>
          ) : null}
          <Text style={styles.selectionEyebrow}>{eyebrow}</Text>
        </View>
        <View style={styles.selectionStatus}>
          {selected ? (
            <Badge label="Selected" tone="accent" />
          ) : metaLabel ? (
            <Text style={styles.selectionMeta}>{metaLabel}</Text>
          ) : null}
        </View>
      </View>
      <Text style={styles.selectionTitle}>{title}</Text>
      <Text style={styles.selectionSubtitle}>{subtitle}</Text>
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
      <View style={styles.chromeRow}>
        <HiddenDevToolsTrigger>
          <Text style={styles.wordmark}>OUTTCAST</Text>
        </HiddenDevToolsTrigger>
        <Text style={styles.topNote}>Private by design</Text>
      </View>
      <LinearGradient
        colors={[theme.color.bg.surface, theme.color.bg.elevated, "#E7EEFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Badge label="Curated invitation" tone="accent" />
        <Text style={styles.heroTitle}>Show the work.</Text>
        <Text style={styles.heroBody}>
          Turn workouts, habits, and recovery into visible momentum with people
          who want to see you win.
        </Text>
      </LinearGradient>

      <View style={styles.welcomeGrid}>
        <AmbientEditorialPanel
          title="Trusted circle"
          description="Share progress where effort is understood instead of broadcast."
          eyebrow="Selective social"
          icon="users"
          badgeLabel="Private lane"
          tone="cobalt"
          style={styles.welcomeMoodPanel}
        />
        <AmbientEditorialPanel
          title="Health-backed proof"
          description="Let Apple Health support the story without making your life public."
          eyebrow="Proof layer"
          icon="activity"
          badgeLabel="Signal first"
          tone="teal"
          style={styles.welcomeMoodPanel}
        />
      </View>

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
      <View style={styles.stack}>
        {goalOptions.map((goal) => (
          <SelectionSlab
            key={goal}
            eyebrow={goalEditorialCopy[goal].eyebrow}
            icon={goalEditorialCopy[goal].icon}
            title={goal}
            subtitle={goalEditorialCopy[goal].subtitle}
            selected={selected.includes(goal)}
            onPress={() => toggleGoal(goal)}
            metaLabel={goalEditorialCopy[goal].note}
          />
        ))}
      </View>
      <View style={styles.editorialNote}>
        <Text style={styles.editorialNoteEyebrow}>Private by default</Text>
        <Text style={styles.editorialNoteBody}>
          Start with the improvements you want the app to notice first. You can keep
          everything else out of view until it matters.
        </Text>
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
      <View style={styles.stack}>
        {pillarOptions.map((pillar) => (
          <SelectionSlab
            key={pillar.value}
            eyebrow={pillarEditorialCopy[pillar.value].eyebrow}
            icon={pillarEditorialCopy[pillar.value].icon}
            title={pillar.label}
            subtitle={pillarEditorialCopy[pillar.value].subtitle}
            selected={selected.includes(pillar.value)}
            onPress={() => togglePillar(pillar.value)}
          />
        ))}
      </View>
      <View style={styles.editorialNote}>
        <Text style={styles.editorialNoteEyebrow}>Visible pillars</Text>
        <Text style={styles.editorialNoteBody}>
          Share the progress that helps your circle understand your momentum. Keep
          everything else on your own terms.
        </Text>
      </View>
    </StepShell>
  );
}

export function SharingScreen() {
  const router = useRouter();
  const { onboardingDraft, setAccountabilityStyle } = useMomentumSession();
  const selected = onboardingDraft.accountabilityStyle;

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
        {(Object.entries(sharingEditorialCopy) as [
          AccountabilityStyle,
          (typeof sharingEditorialCopy)[AccountabilityStyle],
        ][]).map(([value, option]) => (
          <SelectionSlab
            key={value}
            eyebrow={option.eyebrow}
            icon={option.icon}
            title={option.title}
            subtitle={option.subtitle}
            selected={selected === value}
            onPress={() => setAccountabilityStyle(value)}
            metaLabel={option.note}
          />
        ))}
      </View>
      <View style={styles.editorialNote}>
        <Text style={styles.editorialNoteEyebrow}>How sharing starts</Text>
        <Text style={styles.editorialNoteBody}>
          Your first check-in starts with Friends unless you post from a squad. Home
          still opens on Squads so accountability feels grounded in people, not
          broadcasting.
        </Text>
      </View>
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
      <LinearGradient
        colors={[theme.color.bg.surface, theme.color.bg.elevated, "#E7EEFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.identityHero}
      >
        <View style={styles.identityHeroTop}>
          <View style={styles.identityStamp}>
            <LinearGradient
              colors={[theme.color.bg.surface, "#E5EEFF", "#C9DCF8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.identityStampFill}
            >
              <View style={styles.identityStampGlowPrimary} />
              <View style={styles.identityStampGlowSecondary} />
              <Text style={styles.identityStampText}>{getInitials(name)}</Text>
            </LinearGradient>
          </View>
          <View style={styles.identitySignalRow}>
            <EditorialIconBadge icon="user" label="Mission-led" tone="cobalt" />
            <EditorialIconBadge
              icon="shield"
              label="Trusted circle"
              tone="graphite"
            />
          </View>
        </View>
        <Text style={styles.identityEyebrow}>Mission-led profile</Text>
        <Text style={styles.identityMission}>
          {missionLine || "Write the line that tells people what you are building toward."}
        </Text>
        <View style={styles.identityMeta}>
          <View style={styles.identityNames}>
            <Text style={styles.identityName}>{name || "Your name"}</Text>
            <Text style={styles.identityUsername}>@{username || "username"}</Text>
          </View>
          <View style={styles.wrap}>
            {onboardingDraft.pillars.map((pillar) => (
              <Pill key={pillar} label={pillar} />
            ))}
          </View>
        </View>
      </LinearGradient>

      <View style={styles.stack}>
        <Card title="Identity">
          <TextField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Max Stone"
            errorText={errors.name}
          />
          <TextField
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholder="maxmomentum"
            errorText={errors.username}
            helperText="People only see this inside the circles you choose."
          />
        </Card>
        <Card title="Direction">
          <TextField
            label="Mission line"
            value={missionLine}
            onChangeText={setMissionLine}
            multiline
            placeholder="Building a stronger baseline, one honest check-in at a time."
            errorText={errors.missionLine}
            helperText="One clean line is enough. Let the proof underneath earn it."
          />
          <TextField
            label="City"
            value={city}
            onChangeText={setCity}
            placeholder="New York"
            helperText="Optional, if place matters to your story."
          />
        </Card>
      </View>
      <View style={styles.editorialNote}>
        <Text style={styles.editorialNoteEyebrow}>Private identity</Text>
        <Text style={styles.editorialNoteBody}>
          The profile is built for your trusted circle. It should feel earned, lived-in,
          and specific before the first piece of proof lands.
        </Text>
      </View>
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
      <Card
        title="Health-backed proof"
        subtitle="Syncing makes your updates faster, clearer, and more grounded in what you actually did."
        elevated
      >
        <View style={styles.healthSignalRow}>
          <EditorialIconBadge icon="activity" label="Live proof" tone="teal" compact />
          <EditorialIconBadge icon="lock" label="Private summary" tone="graphite" compact />
          <EditorialIconBadge
            icon="shield"
            label="Trusted by default"
            tone="champagne"
            compact
          />
        </View>
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
          <View style={styles.editorialNoteSoft}>
            <Text style={styles.editorialNoteBody}>{healthConnection.lastError}</Text>
          </View>
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
          <View style={styles.editorialNoteSoft}>
            <Text style={styles.editorialNoteEyebrow}>Manual fallback is active</Text>
            <Text style={styles.editorialNoteBody}>
              You can still share workouts and progress even when syncing is not ready
              yet.
            </Text>
          </View>
        ) : null}
        <View style={styles.stack}>
          <Button
            label="Connect Apple Health"
            loading={healthLoading}
            onPress={() => void connectHealth()}
          />
          {!manualFallbackEnabled ? (
            <Button
              label="Use manual entry for now"
              variant="ghost"
              onPress={enableManualFallback}
            />
          ) : null}
        </View>
      </Card>

      <Card
        title="Coverage and privacy"
        subtitle="Outtcast looks for workouts, steps, sleep, and active energy, then turns them into a readable proof layer."
      >
        {healthConnection.coverage.map((item) => (
          <StatRow
            key={item.key}
            label={formatMetricLabel(item.key)}
            value={item.available ? "Available" : "Missing"}
            hint={formatCoverageReason(item.reason)}
          />
        ))}
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
            elevated
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
          <SelectionSlab
            key={squad.id}
            eyebrow={squad.handle === "day-ones" ? "Starter room" : "Private squad"}
            icon={squad.handle === "day-ones" ? "people-circle-outline" : "shield-outline"}
            title={squad.name}
            subtitle={`${squad.memberCount} people • ${squad.currentFocus}`}
            selected={currentUser.selectedSquadId === squad.id}
            onPress={() => setSelectedSquad(squad.id)}
            metaLabel={squad.handle === "day-ones" ? "Open now" : undefined}
          />
        ))}
      </View>
      <View style={styles.editorialNote}>
        <Text style={styles.editorialNoteEyebrow}>Skip is okay</Text>
        <Text style={styles.editorialNoteBody}>
          You can start with Friends and choose a tighter room later. The goal is
          accountability, not friction.
        </Text>
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
    <ScrollScreen contentContainerStyle={styles.screenContent}>
      <View style={styles.chromeRow}>
        <HiddenDevToolsTrigger>
          <Text style={styles.wordmark}>OUTTCAST</Text>
        </HiddenDevToolsTrigger>
        <Pressable onPress={() => router.replace("/(onboarding)/squad")}>
          <Text style={styles.backLink}>Back</Text>
        </Pressable>
      </View>
      <View style={styles.stepHeader}>
        <Badge label="Step 7 / 7" tone="accent" />
        <View style={styles.progressTrack}>
          {Array.from({ length: 7 }, (_, index) => (
            <View
              key={`recap-progress-${index + 1}`}
              style={[
                styles.progressSegment,
                styles.progressSegmentActive,
              ]}
            />
          ))}
        </View>
      </View>
      <LinearGradient
        colors={[theme.color.bg.surface, theme.color.bg.elevated, "#E7EEFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.recapHero}
      >
        <View style={styles.recapTopRow}>
          <View style={styles.recapStamp}>
            <LinearGradient
              colors={[theme.color.bg.surface, "#E5EEFF", "#C9DCF8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.recapStampFill}
            >
              <View style={styles.recapStampGlowPrimary} />
              <View style={styles.recapStampGlowSecondary} />
              <Text style={styles.recapStampText}>{getInitials(currentUser.name)}</Text>
            </LinearGradient>
          </View>
          <View style={styles.recapBadgeColumn}>
            <EditorialIconBadge icon="activity" label="Ready to post" tone="cobalt" />
            <EditorialIconBadge icon="users" label="Trusted room" tone="graphite" />
          </View>
        </View>
        <Text style={styles.recapEyebrow}>Your lane is ready</Text>
        <Text style={styles.recapHeroTitle}>You’re set up to show the work.</Text>
        <Text style={styles.recapHeroBody}>
          Next up: share one honest workout so your circle can see the work without
          any extra noise.
        </Text>
        <View style={styles.recapIdentity}>
          <Text style={styles.previewName}>{currentUser.name}</Text>
          <Text style={styles.previewUsername}>@{currentUser.username}</Text>
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
        </View>
      </LinearGradient>
      <ConsistencyCard consistency={consistency} compact />
      <View style={styles.editorialNote}>
        <Text style={styles.editorialNoteEyebrow}>First move</Text>
        <Text style={styles.editorialNoteBody}>
          Keep the note short, let the proof lead, and publish into the lane that feels
          most honest.
        </Text>
      </View>
      {submitError ? (
        <ErrorState
          title="Setup still needs one fix"
          message={submitError}
        />
      ) : null}
      <View style={styles.footer}>
        <Button
          label="Start first workout check-in"
          loading={submitting}
          onPress={() => void submit()}
        />
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
    gap: theme.spacing.xl,
  },
  chromeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wordmark: {
    ...theme.typography.caption,
    color: theme.color.fg.primary,
    letterSpacing: 2.2,
  },
  backLink: {
    ...theme.typography.label,
    color: theme.color.accent.energy,
  },
  topNote: {
    ...theme.typography.caption,
    color: theme.color.fg.secondary,
    letterSpacing: 0.6,
  },
  hero: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    minHeight: 240,
    justifyContent: "flex-end",
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.stroke.subtle,
  },
  heroTitle: {
    ...theme.typography.hero,
    color: theme.color.fg.primary,
  },
  heroBody: {
    ...theme.typography.body,
    color: theme.color.fg.secondary,
    maxWidth: 320,
  },
  welcomeGrid: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  welcomeMoodPanel: {
    flex: 1,
    minHeight: 220,
  },
  stepHeader: {
    gap: theme.spacing.md,
    maxWidth: 340,
  },
  progressTrack: {
    flexDirection: "row",
    gap: theme.spacing.xxs,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: theme.radius.pill,
  },
  progressSegmentActive: {
    backgroundColor: theme.color.accent.energy,
  },
  progressSegmentIdle: {
    backgroundColor: theme.color.stroke.subtle,
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
    gap: theme.spacing.lg,
  },
  footer: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
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
  identityHero: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.stroke.subtle,
  },
  identityEyebrow: {
    ...theme.typography.caption,
    color: theme.color.accent.energy,
    letterSpacing: 0.8,
  },
  identityHeroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  identityStamp: {
    width: 112,
    height: 124,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.stroke.subtle,
    backgroundColor: theme.color.bg.surface,
  },
  identityStampFill: {
    flex: 1,
    justifyContent: "flex-end",
    padding: theme.spacing.md,
  },
  identityStampGlowPrimary: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 88,
    top: -14,
    right: -8,
    backgroundColor: "rgba(122, 163, 214, 0.26)",
  },
  identityStampGlowSecondary: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 76,
    left: -12,
    bottom: -10,
    backgroundColor: "rgba(243, 224, 202, 0.42)",
  },
  identityStampText: {
    ...theme.typography.hero,
    color: theme.color.fg.primary,
    letterSpacing: -1.4,
  },
  identitySignalRow: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: theme.spacing.xs,
  },
  identityMission: {
    ...theme.typography.heading,
    fontFamily: theme.typography.title.fontFamily,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: theme.color.fg.primary,
  },
  identityMeta: {
    gap: theme.spacing.sm,
  },
  identityNames: {
    gap: theme.spacing.xxs,
  },
  identityName: {
    ...theme.typography.heading,
    color: theme.color.fg.primary,
  },
  identityUsername: {
    ...theme.typography.caption,
    color: theme.color.fg.secondary,
  },
  selectionSlab: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.bg.surface,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.stroke.subtle,
  },
  selectionSlabSelected: {
    borderColor: theme.color.accent.energy,
    backgroundColor: theme.color.bg.elevated,
  },
  selectionSlabTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
  },
  selectionLead: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flexShrink: 1,
  },
  selectionIconTile: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.color.bg.elevated,
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.stroke.subtle,
  },
  selectionIconGlowPrimary: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 64,
    top: -16,
    right: -10,
    backgroundColor: "rgba(92, 142, 206, 0.22)",
  },
  selectionIconGlowSecondary: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 48,
    left: -10,
    bottom: -8,
    backgroundColor: "rgba(243, 224, 202, 0.34)",
  },
  selectionEyebrow: {
    ...theme.typography.caption,
    color: theme.color.fg.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  selectionStatus: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  selectionMeta: {
    ...theme.typography.caption,
    color: theme.color.fg.muted,
  },
  selectionTitle: {
    ...theme.typography.heading,
    fontFamily: theme.typography.title.fontFamily,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.4,
    color: theme.color.fg.primary,
  },
  selectionSubtitle: {
    ...theme.typography.bodySmall,
    color: theme.color.fg.secondary,
  },
  editorialNote: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.bg.elevated,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  editorialNoteSoft: {
    borderRadius: theme.radius.md,
    backgroundColor: "#F6F8FD",
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  editorialNoteEyebrow: {
    ...theme.typography.caption,
    color: theme.color.fg.muted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  editorialNoteBody: {
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
  healthSignalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  recapHero: {
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.stroke.subtle,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  recapTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.md,
  },
  recapStamp: {
    width: 92,
    height: 108,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.stroke.subtle,
    backgroundColor: theme.color.bg.surface,
  },
  recapStampFill: {
    flex: 1,
    justifyContent: "flex-end",
    padding: theme.spacing.md,
  },
  recapStampGlowPrimary: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 72,
    top: -14,
    right: -6,
    backgroundColor: "rgba(92, 142, 206, 0.24)",
  },
  recapStampGlowSecondary: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 56,
    left: -8,
    bottom: -10,
    backgroundColor: "rgba(243, 224, 202, 0.38)",
  },
  recapStampText: {
    ...theme.typography.heading,
    fontFamily: theme.typography.title.fontFamily,
    color: theme.color.fg.primary,
    letterSpacing: -0.8,
  },
  recapBadgeColumn: {
    flex: 1,
    alignItems: "flex-end",
    gap: theme.spacing.xs,
  },
  recapEyebrow: {
    ...theme.typography.caption,
    color: theme.color.accent.energy,
    letterSpacing: 0.8,
  },
  recapHeroTitle: {
    ...theme.typography.title,
    color: theme.color.fg.primary,
  },
  recapHeroBody: {
    ...theme.typography.body,
    color: theme.color.fg.secondary,
  },
  recapIdentity: {
    gap: theme.spacing.sm,
  },
});
