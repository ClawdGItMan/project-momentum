import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/design";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen does not exist.</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go back to the app</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: theme.color.bg.canvas,
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.heading,
    color: theme.color.fg.primary,
  },
  link: {
    paddingVertical: 15,
  },
  linkText: {
    ...theme.typography.body,
    color: theme.color.accent.energy,
  },
});
