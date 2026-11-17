import { ScrollView, StyleSheet, Text } from 'react-native';
import { AppHeader, Screen } from '../components/ui';
import { space, type } from '../theme/tokens';

export default function PrivacyScreen() {
  return (
    <Screen>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={type.h1}>Privacy Policy</Text>
        <Text style={type.body}>
          Lumen Drift stores the email you use to sign in, your daily water goal, the drinks you log, and the reminders you set. That information is used to show today’s progress, your history, and the reminders you asked for.
        </Text>
        <Text style={type.body}>
          Notifications are optional. You can turn them off in Profile, and you can delete a reminder or a water entry at any time. Signing out keeps your log on this device so you can sign back in.
        </Text>
        <Text style={type.body}>
          If cloud sync isn’t available, the log stays on this device and is not sent anywhere.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.xl, paddingBottom: 48, gap: space.lg },
});
