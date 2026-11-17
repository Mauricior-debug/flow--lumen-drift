import { useEffect } from 'react';
import { router } from 'expo-router';
import { useStore } from './store';

export function useGuestOnly() {
  const { ready, session } = useStore();
  useEffect(() => {
    if (ready && session) router.replace('/home');
  }, [ready, session]);
}

export function useUserOnly() {
  const { ready, session } = useStore();
  useEffect(() => {
    if (ready && !session) router.replace('/sign-in');
  }, [ready, session]);
}

export function nextAfterSplash(input: {
  consentGiven: boolean;
  session: boolean;
  hasAccount: boolean;
  goalSet: boolean;
}): '/consent' | '/home' | '/sign-in' | '/onboarding' | '/sign-up' {
  if (!input.consentGiven) return '/consent';
  if (input.session) return '/home';
  if (input.hasAccount) return '/sign-in';
  if (!input.goalSet) return '/onboarding';
  return '/sign-up';
}
