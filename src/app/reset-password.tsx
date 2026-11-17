import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, PrimaryButton, Screen, TextField } from '../components/ui';
import { useStore } from '../lib/store';
import { isCloudConfigured } from '../lib/firebase';
import { colors, space, type } from '../theme/tokens';

export default function ResetPasswordScreen() {
  const { resetPassword } = useStore();
  const cloud = isCloudConfigured();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!cloud && password !== confirm) {
      setError('Passwords don’t match.');
      return;
    }
    setLoading(true);
    const result = await resetPassword(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  return (
    <Screen>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={type.h1}>Reset password</Text>
        <Text style={type.bodyMuted}>
          {cloud
            ? 'Enter the email on your account. We’ll send a reset link.'
            : 'Enter the email on your account and choose a new password.'}
        </Text>
        {done ? (
          <View style={styles.done}>
            <Text style={type.h2}>{cloud ? 'Check your email' : 'Password updated'}</Text>
            <Text style={type.bodyMuted}>
              {cloud
                ? 'If an account exists for that email, a reset link is on the way.'
                : 'Sign in with the new password.'}
            </Text>
            <PrimaryButton label="Back to Sign In" onPress={() => router.replace('/sign-in')} />
          </View>
        ) : (
          <>
            <TextField
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              icon="mail-outline"
              keyboardType="email-address"
              textContentType="emailAddress"
            />
            {cloud ? null : (
              <>
                <TextField
                  value={password}
                  onChangeText={setPassword}
                  placeholder="New password"
                  icon="lock-closed-outline"
                  secure
                  revealed={show}
                  onToggleReveal={() => setShow((value) => !value)}
                  textContentType="newPassword"
                />
                <TextField
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Confirm password"
                  icon="lock-closed-outline"
                  secure
                  revealed={show}
                  onToggleReveal={() => setShow((value) => !value)}
                  textContentType="newPassword"
                  error={error}
                />
              </>
            )}
            {cloud && error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton label={cloud ? 'Send reset link' : 'Update password'} onPress={() => void submit()} loading={loading} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.xl, paddingBottom: 48, gap: space.md },
  done: { gap: space.md, marginTop: space.md },
  error: { color: colors.danger, fontFamily: 'Inter_400Regular', fontSize: 14 },
});
