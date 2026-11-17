import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { formatClock, formatDateTime, partsToTime, timeToParts, weekdayLabel } from '../lib/dates';
import type { RepeatPattern, Unit } from '../lib/types';
import { convertAmount, formatNumber, intakeIsValid, recommendedHint } from '../lib/units';
import { colors, radius, space, type } from '../theme/tokens';
import { PrimaryButton } from './ui';

export function UnitToggle({ unit, onChange }: { unit: Unit; onChange: (unit: Unit) => void }) {
  return (
    <View style={styles.units}>
      {(['ml', 'oz'] as Unit[]).map((option) => {
        const selected = option === unit;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={option}
            onPress={() => onChange(option)}
            style={({ pressed }) => [styles.unit, selected && styles.unitOn, pressed && styles.pressed]}
          >
            <Text style={[styles.unitLabel, selected && styles.unitLabelOn]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function AmountEditor({
  label,
  value,
  unit,
  onChange,
  error,
  hint,
  onBlur,
}: {
  label: string;
  value: string;
  unit: Unit;
  onChange: (value: string, unit: Unit) => void;
  error?: string | null;
  hint?: string | null;
  onBlur?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const numeric = Number(value);
  const shown = !focused && value !== '' && Number.isFinite(numeric)
    ? formatNumber(numeric, unit)
    : value;

  function switchUnit(next: Unit) {
    if (next === unit) return;
    if (value.trim() === '' || !Number.isFinite(numeric)) {
      onChange(value, next);
      return;
    }
    onChange(String(convertAmount(numeric, unit, next)), next);
  }

  return (
    <View style={[styles.card, error ? styles.cardError : null]}>
      <Text style={styles.cardLabel}>{label}</Text>
      <View style={styles.amountRow}>
        <View style={styles.amountField}>
          <TextInput
            value={shown}
            onChangeText={(text) => onChange(text.replace(/,/g, '').replace(/[^0-9.]/g, ''), unit)}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              onBlur?.();
            }}
            keyboardType="decimal-pad"
            accessibilityLabel={label}
            style={styles.amountInput}
          />
        </View>
        <UnitToggle unit={unit} onChange={switchUnit} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hintOutside}>{hint}</Text> : null}
    </View>
  );
}

export function GoalHint({ unit }: { unit: Unit }) {
  return <Text style={styles.hint}>{recommendedHint(unit)}</Text>;
}

export function TimeField({
  label,
  value,
  onChange,
  mode,
}: {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  mode: 'datetime' | 'time';
}) {
  const [open, setOpen] = useState(false);
  const display = mode === 'time' ? formatClock(value) : formatDateTime(value);

  function shift(part: 'day' | 'hour' | 'minute', delta: number) {
    const next = new Date(value);
    if (part === 'day') next.setDate(next.getDate() + delta);
    if (part === 'hour') next.setHours(next.getHours() + delta);
    if (part === 'minute') next.setMinutes(next.getMinutes() + delta * 5);
    onChange(next);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${display}`}
        onPress={() => setOpen((current) => !current)}
        style={({ pressed }) => [styles.timeRow, pressed && styles.pressed]}
      >
        <Ionicons name="time-outline" size={22} color={colors.ink} />
        <Text style={styles.timeText}>{display}</Text>
      </Pressable>
      {open && Platform.OS !== 'web' ? (
        <DateTimePicker
          value={value}
          mode={mode}
          display="spinner"
          themeVariant="light"
          onChange={(_event, selected) => {
            if (Platform.OS === 'android') setOpen(false);
            if (selected) onChange(selected);
          }}
        />
      ) : null}
      {open && Platform.OS === 'web' ? (
        <View style={styles.steppers}>
          {mode === 'datetime' ? (
            <Stepper label="Day" text={formatDateTime(value).split(',')[0]} onDown={() => shift('day', -1)} onUp={() => shift('day', 1)} />
          ) : null}
          <Stepper label="Hour" text={String(((value.getHours() + 11) % 12) + 1)} onDown={() => shift('hour', -1)} onUp={() => shift('hour', 1)} />
          <Stepper label="Minute" text={String(value.getMinutes()).padStart(2, '0')} onDown={() => shift('minute', -1)} onUp={() => shift('minute', 1)} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Toggle morning or afternoon"
            onPress={() => shift('hour', value.getHours() >= 12 ? -12 : 12)}
            style={({ pressed }) => [styles.ampm, pressed && styles.pressed]}
          >
            <Text style={styles.ampmText}>{value.getHours() >= 12 ? 'PM' : 'AM'}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function Stepper({ label, text, onDown, onUp }: { label: string; text: string; onDown: () => void; onUp: () => void }) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label}`} onPress={onDown} style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}>
          <Ionicons name="remove" size={18} color={colors.ink} />
        </Pressable>
        <Text style={styles.stepperValue}>{text}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label}`} onPress={onUp} style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}>
          <Ionicons name="add" size={18} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

export function RepeatPicker({
  pattern,
  customDays,
  onChange,
}: {
  pattern: RepeatPattern;
  customDays: number[];
  onChange: (pattern: RepeatPattern, customDays: number[]) => void;
}) {
  const options: { id: RepeatPattern; label: string }[] = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekdays', label: 'Weekdays' },
    { id: 'custom', label: 'Custom' },
  ];
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Repeat</Text>
      <View style={styles.repeatRow}>
        {options.map((option) => {
          const selected = pattern === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.id, customDays)}
              style={({ pressed }) => [styles.repeatChip, selected && styles.repeatChipOn, pressed && styles.pressed]}
            >
              <Text style={[styles.repeatText, selected && styles.repeatTextOn]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {pattern === 'custom' ? (
        <View style={styles.days}>
          {[0, 1, 2, 3, 4, 5, 6].map((day) => {
            const selected = customDays.includes(day);
            return (
              <Pressable
                key={day}
                accessibilityRole="button"
                accessibilityLabel={weekdayLabel(day)}
                accessibilityState={{ selected }}
                onPress={() => {
                  const next = selected ? customDays.filter((item) => item !== day) : [...customDays, day];
                  onChange('custom', next);
                }}
                style={({ pressed }) => [styles.dayChip, selected && styles.repeatChipOn, pressed && styles.pressed]}
              >
                <Text style={[styles.dayText, selected && styles.repeatTextOn]}>{weekdayLabel(day).slice(0, 1)}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export function useAmountState(initialValue: string, initialUnit: Unit) {
  const [value, setValue] = useState(initialValue);
  const [unit, setUnit] = useState<Unit>(initialUnit);
  const amount = Number(value);
  const error = useMemo(() => (value.trim() === '' ? null : intakeIsValid(amount, unit)), [amount, unit, value]);
  return {
    value,
    unit,
    error,
    set: (nextValue: string, nextUnit: Unit) => {
      setValue(nextValue);
      setUnit(nextUnit);
    },
  };
}

export function dateFromTime(time: string): Date {
  const { hours, minutes } = timeToParts(time);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function timeFromDate(date: Date): string {
  return partsToTime(date.getHours(), date.getMinutes());
}

export function FormActions({
  onCancel,
  onSave,
  loading,
  saveLabel = 'Save',
}: {
  onCancel: () => void;
  onSave: () => void;
  loading?: boolean;
  saveLabel?: string;
}) {
  return (
    <View style={styles.actions}>
      <View style={styles.action}>
        <PrimaryButton label="Cancel" variant="secondary" onPress={onCancel} />
      </View>
      <View style={styles.action}>
        <PrimaryButton label={saveLabel} onPress={onSave} loading={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: 10,
  },
  cardError: { borderColor: colors.danger },
  cardLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.ink },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amountField: { flex: 1, minWidth: 0 },
  amountInput: {
    width: '100%',
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    lineHeight: 40,
    color: colors.ink,
    minHeight: 52,
    paddingVertical: 0,
  },
  units: { flexDirection: 'row', gap: 8, flexShrink: 0 },
  unit: {
    minWidth: 58,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitOn: { backgroundColor: colors.primary },
  unitLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.ink },
  unitLabelOn: { color: colors.white },
  pressed: { opacity: 0.72 },
  error: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.danger },
  hint: { ...type.small, textAlign: 'center' },
  hintOutside: { ...type.small },
  timeRow: {
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: '#F4F8FC',
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.ink },
  steppers: { gap: 8 },
  stepper: { gap: 4 },
  stepperLabel: { ...type.small },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { flex: 1, textAlign: 'center', fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.ink },
  ampm: {
    minHeight: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ampmText: { fontFamily: 'Inter_700Bold', color: colors.white, fontSize: 16 },
  repeatRow: { flexDirection: 'row', gap: 8 },
  repeatChip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatChipOn: { backgroundColor: colors.primary },
  repeatText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.ink },
  repeatTextOn: { color: colors.white },
  days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  dayChip: {
    width: 40,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { fontFamily: 'Inter_600SemiBold', color: colors.ink },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1 },
});
