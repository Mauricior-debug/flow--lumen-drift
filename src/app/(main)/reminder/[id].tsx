import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { dateFromTime, FormActions, RepeatPicker, TimeField, timeFromDate } from '../../../components/forms';
import { AppHeader, ErrorState, Screen } from '../../../components/ui';
import { useUserOnly } from '../../../lib/guards';
import { useStore } from '../../../lib/store';
import { oneParam } from '../../../lib/text';
import type { RepeatPattern } from '../../../lib/types';
import { space, type } from '../../../theme/tokens';

export default function ReminderScreen() {
  useUserOnly();
  const params = useLocalSearchParams<{ id: string }>();
  const id = oneParam(params.id);
  const creating = id === 'new';
  const { reminders, saveReminder } = useStore();
  const existing = reminders.find((item) => item.id === id);
  const [when, setWhen] = useState(existing ? dateFromTime(existing.time) : dateFromTime('09:00'));
  const [pattern, setPattern] = useState<RepeatPattern>(existing?.repeatPattern ?? 'daily');
  const [days, setDays] = useState<number[]>(existing?.customDays ?? []);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    if (pattern === 'custom' && days.length === 0) {
      setError('Choose at least one day.');
      return;
    }
    setLoading(true);
    const result = await saveReminder({
      id: creating ? undefined : id,
      time: timeFromDate(when),
      repeatPattern: pattern,
      customDays: days,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.back();
  }

  if (!creating && !existing) {
    return (
      <Screen tabs>
        <AppHeader back />
        <ViewPad>
          <ErrorState message="That reminder is no longer here." onRetry={() => router.back()} />
        </ViewPad>
      </Screen>
    );
  }

  return (
    <Screen tabs footer={<FormActions onCancel={() => router.back()} onSave={() => void save()} loading={loading} />}>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={type.h1}>{creating ? 'Add Reminder' : 'Edit Reminder'}</Text>
        <Text style={type.bodyMuted}>
          {creating ? 'Set a reminder to drink water.' : 'Update this reminder.'}
        </Text>
        <TimeField label="Time" value={when} onChange={setWhen} mode="time" />
        <RepeatPicker
          pattern={pattern}
          customDays={days}
          onChange={(nextPattern, nextDays) => {
            setPattern(nextPattern);
            setDays(nextDays);
            setError(null);
          }}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </Screen>
  );
}

function ViewPad({ children }: { children: ReactNode }) {
  return <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.xl, paddingBottom: space.xl, gap: space.md },
  error: { color: '#DC4C4C', fontFamily: 'Inter_400Regular', fontSize: 14 },
});
