import { useEffect, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useChrome } from '../lib/chrome';
import { colors, radius, space, type } from '../theme/tokens';

const mark = require('../../assets/icon.png');

export function BrandMark({ size = 36 }: { size?: number }) {
  return <Image source={mark} style={{ width: size, height: size }} resizeMode="contain" accessibilityIgnoresInvertColors />;
}

export function Wordmark({ size = 22 }: { size?: number }) {
  return <Text style={[type.wordmark, { fontSize: size, lineHeight: size + 6 }]}>Lumen Drift</Text>;
}

export function AppHeader({
  back = false,
  right,
}: {
  back?: boolean;
  right?: 'profile' | 'notifications';
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>
        {back ? (
          <IconButton icon="chevron-back" label="Back" onPress={() => router.back()} />
        ) : null}
      </View>
      <View style={styles.headerBrand}>
        <BrandMark size={34} />
        <Wordmark size={20} />
      </View>
      <View style={styles.headerSide}>
        {right === 'profile' ? (
          <IconButton icon="person-outline" label="Profile" onPress={() => router.navigate('/profile')} />
        ) : null}
        {right === 'notifications' ? (
          <IconButton icon="settings-outline" label="Notifications" onPress={() => router.push('/notifications')} />
        ) : null}
      </View>
    </View>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  color = colors.ink,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}
    >
      <Ionicons name={icon} size={22} color={color} />
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'text';
}) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        variant === 'text' && styles.buttonText,
        pressed && variant === 'primary' && styles.buttonPrimaryPressed,
        pressed && variant === 'secondary' && styles.buttonSecondaryPressed,
        pressed && variant === 'danger' && styles.buttonDangerPressed,
        pressed && variant === 'text' && styles.buttonTextPressed,
        inactive && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? colors.white : colors.primary} />
      ) : (
        <Text
          style={[
            type.button,
            variant === 'primary' || variant === 'danger' ? styles.buttonLabelLight : styles.buttonLabelDark,
            variant === 'text' && styles.buttonLabelLink,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function TextField({
  value,
  onChangeText,
  placeholder,
  icon,
  secure = false,
  revealed = false,
  onToggleReveal,
  error,
  keyboardType = 'default',
  autoCapitalize = 'none',
  textContentType,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon?: keyof typeof Ionicons.glyphMap;
  secure?: boolean;
  revealed?: boolean;
  onToggleReveal?: () => void;
  error?: string | null;
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  textContentType?: 'emailAddress' | 'password' | 'newPassword' | 'none';
}) {
  return (
    <View style={styles.fieldWrap}>
      <View style={[styles.field, error ? styles.fieldError : null]}>
        {icon ? <Ionicons name={icon} size={20} color={colors.muted} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          secureTextEntry={secure && !revealed}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          textContentType={textContentType}
          accessibilityLabel={placeholder}
          style={styles.fieldInput}
        />
        {secure && onToggleReveal ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            onPress={onToggleReveal}
            hitSlop={8}
            style={({ pressed }) => [styles.eye, pressed && styles.iconPressed]}
          >
            <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function GlassIcon({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path
        d="M8 6h16l-1.8 15.2A6.4 6.4 0 0 1 15.9 28h.2a6.4 6.4 0 0 1-6.3-6.8L8 6z"
        fill={colors.mist}
        stroke={colors.primary}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M10.2 14.2h11.6L20.6 20a4.4 4.4 0 0 1-8.6.1l-1.8-5.9z" fill={colors.sky} />
      <Path d="M12 9.2h8" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function WaveFooter() {
  return (
    <View pointerEvents="none" style={styles.wave}>
      <Svg width="100%" height="100%" viewBox="0 0 390 180" preserveAspectRatio="none">
        <Path d="M0 70c48 28 78 8 128-4 54-13 78 18 130 18 42 0 78-28 132-18v114H0V70z" fill="#D7ECFB" />
        <Path d="M0 108c60 18 90-10 146-8 58 2 74 28 132 22 40-4 70-24 112-10v68H0v-72z" fill="#B9DCF8" />
        <Path d="M0 142c70 16 110-8 170 2 48 8 80 18 220-6v42H0v-38z" fill="#8ECAF6" opacity={0.85} />
      </Svg>
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeBody}>{body}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeTitle}>Something went wrong</Text>
      <Text style={styles.noticeBody}>{message}</Text>
      {onRetry ? <PrimaryButton label="Try again" onPress={onRetry} /> : null}
    </View>
  );
}

export function LoadingState({ message }: { message: string }) {
  return (
    <View style={styles.notice}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={[styles.noticeBody, { marginTop: space.md, textAlign: 'center' }]}>{message}</Text>
    </View>
  );
}

export function FlashBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.flash}>
      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
      <Text style={styles.flashText}>{message}</Text>
    </View>
  );
}

export function Toggle({
  value,
  onValueChange,
  label,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      hitSlop={8}
      style={({ pressed }) => [styles.toggle, value && styles.toggleOn, pressed && styles.tabPressed]}
    >
      <View style={[styles.knob, value && styles.knobOn]} />
    </Pressable>
  );
}

export function Screen({
  children,
  scroll = false,
  tabs = false,
  wave = false,
  footer,
  background = colors.canvas,
}: {
  children: ReactNode;
  scroll?: boolean;
  tabs?: boolean;
  wave?: boolean;
  footer?: ReactNode;
  background?: string;
}) {
  const insets = useSafeAreaInsets();
  const body = scroll ? (
    <View style={styles.flex}>{children}</View>
  ) : (
    <View style={[styles.flex, { paddingBottom: tabs ? 0 : insets.bottom }]}>{children}</View>
  );
  return (
    <View style={styles.screen}>
      <View style={[styles.frame, { backgroundColor: background, paddingTop: insets.top }]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {body}
          {footer ? <View style={[styles.footer, tabs ? null : { paddingBottom: Math.max(insets.bottom, space.md) }]}>{footer}</View> : null}
          {tabs ? <TabBar /> : null}
          {wave ? <WaveFooter /> : null}
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

export function TabBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { section, setSection, scrollToTop } = useChrome();
  const items: { key: 'home' | 'history' | 'add' | 'profile'; label: string; href: '/home' | '/history' | '/add-water' | '/profile'; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'home', label: 'Home', href: '/home', icon: 'home' },
    { key: 'history', label: 'History', href: '/history', icon: 'bar-chart' },
    { key: 'add', label: 'Add water', href: '/add-water', icon: 'add' },
    { key: 'profile', label: 'Profile', href: '/profile', icon: 'person' },
  ];

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {items.map((item) => {
        const selected = item.key !== 'add' && (pathname === item.href || (item.key === section && !['/home', '/history', '/profile'].includes(pathname) && item.key === section));
        const active = pathname === item.href;
        if (item.key === 'add') {
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityLabel="Add water"
              onPress={() => router.push('/add-water')}
              style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
            >
              <Ionicons name="add" size={32} color={colors.white} />
            </Pressable>
          );
        }
        const iconName = item.key === 'history'
          ? (active || selected ? 'bar-chart' : 'bar-chart-outline')
          : item.key === 'profile'
            ? (active || selected ? 'person' : 'person-outline')
            : (active || selected ? 'home' : 'home-outline');
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (item.key !== 'home' && item.key !== 'history' && item.key !== 'profile') return;
              if (pathname === item.href) {
                scrollToTop(item.key);
                return;
              }
              setSection(item.key);
              router.navigate(item.href);
            }}
            style={({ pressed }) => [styles.tabItem, pressed && styles.tabPressed]}
          >
            <Ionicons name={iconName} size={22} color={active || selected ? colors.primary : colors.faint} />
            <Text style={[styles.tabLabel, (active || selected) && styles.tabLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function CheckboxRow({
  checked,
  label,
  onPress,
}: {
  checked: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.checkRow, pressed && styles.tabPressed]}
    >
      <View style={[styles.checkBox, checked && styles.checkBoxOn]}>
        {checked ? <Ionicons name="checkmark" size={18} color={colors.white} /> : null}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

export function useSection(section: 'home' | 'history' | 'profile') {
  const { setSection } = useChrome();
  useEffect(() => {
    setSection(section);
  }, [section, setSection]);
}

export function cardStyle(): StyleProp<ViewStyle> {
  return styles.card;
}

export function labelStyle(): StyleProp<TextStyle> {
  return styles.fieldLabel;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, alignItems: 'center', backgroundColor: '#E7F2FB' },
  frame: { flex: 1, width: '100%', maxWidth: 480 },
  header: {
    minHeight: 56,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSide: { width: 48, alignItems: 'center', justifyContent: 'center' },
  headerBrand: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  iconPressed: { opacity: 0.6 },
  button: {
    minHeight: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonPrimaryPressed: { backgroundColor: colors.primaryPressed },
  buttonSecondary: { backgroundColor: colors.soft },
  buttonSecondaryPressed: { backgroundColor: '#E2E8EF' },
  buttonDanger: { backgroundColor: colors.danger },
  buttonDangerPressed: { backgroundColor: colors.dangerPressed },
  buttonText: { backgroundColor: 'transparent', minHeight: 44 },
  buttonTextPressed: { opacity: 0.6 },
  buttonDisabled: { opacity: 0.55 },
  buttonLabelLight: { color: colors.white },
  buttonLabelDark: { color: colors.ink },
  buttonLabelLink: { color: colors.primary },
  fieldWrap: { gap: 6 },
  field: {
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldError: { borderColor: colors.danger },
  fieldInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.ink,
    minHeight: 48,
  },
  eye: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18, color: colors.danger },
  wave: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 170 },
  notice: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: space.lg,
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  noticeTitle: { ...type.h2 },
  noticeBody: { ...type.bodyMuted },
  flash: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E9F8F1',
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: 10,
  },
  flashText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.success },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    paddingBottom: space.sm,
    backgroundColor: colors.canvas,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 10,
    minHeight: 64,
  },
  tabItem: { minWidth: 64, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabPressed: { opacity: 0.55 },
  tabLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 14, color: colors.faint },
  tabLabelActive: { color: colors.primary },
  addButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    borderWidth: 4,
    borderColor: colors.white,
  },
  addButtonPressed: { backgroundColor: colors.primaryPressed, transform: [{ scale: 0.96 }] },
  checkRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', minHeight: 44 },
  checkBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#C5D4E6',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkBoxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkLabel: { ...type.body, flex: 1 },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D5DDE6',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleOn: { backgroundColor: colors.primary },
  knob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
  },
  knobOn: { alignSelf: 'flex-end' },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
  },
  fieldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.ink, marginBottom: 10 },
});
