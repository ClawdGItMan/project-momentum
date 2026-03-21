import type {
  AchievementCategory,
  AchievementDefinition,
  CharacterProfile,
  UnlockedAchievement,
} from "./types";

export const achievementDefinitions: AchievementDefinition[] = [
  // Consistency achievements
  {
    id: "ach-first-checkin",
    key: "first_checkin",
    title: "First Step",
    description: "Complete your first check-in.",
    icon: "flag",
    category: "consistency",
    threshold: 1,
    thresholdUnit: "check-ins",
  },
  {
    id: "ach-week-streak",
    key: "week_streak",
    title: "Seven Strong",
    description: "Maintain a 7-day streak.",
    icon: "zap",
    category: "consistency",
    threshold: 7,
    thresholdUnit: "streak days",
  },
  {
    id: "ach-two-week-streak",
    key: "two_week_streak",
    title: "Locked In",
    description: "Maintain a 14-day streak.",
    icon: "award",
    category: "consistency",
    threshold: 14,
    thresholdUnit: "streak days",
  },
  {
    id: "ach-month-streak",
    key: "month_streak",
    title: "Unstoppable",
    description: "Maintain a 30-day streak.",
    icon: "shield",
    category: "consistency",
    threshold: 30,
    thresholdUnit: "streak days",
  },
  {
    id: "ach-ten-checkins",
    key: "ten_checkins",
    title: "Double Digits",
    description: "Complete 10 check-ins.",
    icon: "check-circle",
    category: "consistency",
    threshold: 10,
    thresholdUnit: "check-ins",
  },
  {
    id: "ach-fifty-checkins",
    key: "fifty_checkins",
    title: "Half Century",
    description: "Complete 50 check-ins.",
    icon: "star",
    category: "consistency",
    threshold: 50,
    thresholdUnit: "check-ins",
  },
  {
    id: "ach-hundred-checkins",
    key: "hundred_checkins",
    title: "Centurion",
    description: "Complete 100 check-ins.",
    icon: "sunrise",
    category: "consistency",
    threshold: 100,
    thresholdUnit: "check-ins",
  },

  // Fitness achievements
  {
    id: "ach-first-workout",
    key: "first_workout",
    title: "Iron Starter",
    description: "Log your first workout.",
    icon: "activity",
    category: "fitness",
    threshold: 1,
    thresholdUnit: "workouts",
  },
  {
    id: "ach-twenty-workouts",
    key: "twenty_workouts",
    title: "Gym Regular",
    description: "Log 20 workouts.",
    icon: "trending-up",
    category: "fitness",
    threshold: 20,
    thresholdUnit: "workouts",
  },

  // Recovery achievements
  {
    id: "ach-sleep-week",
    key: "sleep_week",
    title: "Sleep Scholar",
    description: "Log 7+ hours of sleep for 7 consecutive days.",
    icon: "moon",
    category: "recovery",
    threshold: 7,
    thresholdUnit: "nights",
  },

  // Social achievements
  {
    id: "ach-first-squad",
    key: "first_squad",
    title: "Squad Up",
    description: "Join your first squad.",
    icon: "users",
    category: "social",
    threshold: 1,
    thresholdUnit: "squads",
  },
  {
    id: "ach-did-this-too",
    key: "did_this_too_ten",
    title: "Solidarity",
    description: "React with 'Did this too' 10 times.",
    icon: "thumbs-up",
    category: "social",
    threshold: 10,
    thresholdUnit: "reactions",
  },

  // Mindset achievements
  {
    id: "ach-first-reflection",
    key: "first_reflection",
    title: "Inner Work",
    description: "Post your first reflection.",
    icon: "edit-3",
    category: "mindset",
    threshold: 1,
    thresholdUnit: "reflections",
  },

  // Learning achievements
  {
    id: "ach-learning-streak",
    key: "learning_streak",
    title: "Student Mode",
    description: "Complete learning habits 5 days in a row.",
    icon: "book-open",
    category: "learning",
    threshold: 5,
    thresholdUnit: "streak days",
  },
];

export function getAchievementById(
  id: string,
): AchievementDefinition | undefined {
  return achievementDefinitions.find((a) => a.id === id);
}

export function getAchievementsByCategory(
  category: AchievementCategory,
): AchievementDefinition[] {
  return achievementDefinitions.filter((a) => a.category === category);
}

export function checkNewAchievements(
  profile: CharacterProfile,
): AchievementDefinition[] {
  const unlockedIds = new Set(
    profile.achievements.map((a) => a.achievementId),
  );
  const newlyUnlocked: AchievementDefinition[] = [];

  for (const def of achievementDefinitions) {
    if (unlockedIds.has(def.id)) continue;

    let qualifies = false;
    switch (def.key) {
      case "first_checkin":
        qualifies = profile.totalCheckIns >= def.threshold;
        break;
      case "ten_checkins":
      case "fifty_checkins":
      case "hundred_checkins":
        qualifies = profile.totalCheckIns >= def.threshold;
        break;
      case "week_streak":
      case "two_week_streak":
      case "month_streak":
        qualifies = profile.longestStreak >= def.threshold;
        break;
      default:
        break;
    }

    if (qualifies) {
      newlyUnlocked.push(def);
    }
  }

  return newlyUnlocked;
}

export function buildUnlockedAchievement(
  achievementId: string,
): UnlockedAchievement {
  return {
    achievementId,
    unlockedAt: new Date().toISOString(),
  };
}
