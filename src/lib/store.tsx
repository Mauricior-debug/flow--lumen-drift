import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { dayKey } from './dates';
import {
  LOCAL_ONLY_WARNING,
  cloudDeleteLog,
  cloudDeleteReminder,
  cloudPull,
  cloudResetPassword,
  cloudSaveLog,
  cloudSaveReminder,
  cloudSaveUser,
  cloudSignIn,
  cloudSignOut,
  cloudSignUp,
  isCloudConfigured,
} from './firebase';
import { createId } from './id';
import { dueReminder, syncReminders } from './notifications';
import { textOf } from './text';
import { emptyDatabase, type Database, type Draft, type Reminder, type RepeatPattern, type Unit, type User, type WaterLog } from './types';
import { goalMl, percentOf, totalMl } from './units';

const STORAGE_KEY = 'lumen-drift.db.v1';

type Result = { ok: true } | { ok: false; error: string };

type StoreValue = {
  ready: boolean;
  bootError: string | null;
  modeWarning: string | null;
  reminderWarning: string | null;
  flash: string | null;
  hasAccount: boolean;
  session: User | null;
  draft: Draft;
  logs: WaterLog[];
  reminders: Reminder[];
  due: Reminder | null;
  clearFlash: () => void;
  dismissDue: () => void;
  agreeConsent: (data: boolean, notifications: boolean) => Promise<Result>;
  setDraftGoal: (goal: number, units: Unit) => void;
  signUp: (email: string, password: string) => Promise<Result>;
  signIn: (email: string, password: string) => Promise<Result>;
  signOut: () => Promise<void>;
  resetPassword: (email: string, password: string) => Promise<Result>;
  updateProfile: (patch: Partial<Pick<User, 'hydrationGoal' | 'units' | 'notificationsEnabled'>>) => Promise<Result>;
  addLog: (input: { amount: number; unit: Unit; timestamp: string }) => Promise<Result>;
  updateLog: (id: string, input: { amount: number; unit: Unit; timestamp: string }) => Promise<Result>;
  deleteLog: (id: string) => Promise<Result>;
  saveReminder: (input: { id?: string; time: string; repeatPattern: RepeatPattern; customDays: number[] }) => Promise<Result>;
  deleteReminder: (id: string) => Promise<Result>;
  reload: () => Promise<void>;
};

const StoreContext = createContext<StoreValue | null>(null);

function emailOk(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
}

