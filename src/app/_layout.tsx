import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { ChromeProvider } from '../lib/chrome';
import { StoreProvider } from '../lib/store';
import { colors } from '../theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.canvas);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <SafeAreaProvider>
        <StoreProvider>
          <ChromeProvider>
            <StatusBar style="dark" />
            <Head>
              <title>Lumen Drift</title>
              <meta
                name="description"
                content="Lumen Drift tracks daily water intake, a hydration goal, and reminders to drink."
              />
              <meta property="og:title" content="Lumen Drift" />
              <meta
                property="og:description"
                content="Log water, follow a daily goal, and look back at your intake."
              />
            </Head>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: colors.canvas },
              }}
            >
              <Stack.Screen name="index" options={{ animation: 'none' }} />
              <Stack.Screen name="consent" options={{ animation: 'fade' }} />
              <Stack.Screen
                name="confirm-delete"
                options={
                  Platform.OS === 'web'
                    ? { presentation: 'transparentModal', animation: 'fade', headerShown: false }
                    : {
                        presentation: 'formSheet',
                        sheetGrabberVisible: true,
                        sheetAllowedDetents: [0.42, 0.8],
                        headerShown: false,
                        contentStyle: { backgroundColor: colors.white },
                      }
                }
              />
            </Stack>
          </ChromeProvider>
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
