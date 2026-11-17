import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppHeader, EmptyState, FlashBanner, PrimaryButton, Screen } from '../../components/ui';
import { useScrollRef } from '../../lib/chrome';
import { formatTimeString, repeatLabel } from '../../lib/dates';
import { useUserOnly } from '../../lib/guards';
import { useStore } from '../../lib/store';
import { colors, radius, space, type } from '../../theme/tokens';

export default function NotificationsScreen() {
  useUserOnly();
  const { reminders, flash, reminderWarning, session } = useStore();
  const ref = useScrollRef('notifications');

  return (
    <Screen tabs footer={<PrimaryButton label="Add Reminder" onPress={() => router.push('/reminder/new')} />}>
      <AppHeader back />
      <ScrollView ref={ref} style={styles.flex} contentContainerStyle={styles.content}>
        <Text style={type.h1}>Notifications</Text>
        <Text style={type.bodyMuted}>Manage your reminders to drink water.</Text>
        <FlashBanner message={flash} />
        {session?.notificationsEnabled && reminderWarning ? <Text style={styles.warning}>{reminderWarning}</Text> : null}
        {reminders.length === 0 ? (
          <EmptyState title="No reminders yet" body="Add one for the times you usually drink." />
        ) : (
          reminders.map((reminder) => (
            <View key={reminder.id} style={styles.card}>
              <View style={styles.clock}>
                <Ionicons name="time-outline" size={22} color={colors.ink} />
              </View>
              <View style={styles.copy}>
                <Text style={styles.time}>{formatTimeString(reminder.time)}</Text>
                <Text style={styles.repeat}>{repeatLabel(reminder.repeatPattern, reminder.customDays)}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit ${formatTimeString(reminder.time)} reminder`}
                onPress={() => router.push(`/reminder/${reminder.id}`)}
                style={({ pressed }) => [styles.icon, pressed && styles.pressed]}
              >
                <Ionicons name="pencil" size={18} color={colors.primary} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete ${formatTimeString(reminder.time)} reminder`}
                onPress={() => router.push(`/confirm-delete?kind=reminder&id=${reminder.id}`)}
                style={({ pressed }) => [styles.icon, pressed && styles.pressed]}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space.xl, paddingBottom: space.lg, gap: space.md },
  warning: { ...type.small },
  card: {
    minHeight: 76,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingLeft: space.md,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clock: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  time: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink },
  repeat: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.muted },
  icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.55 },
});
