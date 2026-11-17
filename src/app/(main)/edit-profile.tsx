import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AmountEditor, FormActions } from '../../components/forms';
import { AppHeader, Screen, Toggle } from '../../components/ui';
import { useUserOnly } from '../../lib/guards';
import { useStore } from '../../lib/store';
import { goalIsValid } from '../../lib/units';
import { colors, radius, space, type } from '../../theme/tokens';

export default function EditProfileScreen() {
  useUserOnly();
  const { session, updateProfile } = useStore();
  const [goal, setGoal] = useState(session ? String(session.hydrationGoal) : '2000');
  const [unit, setUnit] = useState(session?.units ?? 'ml');
  const [notifications, setNotifications] = useState(session?.notificationsEnabled ?? false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    const amount = Number(goal);
    const problem = goalIsValid(amount, unit);
    if (problem) {
      setError(problem);
      return;
    }
    setLoading(true);
    const result = await updateProfile({
      hydrationGoal: amount,
      units: unit,
      notificationsEnabled: notifications,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.back();
  }

  return (
    <Screen tabs footer={<FormActions onCancel={() => router.back()} onSave={() => void save()} loading={loading} />}>
      <AppHeader back />
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={type.h1}>Edit Profile</Text>
        <Text style={type.bodyMuted}>Update your preferences.</Text>
        <AmountEditor
          label="Daily water goal"
          value={goal}
          unit={unit}
          error={error}
          onChange={(nextValue, nextUnit) => {
            setGoal(nextValue);
            setUnit(nextUnit);
            setError(null);
          }}
        />
        <View style={styles.row}>
          <Ionicons name="notifications-outline" size={22} color={colors.ink} />
          <Text style={styles.rowLabel}>Notifications</Text>
          <Toggle label="Notifications" value={notifications} onValueChange={setNotifications} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space.xl, paddingBottom: space.xl, gap: space.md },
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
});
