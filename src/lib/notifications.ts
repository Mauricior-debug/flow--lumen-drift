import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { textOf } from './text';
import type { Reminder } from './types';
import { timeToParts } from './dates';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type ReminderSync = {
  delivered: 'scheduled' | 'in-app';
  warning: string | null;
};

const IN_APP = 'Reminders stay in the app until notifications are allowed.';

function weekdayTriggers(reminder: Reminder): number[] {
  if (reminder.repeatPattern === 'daily') return [1, 2, 3, 4, 5, 6, 7];
  if (reminder.repeatPattern === 'weekdays') return [2, 3, 4, 5, 6];
  return reminder.customDays
    .filter((day) => day >= 0 && day <= 6)
    .map((day) => day + 1);
}

export async function syncReminders(reminders: Reminder[], enabled: boolean): Promise<ReminderSync> {
  if (Platform.OS === 'web') {
    return { delivered: 'in-app', warning: enabled ? IN_APP : null };
  }
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return { delivered: 'in-app', warning: null };
    const active = reminders.filter((reminder) => reminder.enabled);
    if (!active.length) return { delivered: 'scheduled', warning: null };

    const current = await Notifications.getPermissionsAsync();
    let granted = current.granted;
    if (!granted) {
      const asked = await Notifications.requestPermissionsAsync();
      granted = asked.granted;
    }
    if (!granted) return { delivered: 'in-app', warning: IN_APP };

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('hydration', {
        name: 'Hydration reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    for (const reminder of active) {
      const { hours, minutes } = timeToParts(reminder.time);
      for (const weekday of weekdayTriggers(reminder)) {
        await Notifications.scheduleNotificationAsync({
          identifier: `${reminder.id}-${weekday}`,
          content: {
            title: 'Time for water',
            body: 'A small sip keeps the day on track.',
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday,
            hour: hours,
            minute: minutes,
            channelId: 'hydration',
          },
        });
      }
    }
    return { delivered: 'scheduled', warning: null };
  } catch (error) {
    return {
      delivered: 'in-app',
      warning: textOf(error) || IN_APP,
    };
  }
}

export function dueReminder(reminders: Reminder[], now = new Date()): Reminder | null {
  const enabled = reminders.filter((reminder) => reminder.enabled);
  const minuteOfDay = now.getHours() * 60 + now.getMinutes();
  const jsDay = now.getDay();
  for (const reminder of enabled) {
    const { hours, minutes } = timeToParts(reminder.time);
    const target = hours * 60 + minutes;
    const delta = minuteOfDay - target;
    if (delta < 0 || delta > 20) continue;
    if (reminder.repeatPattern === 'weekdays' && (jsDay === 0 || jsDay === 6)) continue;
    if (reminder.repeatPattern === 'custom' && !reminder.customDays.includes(jsDay)) continue;
    return reminder;
  }
  return null;
}
