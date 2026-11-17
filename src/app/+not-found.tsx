import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton } from '../components/ui';
import { colors, space, type } from '../theme/tokens';

export default function NotFound() {
  return (
    <View style={styles.page}>
      <Text style={type.h1}>That screen is not in Lumen Drift.</Text>
      <PrimaryButton label="Go to Home" onPress={() => router.replace('/home')} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.canvas,
    justifyContent: 'center',
    padding: space.xl,
    gap: space.lg,
  },
});
