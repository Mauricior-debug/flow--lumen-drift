import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BrandMark, PrimaryButton, Screen, TextField, Wordmark } from '../components/ui';
import { useGuestOnly } from '../lib/guards';
import { useStore } from '../lib/store';
import { colors, space, type } from '../theme/tokens';

export default function SignUpScreen() {
  useGuestOnly();
  const { signUp } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email.trim() || !password || !confirm) {
      setError('Enter your email, password, and confirmation.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords don’t match.');
      return;
    }
    setLoading(true);
    const result = await signUp(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace('/home');
  }

  return (
    <Screen wave>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <BrandMark size={84} />
          <Wordmark size={28} />
        </View>
        <Text style={[type.hero, styles.center]}>Create your account</Text>
        <Text style={[type.bodyMuted, styles.center]}>Join Lumen Drift and start your hydration journey.</Text>
        <TextField
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          icon="mail-outline"
          keyboardType="email-address"
          textContentType="emailAddress"
          error={null}
        />
        <TextField
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          icon="lock-closed-outline"
          secure
          revealed={showPassword}
          onToggleReveal={() => setShowPassword((value) => !value)}
          textContentType="newPassword"
        />
        <TextField
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Confirm password"
          icon="lock-closed-outline"
          secure
          revealed={showConfirm}
          onToggleReveal={() => setShowConfirm((value) => !value)}
          textContentType="newPassword"
          error={error}
        />
        <PrimaryButton label="Sign Up" onPress={() => void submit()} loading={loading} />
        <Pressable accessibilityRole="link" accessibilityLabel="Sign in" onPress={() => router.push('/sign-in')} style={styles.linkRow}>
          <Text style={type.bodyMuted}>
            Already have an account? <Text style={styles.link}>Sign In</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.xl, paddingBottom: 200, gap: space.md },
  hero: { alignItems: 'center', gap: 8, marginTop: space.md, marginBottom: space.sm },
  center: { textAlign: 'center' },
  linkRow: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  link: { color: colors.primary, fontFamily: 'Inter_600SemiBold', textDecorationLine: 'underline' },
});
