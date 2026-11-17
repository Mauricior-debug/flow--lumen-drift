import { useScrollRef } from '../../../lib/chrome';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ProgressRing } from '../../../components/charts';
import { AppHeader, EmptyState, GlassIcon, PrimaryButton, Screen } from '../../../components/ui';
import { dayKey, formatClock, formatFullDate, parseDayKey } from '../../../lib/dates';
import { useUserOnly } from '../../../lib/guards';
import { useStore } from '../../../lib/store';
import { oneParam } from '../../../lib/text';
import { convertAmount, formatAmount, fromMl, goalMl, percentOf, roundForUnit, totalMl } from '../../../lib/units';
import { colors, radius, space, type } from '../../../theme/tokens';

export default function DayDetailScreen() {
  useUserOnly();
  const params = useLocalSearchParams<{ date: string }>();
  const key = oneParam(params.date);
  const date = parseDayKey(key);
  const { session, logs } = useStore();
  const ref = useScrollRef('day');

  if (!session) return <Screen tabs><AppHeader back /></Screen>;

  const dayLogs = logs.filter((log) => dayKey(new Date(log.timestamp)) === key);
  const currentMl = totalMl(dayLogs);
  const percent = percentOf(currentMl, goalMl(session.hydrationGoal, session.units));
  const shown = roundForUnit(fromMl(currentMl, session.units), session.units);

  return (
    <Screen tabs footer={<PrimaryButton label="Add Water" onPress={() => router.push(`/add-water?date=${key}`)} />}>
      <AppHeader back />
      <ScrollView ref={ref} style={styles.flex} contentContainerStyle={styles.content}>
        <Text style={[type.h1, styles.center]}>{formatFullDate(date)}</Text>
        <ProgressRing current={shown} goal={session.hydrationGoal} unit={session.units} percent={percent} />
        <Text style={type.h2}>Water logs</Text>
        {dayLogs.length === 0 ? (
          <EmptyState title="No water logged" body="Nothing was recorded for this day." />
        ) : (
          <View style={styles.list}>
            {dayLogs.map((log, index) => (
              <View key={log.id} style={[styles.row, index > 0 && styles.rowBorder]}>
                <GlassIcon size={26} />
                <Text style={styles.time}>{formatClock(new Date(log.timestamp))}</Text>
                <Text style={styles.amount}>{formatAmount(convertAmount(log.amount, log.unit, session.units), session.units)}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Edit entry"
                  onPress={() => router.push(`/edit-log/${log.id}`)}
                  style={({ pressed }) => [styles.icon, pressed && styles.pressed]}
                >
                  <Ionicons name="pencil" size={18} color={colors.primary} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete entry"
                  onPress={() => router.push(`/confirm-delete?kind=log&id=${log.id}`)}
                  style={({ pressed }) => [styles.icon, pressed && styles.pressed]}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
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
  center: { textAlign: 'center' },
  list: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: space.md, paddingRight: 4 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  time: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 16, color: colors.ink },
  amount: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.ink },
  icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.55 },
});
