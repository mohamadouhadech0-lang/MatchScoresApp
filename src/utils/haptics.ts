import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Fire-and-forget haptics. No-ops on web and never throws (e.g. devices without a motor). */
const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

export const haptics = {
  /** Light tick for taps on icons, tabs and list items. */
  tap() {
    if (enabled) Haptics.selectionAsync().catch(() => undefined);
  },
  /** Slightly stronger bump for primary actions and toggles. */
  impact() {
    if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  },
  success() {
    if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  },
};
