import React, { ComponentProps, ReactNode } from "react";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { theme } from "@/src/design";
import { Surface } from "@/src/ui/primitives";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

export type EditorialIconBadgeTone =
  | "cobalt"
  | "teal"
  | "champagne"
  | "graphite"
  | "inverse";

type EditorialIconBadgeProps = {
  icon: FeatherIconName;
  label?: string;
  tone?: EditorialIconBadgeTone;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

const iconToneStyles = {
  cobalt: {
    container: {
      backgroundColor: "#E7EEFF",
      borderColor: theme.color.stroke.subtle,
    },
    icon: theme.color.accent.energy,
    label: theme.color.accent.energy,
  },
  teal: {
    container: {
      backgroundColor: "#EAF1EF",
      borderColor: "#D8E3DD",
    },
    icon: theme.color.accent.consistency,
    label: theme.color.accent.consistency,
  },
  champagne: {
    container: {
      backgroundColor: "#FBF1E4",
      borderColor: "#EAD9BE",
    },
    icon: theme.color.accent.warning,
    label: theme.color.accent.warning,
  },
  graphite: {
    container: {
      backgroundColor: theme.color.bg.elevated,
      borderColor: theme.color.stroke.subtle,
    },
    icon: theme.color.fg.primary,
    label: theme.color.fg.secondary,
  },
  inverse: {
    container: {
      backgroundColor: "rgba(255, 255, 255, 0.12)",
      borderColor: "rgba(255, 255, 255, 0.18)",
    },
    icon: theme.color.fg.inverse,
    label: theme.color.fg.inverse,
  },
} satisfies Record<
  EditorialIconBadgeTone,
  {
    container: ViewStyle;
    icon: string;
    label: string;
  }
>;

export function EditorialIconBadge({
  icon,
  label,
  tone = "cobalt",
  compact = false,
  style,
}: EditorialIconBadgeProps) {
  const toneStyles = iconToneStyles[tone];

  return (
    <View
      style={[
        styles.badge,
        compact ? styles.badgeCompact : styles.badgeDefault,
        toneStyles.container,
        style,
      ]}
    >
      <Feather
        name={icon}
        size={compact ? 13 : 15}
        color={toneStyles.icon}
        accessibilityLabel={label ?? icon}
      />
      {label ? (
        <Text style={[styles.badgeLabel, { color: toneStyles.label }]}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

export type AmbientEditorialPanelStat = {
  label: string;
  value: string;
  hint?: string;
  icon?: FeatherIconName;
};

type AmbientEditorialPanelProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  tone?: "cobalt" | "teal" | "champagne";
  icon?: FeatherIconName;
  badgeLabel?: string;
  stats?: AmbientEditorialPanelStat[];
  footer?: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const panelToneStyles = {
  cobalt: {
    gradient: ["#0B1C30", "#163F74", "#5A8FB2"],
    glowA: "#7CB0D6",
    glowB: "#CFE3F5",
    glowC: "#203A56",
  },
  teal: {
    gradient: ["#0B1C30", "#24495B", "#88A8A2"],
    glowA: "#8DB7B0",
    glowB: "#D2E2DD",
    glowC: "#213D43",
  },
  champagne: {
    gradient: ["#0B1C30", "#7E5A2B", "#F0D4B0"],
    glowA: "#F4E5CF",
    glowB: "#FFEEDB",
    glowC: "#6B4B26",
  },
} satisfies Record<
  NonNullable<AmbientEditorialPanelProps["tone"]>,
  {
    gradient: [string, string, string];
    glowA: string;
    glowB: string;
    glowC: string;
  }
>;

export function AmbientEditorialPanel({
  eyebrow,
  title,
  description,
  tone = "cobalt",
  icon = "star",
  badgeLabel,
  stats,
  footer,
  children,
  style,
}: AmbientEditorialPanelProps) {
  const palette = panelToneStyles[tone];

  return (
    <Surface elevated style={[styles.panel, style]}>
      <LinearGradient
        pointerEvents="none"
        colors={palette.gradient}
        start={{ x: 0.08, y: 0.12 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View pointerEvents="none" style={[styles.glow, styles.glowTop, { backgroundColor: palette.glowA }]} />
      <View
        pointerEvents="none"
        style={[styles.glow, styles.glowBottom, { backgroundColor: palette.glowB }]}
      />
      <View
        pointerEvents="none"
        style={[styles.glow, styles.glowEdge, { backgroundColor: palette.glowC }]}
      />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <EditorialIconBadge icon={icon} tone="inverse" label={badgeLabel} />
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        </View>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
        {stats?.length ? (
          <View style={styles.statsRow}>
            {stats.map((stat) => (
              <View key={`${stat.label}-${stat.value}`} style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  {stat.icon ? (
                    <Feather
                      name={stat.icon}
                      size={13}
                      color={theme.color.fg.inverse}
                      accessibilityLabel={stat.label}
                    />
                  ) : null}
                </View>
                <View style={styles.statValueRow}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                </View>
                {stat.hint ? <Text style={styles.statHint}>{stat.hint}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}
        {children}
        {footer ? <Text style={styles.footer}>{footer}</Text> : null}
      </View>
    </Surface>
  );
}

const panelShadow =
  Platform.OS === "web"
    ? ({ boxShadow: "0px 18px 36px rgba(11, 28, 48, 0.12)" } as ViewStyle)
    : (theme.shadow.lift as ViewStyle);

const styles = StyleSheet.create({
  panel: {
    overflow: "hidden",
    borderWidth: theme.borderWidth.hairline,
    borderColor: "rgba(255, 255, 255, 0.16)",
    ...panelShadow,
  },
  glow: {
    position: "absolute",
    borderRadius: theme.radius.pill,
    opacity: 0.28,
  },
  glowTop: {
    width: 164,
    height: 164,
    top: -48,
    right: -36,
  },
  glowBottom: {
    width: 210,
    height: 210,
    left: -84,
    bottom: -96,
  },
  glowEdge: {
    width: 120,
    height: 120,
    right: 26,
    bottom: 44,
    opacity: 0.18,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  eyebrow: {
    ...theme.typography.caption,
    color: theme.color.fg.inverse,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    flexShrink: 1,
    textAlign: "right",
  },
  headerBlock: {
    gap: theme.spacing.xs,
    maxWidth: 310,
  },
  title: {
    ...theme.typography.title,
    color: theme.color.fg.inverse,
  },
  description: {
    ...theme.typography.body,
    color: "rgba(255, 255, 255, 0.86)",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  statCard: {
    minWidth: 124,
    flexGrow: 1,
    flexBasis: 124,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderWidth: theme.borderWidth.hairline,
    borderColor: "rgba(255, 255, 255, 0.16)",
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.caption,
    color: "rgba(255, 255, 255, 0.86)",
    letterSpacing: 0.7,
    flexShrink: 1,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  statValue: {
    ...theme.typography.metric,
    color: theme.color.fg.inverse,
  },
  statHint: {
    ...theme.typography.caption,
    color: "rgba(255, 255, 255, 0.74)",
  },
  footer: {
    ...theme.typography.caption,
    color: "rgba(255, 255, 255, 0.78)",
    letterSpacing: 0.5,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing.xs,
  },
  badgeDefault: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 7,
  },
  badgeCompact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeLabel: {
    ...theme.typography.caption,
    letterSpacing: 0.7,
  },
});
