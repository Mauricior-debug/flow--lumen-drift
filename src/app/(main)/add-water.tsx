import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AmountEditor, FormActions, TimeField } from '../../components/forms';
import { AppHeader, Screen } from '../../components/ui';
import { parseDayKey } from '../../lib/dates';
import { useUserOnly } from '../../lib/guards';
import { hapticLogged } from '../../lib/haptics';
import { useStore } from '../../lib/store';
import { oneParam } from '../../lib/text';
import type { Unit } from '../../lib/types';
import { intakeIsValid, presetAmounts } from '../../lib/units';
import { space, type } from '../../theme/tokens';

export default function AddWaterScreen() {
  useUserOnly();
  const params = useLocalSearchParams<{ date?: string }>();
  const dateParam = oneParam(params.date);
  const { session, addLog } = useStore();
  const unit = session?.units ?? 'ml';
  const [value, setValue] = useState(String(presetAmounts(unit)[0]));
  const [chosenUnit, setChosenUnit] = useState<Unit>(unit);
  const [when, setWhen] = useState(() => {
    const now = new Date();
    if (!dateParam) return now;
    const date = parseDayKey(dateParam);
    date.setHours(now.getHours(), now.getMinutes(), 0, 0);
    return date;
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    const amount = Number(value);
    const problem = intakeIsValid(amount, chosenUnit);
    if (problem) {
      setError(problem);
      return;
    }
    setLoading(true);
    const result = await addLog({ amount, unit: chosenUnit, timestamp: when.toISOString() });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await hapticLogged();
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  return (
    <Screen
      tabs
      footer={<FormActions onCancel={() => router.back()} onSave={() => void save()} loading={loading} />}
    >
      <AppHeader back />
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={type.h1}>Add Water</Text>
        <Text style={type.bodyMuted}>Log your water intake</Text>
        <AmountEditor
          label="Amount"
          value={value}
          unit={chosenUnit}
          error={error}
          onChange={(nextValue, nextUnit) => {
            setValue(nextValue);
            setChosenUnit(nextUnit);
            setError(null);
          }}
        />
        <TimeField label="Time" value={when} onChange={setWhen} mode="datetime" />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space.xl, paddingBottom: space.xl, gap: space.md },
});
