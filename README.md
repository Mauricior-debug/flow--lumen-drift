# Lumen Drift

A hydration tracker for daily water intake. Log a glass, follow a goal, and look back at the days.

The app is Expo SDK 58, opened in Expo Go. Screens live under `src/app`.

## Screens

- Splash
- Consent
- Onboarding
- Sign Up
- Sign In
- Reset password
- Privacy
- Home
- Add Water
- History
- Day detail
- Edit water log
- Profile
- Edit profile
- Notifications
- Add reminder and edit reminder
- Delete confirmation

## Run

```bash
npm install
npx expo start
```

Cloud sync is used only when Firebase env vars are present. Otherwise the log stays on the device.
