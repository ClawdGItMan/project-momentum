import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { CharacterProfile, PillarRating } from "@/src/domain/models";
import type { MuscleGroupRating } from "@/src/domain/character/muscleGroups";
import { theme } from "@/src/design";
import { ScrollScreen } from "@/src/ui/primitives";
import {
  AchievementsGrid,
  CharacterSilhouette,
  MomentumScoreCard,
  PillarMap,
  PillarRatingCard,
} from "@/src/ui/composites";

type CharacterScreenProps = {
  character: CharacterProfile;
  muscleGroups: MuscleGroupRating[];
  userName: string;
  missionLine: string;
};

export function CharacterScreen({
  character,
  muscleGroups,
  userName,
  missionLine,
}: CharacterScreenProps) {
  return (
    <ScrollScreen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.mission}>{missionLine}</Text>
        </View>

        {/* Character Silhouette — the hero */}
        <CharacterSilhouette
          muscleGroups={muscleGroups}
          momentumScore={character.momentumScore}
          momentumTier={character.momentumTier}
        />

        {/* Momentum Score Summary */}
        <MomentumScoreCard character={character} compact />

        {/* Pillar Map Overview */}
        <PillarMap ratings={character.pillarRatings} />

        {/* Individual Pillar Breakdowns */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pillar breakdown</Text>
          {character.pillarRatings.map((rating: PillarRating) => (
            <PillarRatingCard key={rating.pillar} rating={rating} />
          ))}
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <AchievementsGrid unlocked={character.achievements} />
        </View>
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.xs,
  },
  name: {
    ...theme.typography.title,
    color: theme.color.fg.primary,
  },
  mission: {
    ...theme.typography.body,
    color: theme.color.fg.secondary,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.heading,
    color: theme.color.fg.primary,
  },
});
