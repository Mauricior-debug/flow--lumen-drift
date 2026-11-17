import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { nextAfterSplash } from '../lib/guards';
import { useStore } from '../lib/store';
import { textOf } from '../lib/text';
import { colors, space } from '../theme/tokens';
import { BrandMark, ErrorState, LoadingState, PrimaryButton, Wordmark } from '../components/ui';

const motion = require('../../assets/splash-motion.mp4');

export default function SplashScreen() {
  const { ready, bootError, session, draft, hasAccount, reload } = useStore();
  const [videoError, setVideoError] = useState<string | null>(null);
  const opacity = useSharedValue(1);
  const left = useRef(false);
  const routeRef = useRef<ReturnType<typeof nextAfterSplash>>('/consent');
  routeRef.current = nextAfterSplash({
    consentGiven: draft.consentGiven,
    session: Boolean(session),
    hasAccount,
    goalSet: draft.goalSet,
  });

  const player = useVideoPlayer(motion, (item) => {
    item.loop = true;
    item.muted = true;
    item.play();
  });

  useEffect(() => {
    const subscription = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'error') setVideoError(textOf(error) || 'The opening could not play.');
    });
    return () => subscription.remove();
  }, [player]);

  function go() {
    if (left.current) return;
    left.current = true;
    router.replace(routeRef.current);
  }

  useEffect(() => {
    if (!ready || videoError || bootError) return;
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 420 }, (finished) => {
        if (finished) runOnJS(go)();
      });
    }, 4000);
    return () => clearTimeout(timer);
  }, [bootError, opacity, ready, videoError]);

  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const failed = videoError || bootError;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {failed ? (
        <View style={styles.fallback}>
          <BrandMark size={96} />
          <Wordmark />
          <ErrorState
            message={videoError || bootError || 'Lumen Drift could not start.'}
            onRetry={() => {
              setVideoError(null);
              void player.play();
              void reload();
            }}
          />
          <PrimaryButton label="Continue" variant="secondary" onPress={go} />
        </View>
      ) : (
        <Animated.View style={[styles.fill, fade]}>
          <VideoView
            player={player}
            style={styles.fill}
            contentFit="cover"
            nativeControls={false}
            allowsPictureInPicture={false}
          />
          {!ready ? (
            <View style={styles.loading}>
              <LoadingState message="Loading your hydration journey…" />
            </View>
          ) : null}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07080C' },
  fill: { flex: 1 },
  fallback: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    gap: space.lg,
  },
  loading: {
    position: 'absolute',
    left: space.xl,
    right: space.xl,
    bottom: 48,
  },
});
