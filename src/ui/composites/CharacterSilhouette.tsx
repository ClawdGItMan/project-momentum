import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { G, Path } from "react-native-svg";

import type { MomentumTier } from "@/src/domain/models";
import type { MuscleGroupKey, MuscleGroupRating } from "@/src/domain/character/muscleGroups";
import { getTierColor } from "@/src/domain/character/tierColors";
import { tierThresholds } from "@/src/domain/character/tiers";
import { theme } from "@/src/design";

type CharacterSilhouetteProps = {
  muscleGroups: MuscleGroupRating[];
  momentumScore: number;
  momentumTier: MomentumTier;
};

function colorForGroup(
  groups: MuscleGroupRating[],
  key: MuscleGroupKey,
): string {
  const group = groups.find((g) => g.key === key);
  if (!group) return "#2A2A2A";
  return getTierColor(group.tier);
}

// ─── SVG Paths for anatomical body (front view, viewBox 0 0 200 440) ────────

const bodyPaths: Record<MuscleGroupKey, string> = {
  // Head/Traps area
  traps:
    "M82 68 C82 62 86 58 92 56 L108 56 C114 58 118 62 118 68 L118 82 C114 86 108 88 100 88 C92 88 86 86 82 82 Z",

  // Shoulders — left and right delts
  shoulders:
    "M62 88 C56 88 50 92 48 98 L46 118 C48 120 52 120 56 118 L66 102 C68 96 66 90 62 88 Z " +
    "M138 88 C144 88 150 92 152 98 L154 118 C152 120 148 120 144 118 L134 102 C132 96 134 90 138 88 Z",

  // Chest — pec area
  chest:
    "M72 92 L82 88 L100 86 L118 88 L128 92 L130 108 C128 118 118 124 100 126 C82 124 72 118 70 108 Z",

  // Back — not visible from front, represented as mid-back outline
  back:
    "M76 126 L124 126 L126 158 C122 164 108 168 100 168 C92 168 78 164 74 158 Z",

  // Biceps
  biceps:
    "M56 118 L48 120 L42 144 C42 150 44 154 48 154 L56 152 C60 148 62 140 62 132 Z " +
    "M144 118 L152 120 L158 144 C158 150 156 154 152 154 L144 152 C140 148 138 140 138 132 Z",

  // Triceps (behind biceps, slightly offset)
  triceps:
    "M60 132 L56 152 L52 168 C54 172 58 172 60 168 L64 148 C64 140 62 136 60 132 Z " +
    "M140 132 L144 152 L148 168 C146 172 142 172 140 168 L136 148 C136 140 138 136 140 132 Z",

  // Forearms
  forearms:
    "M48 154 L42 178 L38 204 C38 208 42 210 44 208 L52 186 L56 168 C54 160 50 156 48 154 Z " +
    "M152 154 L158 178 L162 204 C162 208 158 210 156 208 L148 186 L144 168 C146 160 150 156 152 154 Z",

  // Abs
  abs:
    "M84 128 L116 128 L118 160 L116 192 C112 196 108 198 100 198 C92 198 88 196 84 192 L82 160 Z",

  // Quads
  quads:
    "M76 198 L84 196 L92 198 L94 240 L92 280 C90 286 86 288 82 286 L76 280 C72 272 70 250 72 230 Z " +
    "M124 198 L116 196 L108 198 L106 240 L108 280 C110 286 114 288 118 286 L124 280 C128 272 130 250 128 230 Z",

  // Hamstrings (behind quads, slightly different shape)
  hamstrings:
    "M78 284 L72 276 L70 252 L72 230 L76 200 C74 200 72 204 70 210 L66 252 L68 284 C70 290 74 292 78 288 Z " +
    "M122 284 L128 276 L130 252 L128 230 L124 200 C126 200 128 204 130 210 L134 252 L132 284 C130 290 126 292 122 288 Z",

  // Glutes
  glutes:
    "M82 192 L100 196 L118 192 L120 210 C116 218 108 222 100 222 C92 222 84 218 80 210 Z",

  // Calves
  calves:
    "M74 290 L80 286 L86 290 L88 320 L86 356 C84 362 80 364 78 362 L72 356 C70 346 70 320 74 300 Z " +
    "M126 290 L120 286 L114 290 L112 320 L114 356 C116 362 120 364 122 362 L128 356 C130 346 130 320 126 300 Z",
};

// Neck (always dark base)
const neckPath =
  "M90 56 L92 56 L108 56 L110 56 L112 68 C108 72 104 74 100 74 C96 74 92 72 88 68 Z";

// Head
const headPath =
  "M100 8 C86 8 76 20 76 36 C76 52 86 60 100 60 C114 60 124 52 124 36 C124 20 114 8 100 8 Z";

// Hands
const handsPath =
  "M36 204 C34 210 34 216 36 220 C38 224 40 224 42 220 L44 210 Z " +
  "M164 204 C166 210 166 216 164 220 C162 224 160 224 158 220 L156 210 Z";

