import type { Unit, WaterLog } from './types';

export const ML_PER_OZ = 29.5735295625;

export function toMl(amount: number, unit: Unit): number {
  if (!Number.isFinite(amount)) return 0;
  return unit === 'ml' ? amount : amount * ML_PER_OZ;
}

export function fromMl(ml: number, unit: Unit): number {
  if (!Number.isFinite(ml)) return 0;
  return unit === 'ml' ? ml : ml / ML_PER_OZ;
}

export function roundForUnit(amount: number, unit: Unit): number {
  if (!Number.isFinite(amount)) return 0;
  if (unit === 'ml') return Math.round(amount);
  return Math.round(amount * 10) / 10;
}

export function convertAmount(amount: number, from: Unit, to: Unit): number {
  return roundForUnit(fromMl(toMl(amount, from), to), to);
}

export function formatNumber(amount: number, unit: Unit): string {
  const rounded = roundForUnit(amount, unit);
  return rounded.toLocaleString('en-US', {
    maximumFractionDigits: unit === 'oz' ? 1 : 0,
    minimumFractionDigits: 0,
  });
}

export function formatAmount(amount: number, unit: Unit): string {
  return `${formatNumber(amount, unit)} ${unit}`;
}

export function totalMl(logs: WaterLog[]): number {
  return logs.reduce((sum, log) => sum + toMl(log.amount, log.unit), 0);
}

export function goalMl(goal: number, unit: Unit): number {
  return toMl(goal, unit);
}

export function percentOf(currentMl: number, targetMl: number): number {
  if (!Number.isFinite(targetMl) || targetMl <= 0) return 0;
  return Math.round((currentMl / targetMl) * 100);
}

export function presetAmounts(unit: Unit): number[] {
  return unit === 'ml' ? [250, 500, 750, 1000] : [8, 16, 24, 32];
}

export function recommendedGoal(unit: Unit): number {
  return unit === 'ml' ? 2000 : 68;
}

export function recommendedHint(unit: Unit): string {
  return unit === 'ml'
    ? 'Recommended: 2000 ml (about 8 cups)'
    : 'Recommended: 68 oz (about 8 cups)';
}

export function goalIsValid(amount: number, unit: Unit): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return 'Enter a daily water goal.';
  const ml = toMl(amount, unit);
  if (ml < 250) return unit === 'ml' ? 'Enter at least 250 ml.' : 'Enter at least 8 oz.';
  if (ml > 10000) return unit === 'ml' ? 'Enter a goal under 10,000 ml.' : 'Enter a goal under 340 oz.';
  return null;
}

export function intakeIsValid(amount: number, unit: Unit): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return 'Enter how much water you drank.';
  const ml = toMl(amount, unit);
  if (ml > 5000) return 'That amount looks too large for one entry.';
  return null;
}
