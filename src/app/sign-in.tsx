import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BrandMark, PrimaryButton, Screen, TextField, Wordmark } from '../components/ui';
import { useGuestOnly } from '../lib/guards';
import { useStore } from '../lib/store';
import { colors, space, type } from '../theme/tokens';

export default function SignInScreen() {
  useGuestOnly();
  const { signIn } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    const result = await signIn(email, password);
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
        <Text style={[type.hero, styles.center]}>Welcome back</Text>
        <Text style={[type.bodyMuted, styles.center]}>Sign in to continue your hydration journey.</Text>
        <TextField
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          icon="mail-outline"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <TextField
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          icon="lock-closed-outline"
          secure
          revealed={showPassword}
          onToggleReveal={() => setShowPassword((value) => !value)}
          textContentType="password"
          error={error}
        />
        <Pressable accessibilityRole="link" accessibilityLabel="Forgot password" onPress={() => router.push('/reset-password')} style={styles.forgot}>
          <Text style={styles.link}>Forgot password?</Text>
        </Pressable>
        <PrimaryButton label="Sign In" onPress={() => void submit()} loading={loading} />
        <Pressable accessibilityRole="link" accessibilityLabel="Sign up" onPress={() => router.push('/sign-up')} style={styles.linkRow}>
          <Text style={type.bodyMuted}>
            Don’t have an account? <Text style={styles.link}>Sign Up</Text>
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
  forgot: { minHeight: 44, justifyContent: 'center' },
  linkRow: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  link: { color: colors.primary, fontFamily: 'Inter_600SemiBold' },
});
