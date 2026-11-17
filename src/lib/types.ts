export type Unit = 'ml' | 'oz';

export type RepeatPattern = 'daily' | 'weekdays' | 'custom';

export type User = {
  id: string;
  email: string;
  hydrationGoal: number;
  units: Unit;
  notificationsEnabled: boolean;
  consentGiven: boolean;
};

export type Credential = {
  userId: string;
  email: string;
  salt: string;
  passwordHash: string;
};

export type WaterLog = {
  id: string;
  userId: string;
  amount: number;
  unit: Unit;
  timestamp: string;
};

export type Reminder = {
  id: string;
  userId: string;
  time: string;
  repeatPattern: RepeatPattern;
  customDays: number[];
  enabled: boolean;
};

export type Draft = {
  consentGiven: boolean;
  consentNotifications: boolean;
  hydrationGoal: number;
  units: Unit;
  goalSet: boolean;
};

export type Database = {
  users: User[];
  credentials: Credential[];
  logs: WaterLog[];
  reminders: Reminder[];
  sessionUserId: string | null;
  draft: Draft;
};

export const emptyDraft = (): Draft => ({
  consentGiven: false,
  consentNotifications: false,
  hydrationGoal: 2000,
  units: 'ml',
  goalSet: false,
});

export const emptyDatabase = (): Database => ({
  users: [],
  credentials: [],
  logs: [],
  reminders: [],
  sessionUserId: null,
  draft: emptyDraft(),
});
