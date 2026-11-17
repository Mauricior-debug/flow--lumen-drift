import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AmountEditor, GoalHint } from '../components/forms';
import { BrandMark, PrimaryButton, Screen, Wordmark } from '../components/ui';
import { useGuestOnly } from '../lib/guards';
import { useStore } from '../lib/store';
import type { Unit } from '../lib/types';
import { goalIsValid, recommendedGoal } from '../lib/units';
import { colors, space, type } from '../theme/tokens';

export default function OnboardingScreen() {
  useGuestOnly();
  const { draft, setDraftGoal } = useStore();
  const [value, setValue] = useState(String(draft.hydrationGoal || recommendedGoal(draft.units)));
  const [unit, setUnit] = useState<Unit>(draft.units);
  const [error, setError] = useState<string | null>(null);

  function continueWith(nextValue: string, nextUnit: Unit) {
    const amount = Number(nextValue);
    const problem = goalIsValid(amount, nextUnit);
    if (problem) {
      setError(problem);
      return;
    }
    setDraftGoal(amount, nextUnit);
    router.push('/sign-up');
  }

  return (
    <Screen wave>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <BrandMark size={88} />
          <Wordmark size={28} />
        </View>
        <Text style={[type.hero, styles.center]}>A healthier you starts with water</Text>
        <Text style={[type.bodyMuted, styles.center]}>
          Stay hydrated, feel better, and bring out your brightest self.
        </Text>
        <AmountEditor
          label="Daily water goal"
          value={value}
          unit={unit}
          error={error}
          onChange={(nextValue, nextUnit) => {
            setValue(nextValue);
            setUnit(nextUnit);
            setError(null);
          }}
        />
        <GoalHint unit={unit} />
        <PrimaryButton label="Next" onPress={() => continueWith(value, unit)} />
        <PrimaryButton
          label="Skip"
          variant="text"
          onPress={() => continueWith(String(recommendedGoal(unit)), unit)}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.xl, paddingBottom: 200, gap: space.lg },
  hero: { alignItems: 'center', gap: 8, marginTop: space.lg },
  center: { textAlign: 'center' },
});
