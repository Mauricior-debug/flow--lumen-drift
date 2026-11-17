import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AmountEditor, FormActions, TimeField } from '../../../components/forms';
import { AppHeader, ErrorState, Screen } from '../../../components/ui';
import { useUserOnly } from '../../../lib/guards';
import { useStore } from '../../../lib/store';
import { oneParam } from '../../../lib/text';
import { intakeIsValid } from '../../../lib/units';
import { space, type } from '../../../theme/tokens';

export default function EditWaterLogScreen() {
  useUserOnly();
  const params = useLocalSearchParams<{ id: string }>();
  const id = oneParam(params.id);
  const { logs, updateLog } = useStore();
  const log = logs.find((item) => item.id === id);
  const [value, setValue] = useState(log ? String(log.amount) : '');
  const [unit, setUnit] = useState(log?.unit ?? 'ml');
  const [when, setWhen] = useState(log ? new Date(log.timestamp) : new Date());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    const amount = Number(value);
    const problem = intakeIsValid(amount, unit);
    if (problem) {
      setError(problem);
      return;
    }
    setLoading(true);
    const result = await updateLog(id, { amount, unit, timestamp: when.toISOString() });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.back();
  }

  if (!log) {
    return (
      <Screen tabs>
        <AppHeader back />
        <ViewPad>
          <ErrorState message="That entry is no longer here." onRetry={() => router.back()} />
        </ViewPad>
      </Screen>
    );
  }

  return (
    <Screen tabs footer={<FormActions onCancel={() => router.back()} onSave={() => void save()} loading={loading} />}>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={type.h1}>Edit Water Log</Text>
        <Text style={type.bodyMuted}>Update the details for this entry.</Text>
        <AmountEditor
          label="Amount"
          value={value}
          unit={unit}
          error={error}
          onChange={(nextValue, nextUnit) => {
            setValue(nextValue);
            setUnit(nextUnit);
            setError(null);
          }}
        />
        <TimeField label="Time" value={when} onChange={setWhen} mode="datetime" />
      </ScrollView>
    </Screen>
  );
}

function ViewPad({ children }: { children: ReactNode }) {
  return <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.xl, paddingBottom: space.xl, gap: space.md },
});
