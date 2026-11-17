import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AmountEditor } from '../../components/forms';
import { AppHeader, PrimaryButton, Screen, Toggle } from '../../components/ui';
import { useScrollRef, useSection } from '../../lib/chrome';
import { useUserOnly } from '../../lib/guards';
import { useStore } from '../../lib/store';
import { goalIsValid } from '../../lib/units';
import { colors, radius, space, type } from '../../theme/tokens';

export default function ProfileScreen() {
  useUserOnly();
  useSection('profile');
  const { session, updateProfile, signOut, reminderWarning } = useStore();
  const ref = useScrollRef('profile');
  const [goal, setGoal] = useState(session ? String(session.hydrationGoal) : '2000');
  const [unit, setUnit] = useState(session?.units ?? 'ml');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session) return;
    setGoal(String(session.hydrationGoal));
    setUnit(session.units);
  }, [session]);

  if (!session) return <Screen tabs><AppHeader right="notifications" /></Screen>;

  async function commitGoal(nextValue = goal, nextUnit = unit) {
    const amount = Number(nextValue);
    const problem = goalIsValid(amount, nextUnit);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    const result = await updateProfile({ hydrationGoal: amount, units: nextUnit });
    setSaving(false);
    if (!result.ok) setError(result.error);
  }

  return (
    <Screen tabs>
      <ScrollView ref={ref} style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppHeader right="notifications" />
        <View style={styles.avatar}>
          <Ionicons name="person" size={54} color={colors.primary} />
        </View>
        <Text style={styles.email}>{session.email}</Text>
        <AmountEditor
          label="Daily water goal"
          value={goal}
          unit={unit}
          error={error}
          onBlur={() => void commitGoal()}
          onChange={(nextValue, nextUnit) => {
            const switched = nextUnit !== unit;
            setGoal(nextValue);
            setUnit(nextUnit);
            setError(null);
            if (switched) void commitGoal(nextValue, nextUnit);
          }}
        />
        {saving ? <Text style={styles.note}>Saving…</Text> : null}
        <View style={styles.row}>
          <Ionicons name="notifications-outline" size={22} color={colors.ink} />
          <Text style={styles.rowLabel}>Notifications</Text>
          <Toggle
            label="Notifications"
            value={session.notificationsEnabled}
            onValueChange={(enabled) => void updateProfile({ notificationsEnabled: enabled })}
          />
        </View>
        {reminderWarning && session.notificationsEnabled ? <Text style={styles.warning}>{reminderWarning}</Text> : null}
        <PrimaryButton label="Edit Profile" onPress={() => router.push('/edit-profile')} />
        <PrimaryButton
          label="Sign Out"
          variant="secondary"
          onPress={() => {
            void signOut().then(() => router.replace('/sign-in'));
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space.xl, paddingBottom: 32, gap: space.md, alignItems: 'stretch' },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.mist,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.sm,
  },
  email: { ...type.h2, textAlign: 'center' },
  note: { ...type.small, textAlign: 'center' },
  row: {
    minHeight: 64,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.ink },
  warning: { ...type.small, textAlign: 'center' },
});
