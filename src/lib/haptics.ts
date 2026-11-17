import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

async function run(effect: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  try {
    await effect();
  } catch {
    // Haptics are unavailable on some devices. The action still stands.
  }
}

export function hapticLogged() {
  return run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function hapticGoal() {
  return run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export function hapticSheet() {
  return run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}
