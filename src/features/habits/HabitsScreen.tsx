import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { theme } from "@/src/design";
import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import { ConsistencyCard } from "@/src/ui/composites/ConsistencyCard";
import { Button, Card, EmptyState, ScrollScreen } from "@/src/ui/primitives";

export function HabitsScreen() {
  const router = useRouter();
  const { addHabit, consistency, habits, toggleHabit } = useMomentumSession();
  const [addHabitError, setAddHabitError] = useState<string | null>(null);
  const [addHabitLoading, setAddHabitLoading] = useState(false);

  const handleAddHabit = async () => {
    if (addHabitLoading || habits.length >= 3) {
      return;
    }

    setAddHabitError(null);
    setAddHabitLoading(true);

    try {
      await addHabit();
    } catch (error) {
      setAddHabitError(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Unable to add a habit right now.",
      );
    } finally {
      setAddHabitLoading(false);
    }
  };

  return (
    <ScrollScreen contentContainerStyle={styles.screenContent}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Habits</Text>
          <Button
            label="Score detail"
            variant="ghost"
            fullWidth={false}
            onPress={() => router.push("/modals/consistency-detail")}
          />
        </View>

        <ConsistencyCard consistency={consistency} compact />

        {habits.length ? (
          <View style={styles.list}>
            {habits.map((habit) => (
              <Card
                key={habit.id}
                title={habit.title}
                subtitle={`${habit.cadence} • ${Math.round(
                  habit.completionRate * 100,
                )}% completion rate`}
              >
                <Text style={styles.helper}>
                  {habit.friendVisible
                    ? "Shared with friends by default."
                    : "Private until you decide otherwise."}
                </Text>
                <Button
                  label={habit.completedToday ? "Completed today" : "Mark complete"}
                  variant={habit.completedToday ? "secondary" : "primary"}
                  onPress={() => toggleHabit(habit.id)}
                />
              </Card>
            ))}
          </View>
        ) : (
          <EmptyState
            title="Start with one habit"
            message="One or two visible habits are enough to make consistency feel concrete."
            actionLabel="Add a habit"
            onActionPress={() => void handleAddHabit()}
          />
        )}

        <Button
          label={habits.length >= 3 ? "Habit limit reached" : "Add one more habit"}
          variant="secondary"
          disabled={habits.length >= 3}
          loading={addHabitLoading}
          onPress={() => void handleAddHabit()}
        />
        {addHabitError ? <Text style={styles.error}>{addHabitError}</Text> : null}
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
  },
  container: {
    gap: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.title,
    color: theme.color.fg.primary,
  },
  helper: {
    ...theme.typography.bodySmall,
    color: theme.color.fg.secondary,
  },
  error: {
    ...theme.typography.bodySmall,
    color: theme.color.accent.danger,
  },
  list: {
    gap: theme.spacing.md,
  },
});
