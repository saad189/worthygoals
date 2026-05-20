import * as Haptics from 'expo-haptics';

const PERSONALITY_PATTERNS: Record<string, () => Promise<void>> = {
  marcus: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  lyra: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  goggs: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
};

export function triggerPersonalityHaptic(personalityId?: string | null): void {
  const pattern = PERSONALITY_PATTERNS[personalityId?.toLowerCase() ?? ''];
  const fire = pattern ?? (() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  fire().catch(() => {});
}

export function triggerSelectionHaptic(): void {
  Haptics.selectionAsync().catch(() => {});
}

export function triggerSuccessHaptic(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
