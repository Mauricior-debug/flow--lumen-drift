import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/ui';
import { formatClock, formatFullDate, formatTimeString, repeatLabel } from '../lib/dates';
import { hapticSheet } from '../lib/haptics';
import { useStore } from '../lib/store';
import { oneParam } from '../lib/text';
import { formatAmount } from '../lib/units';
import { colors, radius, space, type } from '../theme/tokens';

export default function ConfirmDeleteScreen() {
  const params = useLocalSearchParams<{ kind?: string; id?: string }>();
  const kind = oneParam(params.kind);
  const id = oneParam(params.id);
  const { logs, reminders, deleteLog, deleteReminder } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const translateY = useSharedValue(0);

  const log = logs.find((item) => item.id === id);
  const reminder = reminders.find((item) => item.id === id);
  const missing = kind === 'reminder' ? !reminder : !log;

  useEffect(() => {
    void hapticSheet();
  }, []);

  function close() {
    router.back();
  }

  async function confirm() {
    setLoading(true);
    const result = kind === 'reminder' ? await deleteReminder(id) : await deleteLog(id);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    close();
  }

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > height * 0.16 || event.velocityY > 900) {
        translateY.value = withTiming(height, { duration: 180 }, (finished) => {
          if (finished) runOnJS(close)();
        });
        return;
      }
      translateY.value = withSpring(0, { damping: 22, stiffness: 220 });
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const title = kind === 'reminder' ? 'Delete this reminder?' : 'Delete this entry?';
  const detail = kind === 'reminder' && reminder
    ? `${formatTimeString(reminder.time)} · ${repeatLabel(reminder.repeatPattern, reminder.customDays)}`
    : log
      ? `${formatAmount(log.amount, log.unit)} at ${formatClock(new Date(log.timestamp))} on ${formatFullDate(new Date(log.timestamp))}`
      : 'This item is no longer here.';

  const body = (
    <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
      {Platform.OS === 'web' ? <View style={styles.grabber} /> : null}
      <Text style={type.h1}>{title}</Text>
      <Text style={type.bodyMuted}>{missing ? 'This item is no longer here.' : `${detail} This can’t be undone.`}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {missing ? (
        <PrimaryButton label="Close" variant="secondary" onPress={close} />
      ) : (
        <View style={styles.actions}>
          <PrimaryButton label="Keep" variant="secondary" onPress={close} />
          <PrimaryButton label="Delete" variant="danger" onPress={() => void confirm()} loading={loading} />
        </View>
      )}
    </View>
  );

  if (Platform.OS !== 'web') return <View style={styles.native}>{body}</View>;

  return (
    <View style={styles.webRoot}>
      <Pressable accessibilityLabel="Dismiss" style={StyleSheet.absoluteFill} onPress={close} />
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.webSheet, sheetStyle]}>{body}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  native: { flex: 1, backgroundColor: colors.white, paddingTop: space.lg },
  webRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(8, 20, 40, 0.4)' },
  webSheet: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheet: { paddingHorizontal: space.xl, paddingTop: space.md, gap: space.md },
  grabber: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: '#D5DEE8',
    marginBottom: space.sm,
  },
  actions: { gap: space.sm },
  error: { color: colors.danger, fontFamily: 'Inter_400Regular' },
});
