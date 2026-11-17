import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CheckboxRow, PrimaryButton, Screen, Wordmark, BrandMark } from '../components/ui';
import { useGuestOnly } from '../lib/guards';
import { useStore } from '../lib/store';
import { colors, space, type } from '../theme/tokens';

export default function ConsentScreen() {
  useGuestOnly();
  const { agreeConsent } = useStore();
  const [data, setData] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function agree() {
    setLoading(true);
    const result = await agreeConsent(data, notifications);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace('/onboarding');
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <BrandMark size={36} />
          <Wordmark size={22} />
        </View>
        <Text style={type.h1}>Your Privacy Matters</Text>
        <Text style={styles.intro}>
          We only collect the information needed to help you stay hydrated and improve your experience.
        </Text>
        <View style={styles.checks}>
          <CheckboxRow
            checked={data}
            onPress={() => {
              setData((value) => !value);
              setError(null);
            }}
            label="I agree to the collection and storage of my data as described in the Privacy Policy."
          />
          <Pressable accessibilityRole="link" accessibilityLabel="Privacy Policy" onPress={() => router.push('/privacy')} style={styles.policy}>
            <Text style={styles.policyText}>Read the Privacy Policy</Text>
          </Pressable>
          <CheckboxRow
            checked={notifications}
            onPress={() => setNotifications((value) => !value)}
            label="I agree to receive push notifications for hydration reminders."
          />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Agree and Continue" onPress={() => void agree()} loading={loading} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.xl, paddingBottom: 40, gap: space.lg },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: space.md },
  intro: { ...type.bodyMuted, fontSize: 17, lineHeight: 24 },
  checks: { gap: space.lg, marginTop: space.md },
  policy: { minHeight: 44, justifyContent: 'center', marginTop: -8 },
  policyText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.primary },
  error: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.danger },
});
