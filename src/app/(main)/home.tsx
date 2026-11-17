import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ProgressRing } from '../../components/charts';
import { AppHeader, EmptyState, FlashBanner, GlassIcon, PrimaryButton, Screen } from '../../components/ui';
import { useScrollRef, useSection } from '../../lib/chrome';
import { dayKey, formatClock, formatTodayLine } from '../../lib/dates';
import { useUserOnly } from '../../lib/guards';
import { hapticGoal, hapticLogged } from '../../lib/haptics';
import { useStore } from '../../lib/store';
import { formatTimeString } from '../../lib/dates';
import { convertAmount, formatAmount, formatNumber, fromMl, goalMl, percentOf, presetAmounts, roundForUnit, totalMl } from '../../lib/units';
import { colors, radius, space, type } from '../../theme/tokens';

export default function HomeScreen() {
  useUserOnly();
  useSection('home');
  const store = useStore();
  const ref = useScrollRef('home');

  useEffect(() => {
    if (store.flash === 'Daily goal reached') void hapticGoal();
  }, [store.flash]);

  const session = store.session;
  if (!session) {
    return (
      <Screen tabs>
        <AppHeader right="profile" />
      </Screen>
    );
  }

  const today = dayKey(new Date());
  const todays = store.logs.filter((log) => dayKey(new Date(log.timestamp)) === today);
  const currentMl = totalMl(todays);
  const targetMl = goalMl(session.hydrationGoal, session.units);
  const percent = percentOf(currentMl, targetMl);
  const shown = roundForUnit(fromMl(currentMl, session.units), session.units);
  const presets = presetAmounts(session.units);
  const units = session.units;

  async function quickAdd(amount: number) {
    const result = await store.addLog({
      amount,
      unit: units,
      timestamp: new Date().toISOString(),
    });
    if (result.ok) await hapticLogged();
  }

  return (
    <Screen
      tabs
      footer={<PrimaryButton label="Add Water" onPress={() => router.push('/add-water')} />}
    >
      <AppHeader right="profile" />
      <ScrollView ref={ref} style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.date}>{formatTodayLine(new Date())}</Text>
        {store.modeWarning ? <Text style={styles.warning}>{store.modeWarning}</Text> : null}
        <FlashBanner message={store.flash} />
        {store.due ? (
          <View style={styles.due}>
            <Text style={styles.dueText}>{`Time for water · ${formatTimeString(store.due.time)}`}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Dismiss reminder" onPress={store.dismissDue} style={styles.dismiss}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </Pressable>
          </View>
        ) : null}
        <ProgressRing current={shown} goal={session.hydrationGoal} unit={session.units} percent={percent} />
        <View style={styles.presets}>
          {presets.map((amount) => (
            <Pressable
              key={amount}
              accessibilityRole="button"
              accessibilityLabel={`Add ${amount} ${session.units}`}
              onPress={() => void quickAdd(amount)}
              style={({ pressed }) => [styles.preset, pressed && styles.presetPressed]}
            >
              <GlassIcon size={30} />
              <Text style={styles.presetValue}>{formatNumber(amount, session.units)}</Text>
              <Text style={styles.presetUnit}>{session.units}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={type.h2}>Today’s water</Text>
        {todays.length === 0 ? (
          <EmptyState title="Nothing logged yet" body="Add a glass whenever you drink. Quick amounts land here right away." />
        ) : (
          <View style={styles.list}>
            {todays.map((log, index) => (
              <View key={log.id} style={[styles.row, index > 0 && styles.rowBorder]}>
                <GlassIcon size={26} />
                <Text style={styles.rowTime}>{formatClock(new Date(log.timestamp))}</Text>
                <Text style={styles.rowAmount}>{formatAmount(convertAmount(log.amount, log.unit, session.units), session.units)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space.xl, paddingBottom: space.lg, gap: space.md },
  date: { ...type.h2, textAlign: 'center', fontSize: 20 },
  warning: { ...type.small, textAlign: 'center' },
  due: {
    backgroundColor: colors.mist,
    borderRadius: radius.md,
    padding: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  dueText: { flex: 1, fontFamily: 'Inter_600SemiBold', color: colors.ink, fontSize: 15 },
  dismiss: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  dismissText: { color: colors.primary, fontFamily: 'Inter_600SemiBold' },
  presets: { flexDirection: 'row', gap: 8 },
  preset: {
    flex: 1,
    minHeight: 96,
    backgroundColor: colors.chip,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 2,
  },
  presetPressed: { backgroundColor: '#D4E9FC', transform: [{ scale: 0.97 }] },
  presetValue: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink },
  presetUnit: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.muted },
  list: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line },
  row: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.md },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  rowTime: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 16, color: colors.ink },
  rowAmount: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.ink },
});
