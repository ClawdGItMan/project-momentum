import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/design";
import { Screen, Card, Badge } from "@/src/ui/primitives";

export default function AudienceSelectorModal() {
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Audience rules</Text>
        <Card title="Only me" subtitle="Private rehearsal space.">
          <Text style={styles.body}>Use this when you want a logged proof point without sharing it outward.</Text>
        </Card>
        <Card title="Friends" subtitle="Great for your close accountability circle.">
          <Text style={styles.body}>Mutual friends see the update by default because it keeps the loop intimate and simple.</Text>
        </Card>
        <Card title="Specific squad" subtitle="The tighter accountability surface.">
          <Text style={styles.body}>Use squads when the post belongs inside a shared rhythm or challenge.</Text>
          <Badge label="Primary accountability surface" tone="accent" />
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
  body: {
    ...theme.typography.body,
    color: theme.color.fg.secondary,
  },
});
