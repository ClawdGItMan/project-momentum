import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/design";
import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import { Card, Screen, StatRow } from "@/src/ui/primitives";

export default function ConsistencyDetailModal() {
  const { consistency } = useMomentumSession();

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Consistency detail</Text>
        <Card subtitle="A rolling 7-day score that rewards showing up over looking impressive.">
          <StatRow
            label="Score"
            value={consistency.score}
            hint={consistency.label}
          />
          <StatRow
            label="Check-in rate"
            value={`${Math.round(consistency.breakdown.checkInRate * 100)}%`}
            hint="40% weight"
          />
          <StatRow
            label="Habit completion"
            value={`${Math.round(consistency.breakdown.habitCompletionRate * 100)}%`}
            hint="40% weight"
          />
          <StatRow
            label="Workout presence"
            value={`${Math.round(consistency.breakdown.workoutRate * 100)}%`}
            hint="20% weight when fitness is active"
          />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: theme.spacing.md,
  },
  title: {
    ...theme.typography.title,
    color: theme.color.fg.primary,
  },
});
