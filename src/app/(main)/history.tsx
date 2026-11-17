import { useMemo, useRef, useState, type ComponentRef } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { IntakeChart } from '../../components/charts';
import { AppHeader, EmptyState, Screen } from '../../components/ui';
import { useRegisterScroll, useSection } from '../../lib/chrome';
import { dayKey, formatFullDate, lastNDays, parseDayKey } from '../../lib/dates';
import { useUserOnly } from '../../lib/guards';
import { useStore } from '../../lib/store';
import { formatAmount, fromMl, goalMl, percentOf, roundForUnit, totalMl } from '../../lib/units';
import { colors, radius, space, type } from '../../theme/tokens';

type Range = '7' | '30' | 'all';
type DayRow = { key: string; date: Date; ml: number; count: number };

export default function HistoryScreen() {
  useUserOnly();
  useSection('history');
  const { logs, session } = useStore();
  const [range, setRange] = useState<Range>('7');
  const ref = useRef<ComponentRef<typeof FlatList<DayRow>>>(null);
  const toTop = () => ref.current?.scrollToOffset({ offset: 0, animated: true });
  useRegisterScroll('history', toTop);

  const rows = useMemo(() => {
    if (!session) return [];
    const keys = new Set(logs.map((log) => dayKey(new Date(log.timestamp))));
    let days = range === '7' ? lastNDays(7) : range === '30' ? lastNDays(30) : [];
    if (range === 'all') {
      const all = Array.from(keys);
      all.push(dayKey(new Date()));
      days = Array.from(new Set(all)).sort().map((key) => parseDayKey(key));
    }
    return days.map((date) => {
      const key = dayKey(date);
      const dayLogs = logs.filter((log) => dayKey(new Date(log.timestamp)) === key);
      const ml = totalMl(dayLogs);
      return { key, date, ml, count: dayLogs.length };
    });
  }, [logs, range, session]);

  if (!session) return <Screen tabs><AppHeader right="profile" /></Screen>;

  const target = goalMl(session.hydrationGoal, session.units);
  const everLogged = logs.length > 0;

  return (
    <Screen tabs>
      <FlatList
        ref={ref}
        style={styles.flex}
        data={everLogged ? rows : []}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <AppHeader right="profile" />
            <Text style={type.h1}>History</Text>
            <View style={styles.segment}>
              {([['7', '7 Days'], ['30', '30 Days'], ['all', 'All Time']] as const).map(([id, label]) => {
                const selected = range === id;
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setRange(id)}
                    style={({ pressed }) => [styles.segmentItem, selected && styles.segmentOn, pressed && styles.pressed]}
                  >
                    <Text style={[styles.segmentLabel, selected && styles.segmentLabelOn]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {everLogged ? (
              <IntakeChart points={rows.map((row) => ({ date: row.date, ml: row.ml }))} goalMl={target} unit={session.units} />
            ) : (
              <EmptyState title="No history yet" body="Log a drink and your days will collect here." />
            )}
          </View>
        }
        renderItem={({ item }) => {
          const percent = percentOf(item.ml, target);
          const amount = roundForUnit(fromMl(item.ml, session.units), session.units);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${formatFullDate(item.date)}, ${formatAmount(amount, session.units)}`}
              onPress={() => router.push(`/day/${item.key}`)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <Text style={styles.day}>{formatFullDate(item.date)}</Text>
              <Text style={styles.amount}>{formatAmount(amount, session.units)}</Text>
              <Text style={styles.percent}>{`${percent}%`}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.faint} />
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={<View style={{ height: 12 }} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space.xl, paddingBottom: space.xl },
  headerBlock: { gap: space.md, marginHorizontal: -space.xl, paddingHorizontal: space.xl },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.soft,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segmentItem: { flex: 1, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: colors.primary },
  segmentLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink },
  segmentLabelOn: { color: colors.white },
  pressed: { opacity: 0.7 },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    paddingHorizontal: space.md,
  },
  separator: { height: 1, backgroundColor: colors.line, marginLeft: space.md },
  day: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.ink },
  amount: { fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink },
  percent: { width: 52, textAlign: 'right', fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.success },
});
