import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, getFirestore, setDoc } from 'firebase/firestore';
import { textOf } from './text';
import type { Reminder, User, WaterLog } from './types';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export function isCloudConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

export const LOCAL_ONLY_WARNING = 'Saved on this device only. Cloud sync isn’t available.';

function firebaseApp(): FirebaseApp {
  if (!isCloudConfigured()) {
    throw new Error(LOCAL_ONLY_WARNING);
  }
  if (getApps().length > 0) return getApps()[0];
  return initializeApp(firebaseConfig);
}

function messageFrom(error: unknown): string {
  const code = textOf((error as { code?: unknown })?.code);
  if (code.includes('email-already-in-use')) return 'An account with this email already exists.';
  if (code.includes('invalid-email')) return 'Enter a valid email address.';
  if (code.includes('weak-password')) return 'Use at least 8 characters.';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'Email or password doesn’t match.';
  }
  if (code.includes('too-many-requests')) return 'Too many attempts. Wait a moment and try again.';
  const message = textOf((error as { message?: unknown })?.message);
  return message || 'Something went wrong. Try again.';
}

export async function cloudSignUp(email: string, password: string): Promise<string> {
  try {
    const cred = await createUserWithEmailAndPassword(getAuth(firebaseApp()), email, password);
    return cred.user.uid;
  } catch (error) {
    throw new Error(messageFrom(error));
  }
}

export async function cloudSignIn(email: string, password: string): Promise<string> {
  try {
    const cred = await signInWithEmailAndPassword(getAuth(firebaseApp()), email, password);
    return cred.user.uid;
  } catch (error) {
    throw new Error(messageFrom(error));
  }
}

export async function cloudSignOut(): Promise<void> {
  if (!isCloudConfigured()) return;
  try {
    await signOut(getAuth(firebaseApp()));
  } catch {
    // Local sign-out still proceeds.
  }
}

export async function cloudResetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(getAuth(firebaseApp()), email);
  } catch (error) {
    throw new Error(messageFrom(error));
  }
}

export async function cloudSaveUser(user: User): Promise<void> {
  if (!isCloudConfigured()) return;
  const db = getFirestore(firebaseApp());
  await setDoc(doc(db, 'users', user.id), user);
}

export async function cloudSaveLog(log: WaterLog): Promise<void> {
  if (!isCloudConfigured()) return;
  const db = getFirestore(firebaseApp());
  await setDoc(doc(db, 'users', log.userId, 'logs', log.id), log);
}

export async function cloudDeleteLog(userId: string, logId: string): Promise<void> {
  if (!isCloudConfigured()) return;
  const db = getFirestore(firebaseApp());
  await deleteDoc(doc(db, 'users', userId, 'logs', logId));
}

export async function cloudSaveReminder(reminder: Reminder): Promise<void> {
  if (!isCloudConfigured()) return;
  const db = getFirestore(firebaseApp());
  await setDoc(doc(db, 'users', reminder.userId, 'reminders', reminder.id), reminder);
}

export async function cloudDeleteReminder(userId: string, reminderId: string): Promise<void> {
  if (!isCloudConfigured()) return;
  const db = getFirestore(firebaseApp());
  await deleteDoc(doc(db, 'users', userId, 'reminders', reminderId));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export async function cloudPull(userId: string): Promise<{ logs: WaterLog[]; reminders: Reminder[] } | null> {
  if (!isCloudConfigured()) return null;
  try {
    const db = getFirestore(firebaseApp());
    const [logSnap, reminderSnap] = await Promise.all([
      getDocs(collection(db, 'users', userId, 'logs')),
      getDocs(collection(db, 'users', userId, 'reminders')),
    ]);
    const logs: WaterLog[] = [];
    logSnap.forEach((item) => {
      const raw = asRecord(item.data());
      if (!raw) return;
      const amount = typeof raw.amount === 'number' ? raw.amount : Number(raw.amount);
      if (!Number.isFinite(amount)) return;
      logs.push({
        id: textOf(raw.id) || item.id,
        userId: textOf(raw.userId) || userId,
        amount,
        unit: raw.unit === 'oz' ? 'oz' : 'ml',
        timestamp: textOf(raw.timestamp) || new Date().toISOString(),
      });
    });
    const reminders: Reminder[] = [];
    reminderSnap.forEach((item) => {
      const raw = asRecord(item.data());
      if (!raw) return;
      const days = Array.isArray(raw.customDays)
        ? raw.customDays.map((day) => Number(day)).filter((day) => Number.isFinite(day))
        : [];
      reminders.push({
        id: textOf(raw.id) || item.id,
        userId: textOf(raw.userId) || userId,
        time: textOf(raw.time) || '09:00',
        repeatPattern: raw.repeatPattern === 'weekdays' || raw.repeatPattern === 'custom' ? raw.repeatPattern : 'daily',
        customDays: days,
        enabled: raw.enabled !== false,
      });
    });
    return { logs, reminders };
  } catch {
    return null;
  }
}