async function makeSalt(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function sanitize(raw: unknown): Database {
  const base = emptyDatabase();
  if (!raw || typeof raw !== 'object') return base;
  const record = raw as Partial<Database>;
  return {
    users: Array.isArray(record.users) ? record.users.filter((user) => user && typeof user.email === 'string' && typeof user.id === 'string') : [],
    credentials: Array.isArray(record.credentials) ? record.credentials.filter((item) => item && typeof item.email === 'string') : [],
    logs: Array.isArray(record.logs) ? record.logs.filter((log) => log && typeof log.id === 'string' && typeof log.timestamp === 'string') : [],
    reminders: Array.isArray(record.reminders)
      ? record.reminders.filter((item) => item && typeof item.id === 'string').map((item) => ({
          ...item,
          customDays: Array.isArray(item.customDays) ? item.customDays : [],
          repeatPattern: item.repeatPattern === 'weekdays' || item.repeatPattern === 'custom' ? item.repeatPattern : 'daily',
        }))
      : [],
    sessionUserId: typeof record.sessionUserId === 'string' ? record.sessionUserId : null,
    draft: { ...base.draft, ...(record.draft ?? {}) },
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const dbRef = useRef<Database>(emptyDatabase());
  const [db, setDb] = useState<Database>(emptyDatabase());
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [reminderWarning, setReminderWarning] = useState<string | null>(null);
  const [dismissedDue, setDismissedDue] = useState<string | null>(null);

  const commit = useCallback(async (next: Database) => {
    dbRef.current = next;
    setDb(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const reload = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const next = stored ? sanitize(JSON.parse(stored)) : emptyDatabase();
      dbRef.current = next;
      setDb(next);
      setBootError(null);
    } catch (error) {
      setBootError(textOf(error) || 'Lumen Drift could not open your saved log.');
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 2800);
    return () => clearTimeout(timer);
  }, [flash]);

  const session = useMemo(
    () => db.users.find((user) => user.id === db.sessionUserId) ?? null,
    [db.users, db.sessionUserId],
  );

  const logs = useMemo(
    () => db.logs.filter((log) => log.userId === session?.id).sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [db.logs, session?.id],
  );

  const reminders = useMemo(
    () => db.reminders.filter((item) => item.userId === session?.id).sort((a, b) => a.time.localeCompare(b.time)),
    [db.reminders, session?.id],
  );

  useEffect(() => {
    if (!session) return;
    void syncReminders(reminders, session.notificationsEnabled).then((result) => {
      setReminderWarning(result.warning);
    });
  }, [session?.id, session?.notificationsEnabled, reminders]);

  const due = useMemo(() => {
    if (!session?.notificationsEnabled) return null;
    const match = dueReminder(reminders);
    if (!match) return null;
    const token = `${match.id}:${dayKey(new Date())}`;
    if (dismissedDue === token) return null;
    return match;
  }, [dismissedDue, reminders, session?.notificationsEnabled]);

  const clearFlash = useCallback(() => setFlash(null), []);
  const dismissDue = useCallback(() => {
    const match = dueReminder(reminders);
    if (!match) return;
    setDismissedDue(`${match.id}:${dayKey(new Date())}`);
  }, [reminders]);

  const agreeConsent = useCallback(async (data: boolean, notifications: boolean): Promise<Result> => {
    if (!data) return { ok: false, error: 'Agree to data collection to continue.' };
    const next: Database = {
      ...dbRef.current,
      draft: {
        ...dbRef.current.draft,
        consentGiven: true,
        consentNotifications: notifications,
      },
    };
    await commit(next);
    return { ok: true };
  }, [commit]);

  const setDraftGoal = useCallback((goal: number, units: Unit) => {
    const next: Database = {
      ...dbRef.current,
      draft: { ...dbRef.current.draft, hydrationGoal: goal, units, goalSet: true },
    };
    dbRef.current = next;
    setDb(next);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<Result> => {
    const normalized = email.trim().toLowerCase();
    if (!emailOk(normalized)) return { ok: false, error: 'Enter a valid email address.' };
    if (password.length < 8) return { ok: false, error: 'Use at least 8 characters.' };
    if (dbRef.current.credentials.some((item) => item.email === normalized)) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    try {
      const cloudId = isCloudConfigured() ? await cloudSignUp(normalized, password) : createId();
      const salt = await makeSalt();
      const passwordHash = await hashPassword(password, salt);
      const draft = dbRef.current.draft;
      const user: User = {
        id: cloudId,
        email: normalized,
        hydrationGoal: draft.goalSet ? draft.hydrationGoal : 2000,
        units: draft.units,
        notificationsEnabled: draft.consentNotifications,
        consentGiven: draft.consentGiven,
      };
      const next: Database = {
        ...dbRef.current,
        users: [...dbRef.current.users.filter((item) => item.id !== user.id), user],
        credentials: [...dbRef.current.credentials, { userId: user.id, email: normalized, salt, passwordHash }],
        sessionUserId: user.id,
      };
      await commit(next);
      if (isCloudConfigured()) await cloudSaveUser(user);
      setFlash('Account created');
      return { ok: true };
    } catch (error) {
      return { ok: false, error: textOf(error) || 'Could not create the account.' };
    }
  }, [commit]);

  const signIn = useCallback(async (email: string, password: string): Promise<Result> => {
    const normalized = email.trim().toLowerCase();
    if (!emailOk(normalized)) return { ok: false, error: 'Enter a valid email address.' };
    if (!password) return { ok: false, error: 'Enter your password.' };
    try {
      if (isCloudConfigured()) {
        const uid = await cloudSignIn(normalized, password);
        let next = dbRef.current;
        const existing = next.users.find((user) => user.id === uid || user.email === normalized);
        const user: User = existing ?? {
          id: uid,
          email: normalized,
          hydrationGoal: 2000,
          units: 'ml',
          notificationsEnabled: false,
          consentGiven: true,
        };
        const pulled = await cloudPull(user.id);
        next = {
          ...next,
          users: [...next.users.filter((item) => item.id !== user.id), user],
          sessionUserId: user.id,
          logs: pulled ? [...next.logs.filter((log) => log.userId !== user.id), ...pulled.logs] : next.logs,
          reminders: pulled ? [...next.reminders.filter((item) => item.userId !== user.id), ...pulled.reminders] : next.reminders,
        };
        await commit(next);
        setFlash('Signed in');
        return { ok: true };
      }
      const credential = dbRef.current.credentials.find((item) => item.email === normalized);
      if (!credential) return { ok: false, error: 'Email or password doesn’t match.' };
      const passwordHash = await hashPassword(password, credential.salt);
      if (passwordHash !== credential.passwordHash) return { ok: false, error: 'Email or password doesn’t match.' };
      await commit({ ...dbRef.current, sessionUserId: credential.userId });
      setFlash('Signed in');
      return { ok: true };
    } catch (error) {
      return { ok: false, error: textOf(error) || 'Could not sign in.' };
    }
  }, [commit]);

  const signOut = useCallback(async () => {
    await cloudSignOut();
    await commit({ ...dbRef.current, sessionUserId: null });
    setFlash(null);
  }, [commit]);

  const resetPassword = useCallback(async (email: string, password: string): Promise<Result> => {
    const normalized = email.trim().toLowerCase();
    if (!emailOk(normalized)) return { ok: false, error: 'Enter a valid email address.' };
    try {
      if (isCloudConfigured()) {
        await cloudResetPassword(normalized);
        return { ok: true };
      }
      if (password.length < 8) return { ok: false, error: 'Use at least 8 characters.' };
      const credential = dbRef.current.credentials.find((item) => item.email === normalized);
      if (!credential) return { ok: false, error: 'No account found for that email.' };
      const salt = await makeSalt();
      const passwordHash = await hashPassword(password, salt);
      const credentials = dbRef.current.credentials.map((item) =>
        item.email === normalized ? { ...item, salt, passwordHash } : item,
      );
      await commit({ ...dbRef.current, credentials });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: textOf(error) || 'Could not reset the password.' };
    }
  }, [commit]);

  const updateProfile = useCallback(async (
    patch: Partial<Pick<User, 'hydrationGoal' | 'units' | 'notificationsEnabled'>>,
  ): Promise<Result> => {
    const current = dbRef.current.users.find((user) => user.id === dbRef.current.sessionUserId);
    if (!current) return { ok: false, error: 'Sign in again to update your profile.' };
    const user: User = { ...current, ...patch };
    const next: Database = {
      ...dbRef.current,
      users: dbRef.current.users.map((item) => (item.id === user.id ? user : item)),
    };
    try {
      await commit(next);
      if (isCloudConfigured()) await cloudSaveUser(user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: textOf(error) || 'Could not save your profile.' };
    }
  }, [commit]);

  const addLog = useCallback(async (input: { amount: number; unit: Unit; timestamp: string }): Promise<Result> => {
    const user = dbRef.current.users.find((item) => item.id === dbRef.current.sessionUserId);
    if (!user) return { ok: false, error: 'Sign in again to log water.' };
    const before = percentOf(
      totalMl(dbRef.current.logs.filter((log) => log.userId === user.id && dayKey(new Date(log.timestamp)) === dayKey(new Date(input.timestamp)))),
      goalMl(user.hydrationGoal, user.units),
    );
    const log: WaterLog = {
      id: createId(),
      userId: user.id,
      amount: input.amount,
      unit: input.unit,
      timestamp: input.timestamp,
    };
    try {
      await commit({ ...dbRef.current, logs: [...dbRef.current.logs, log] });
      if (isCloudConfigured()) await cloudSaveLog(log);
      const after = percentOf(
        totalMl(dbRef.current.logs.filter((item) => item.userId === user.id && dayKey(new Date(item.timestamp)) === dayKey(new Date(input.timestamp)))),
        goalMl(user.hydrationGoal, user.units),
      );
      setFlash(before < 100 && after >= 100 ? 'Daily goal reached' : 'Water logged');
      return { ok: true };
    } catch (error) {
      return { ok: false, error: textOf(error) || 'Could not save that entry.' };
    }
  }, [commit]);

  const updateLog = useCallback(async (id: string, input: { amount: number; unit: Unit; timestamp: string }): Promise<Result> => {
    const existing = dbRef.current.logs.find((log) => log.id === id);
    if (!existing) return { ok: false, error: 'That entry is no longer here.' };
    const log: WaterLog = { ...existing, ...input };
    try {
      await commit({
        ...dbRef.current,
        logs: dbRef.current.logs.map((item) => (item.id === id ? log : item)),
      });
      if (isCloudConfigured()) await cloudSaveLog(log);
      setFlash('Entry updated');
      return { ok: true };
    } catch (error) {
      return { ok: false, error: textOf(error) || 'Could not update that entry.' };
    }
  }, [commit]);

  const deleteLog = useCallback(async (id: string): Promise<Result> => {
    const existing = dbRef.current.logs.find((log) => log.id === id);
    if (!existing) return { ok: false, error: 'That entry is no longer here.' };
    try {
      await commit({ ...dbRef.current, logs: dbRef.current.logs.filter((log) => log.id !== id) });
      if (isCloudConfigured()) await cloudDeleteLog(existing.userId, id);
      setFlash('Entry deleted');
      return { ok: true };
    } catch (error) {
      return { ok: false, error: textOf(error) || 'Could not delete that entry.' };
    }
  }, [commit]);

  const saveReminder = useCallback(async (
    input: { id?: string; time: string; repeatPattern: RepeatPattern; customDays: number[] },
  ): Promise<Result> => {
    const user = dbRef.current.users.find((item) => item.id === dbRef.current.sessionUserId);
    if (!user) return { ok: false, error: 'Sign in again to save a reminder.' };
    const reminder: Reminder = {
      id: input.id || createId(),
      userId: user.id,
      time: input.time,
      repeatPattern: input.repeatPattern,
      customDays: input.repeatPattern === 'custom' ? input.customDays : [],
      enabled: true,
    };
    const exists = dbRef.current.reminders.some((item) => item.id === reminder.id);
    try {
      await commit({
        ...dbRef.current,
        reminders: exists
          ? dbRef.current.reminders.map((item) => (item.id === reminder.id ? reminder : item))
          : [...dbRef.current.reminders, reminder],
      });
      if (isCloudConfigured()) await cloudSaveReminder(reminder);
      setFlash(exists ? 'Reminder updated' : 'Reminder saved');
      return { ok: true };
    } catch (error) {
      return { ok: false, error: textOf(error) || 'Could not save that reminder.' };
    }
  }, [commit]);

  const deleteReminder = useCallback(async (id: string): Promise<Result> => {
    const existing = dbRef.current.reminders.find((item) => item.id === id);
    if (!existing) return { ok: false, error: 'That reminder is no longer here.' };
    try {
      await commit({ ...dbRef.current, reminders: dbRef.current.reminders.filter((item) => item.id !== id) });
      if (isCloudConfigured()) await cloudDeleteReminder(existing.userId, id);
      setFlash('Reminder deleted');
      return { ok: true };
    } catch (error) {
      return { ok: false, error: textOf(error) || 'Could not delete that reminder.' };
    }
  }, [commit]);

  const value = useMemo<StoreValue>(() => ({
    ready,
    bootError,
    modeWarning: isCloudConfigured() ? null : LOCAL_ONLY_WARNING,
    reminderWarning,
    flash,
    hasAccount: db.credentials.length > 0,
    session,
    draft: db.draft,
    logs,
    reminders,
    due,
    clearFlash,
    dismissDue,
    agreeConsent,
    setDraftGoal,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    addLog,
    updateLog,
    deleteLog,
    saveReminder,
    deleteReminder,
    reload,
  }), [
    ready, bootError, reminderWarning, flash, db.credentials.length, session, db.draft, logs, reminders, due,
    clearFlash, dismissDue, agreeConsent, setDraftGoal, signUp, signIn, signOut, resetPassword,
    updateProfile, addLog, updateLog, deleteLog, saveReminder, deleteReminder, reload,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error('Store missing');
  return value;
}