// Feet
const feetPath =
  "M70 358 L68 374 C68 380 72 384 80 384 C86 384 90 380 90 376 L88 358 Z " +
  "M130 358 L132 374 C132 380 128 384 120 384 C114 384 110 380 110 376 L112 358 Z";

export function CharacterSilhouette({
  muscleGroups,
  momentumScore,
  momentumTier,
}: CharacterSilhouetteProps) {
  return (
    <View style={styles.card}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.title}>Muscle Overview</Text>
        <Text style={styles.scoreText}>
          Score: <Text style={styles.scoreHighlight}>{momentumScore}</Text>
        </Text>
      </View>

      {/* Tier legend */}
      <View style={styles.legend}>
        {tierThresholds.map((t) => (
          <View key={t.tier} style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: getTierColor(t.tier) }]}
            />
            <Text style={styles.legendLabel}>{t.tier}</Text>
          </View>
        ))}
      </View>

      {/* Body + side labels */}
      <View style={styles.bodyRow}>
        {/* Left labels */}
        <View style={styles.sideLabels}>
          <MuscleLabel groups={muscleGroups} muscleKey="shoulders" y={88} />
          <MuscleLabel groups={muscleGroups} muscleKey="chest" y={108} />
          <MuscleLabel groups={muscleGroups} muscleKey="triceps" y={150} />
          <MuscleLabel groups={muscleGroups} muscleKey="abs" y={170} />
          <MuscleLabel groups={muscleGroups} muscleKey="quads" y={240} />
          <MuscleLabel groups={muscleGroups} muscleKey="calves" y={330} />
        </View>

        {/* SVG Body */}
        <View style={styles.svgWrap}>
          <Svg width={200} height={400} viewBox="0 0 200 400">
            {/* Dark silhouette base */}
            <Path d={headPath} fill="#1A1A2E" />
            <Path d={neckPath} fill="#1A1A2E" />
            <Path d={handsPath} fill="#1A1A2E" />
            <Path d={feetPath} fill="#1A1A2E" />

            {/* Muscle groups — colored by tier */}
            <G>
              {(Object.keys(bodyPaths) as MuscleGroupKey[]).map((key) => (
                <Path
                  key={key}
                  d={bodyPaths[key]}
                  fill={colorForGroup(muscleGroups, key)}
                  opacity={0.9}
                  stroke="#0D0D1A"
                  strokeWidth={0.8}
                />
              ))}
            </G>

            {/* Outline for definition */}
            <Path d={headPath} fill="none" stroke="#333355" strokeWidth={1} />
            <Path d={neckPath} fill="none" stroke="#333355" strokeWidth={0.5} />
            <Path d={handsPath} fill="none" stroke="#333355" strokeWidth={0.5} />
            <Path d={feetPath} fill="none" stroke="#333355" strokeWidth={0.5} />
          </Svg>
        </View>

        {/* Right labels */}
        <View style={styles.sideLabels}>
          <MuscleLabel groups={muscleGroups} muscleKey="traps" y={68} />
          <MuscleLabel groups={muscleGroups} muscleKey="back" y={140} />
          <MuscleLabel groups={muscleGroups} muscleKey="biceps" y={134} />
          <MuscleLabel groups={muscleGroups} muscleKey="forearms" y={180} />
          <MuscleLabel groups={muscleGroups} muscleKey="glutes" y={208} />
          <MuscleLabel groups={muscleGroups} muscleKey="hamstrings" y={270} />
        </View>
      </View>
    </View>
  );
}

function MuscleLabel({
  groups,
  muscleKey,
}: {
  groups: MuscleGroupRating[];
  muscleKey: MuscleGroupKey;
  y: number;
}) {
  const group = groups.find((g) => g.key === muscleKey);
  const score = group?.score ?? 0;
  const tier = group?.tier ?? "Newcomer";
  const color = group ? getTierColor(tier) : "#555";

  return (
    <View style={styles.muscleLabel}>
      <View style={[styles.muscleDot, { backgroundColor: color }]} />
      <View>
        <Text style={styles.muscleName}>{group?.label ?? muscleKey}</Text>
        <Text style={[styles.muscleTier, { color }]}>{tier}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0D0D1A",
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    ...theme.typography.heading,
    color: "#FFFFFF",
  },
  scoreText: {
    ...theme.typography.bodySmall,
    color: "#888",
  },
  scoreHighlight: {
    ...theme.typography.metric,
    color: "#FFFFFF",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    ...theme.typography.caption,
    color: "#AAA",
    fontSize: 10,
  },
  bodyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sideLabels: {
    flex: 1,
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  svgWrap: {
    width: 200,
    height: 400,
  },
  muscleLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  muscleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  muscleName: {
    ...theme.typography.caption,
    color: "#FFFFFF",
    fontSize: 11,
  },
  muscleTier: {
    ...theme.typography.caption,
    fontSize: 9,
  },
});
