const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map((part) => Number(part));
  return new Date(y || 1970, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function isSameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

export function formatMonthDay(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function formatFullDate(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatTodayLine(date: Date, now = new Date()): string {
  const full = formatFullDate(date);
  return isSameDay(date, now) ? `Today, ${full}` : full;
}

export function formatClock(date: Date): string {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${suffix}`;
}

export function formatDateTime(date: Date): string {
  return `${formatFullDate(date)}, ${formatClock(date)}`;
}

export function timeToParts(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map((part) => Number(part));
  return {
    hours: Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 9,
    minutes: Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0,
  };
}

export function partsToTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatTimeString(time: string): string {
  const { hours, minutes } = timeToParts(time);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return formatClock(date);
}

export function lastNDays(count: number, from = new Date()): Date[] {
  const origin = startOfDay(from);
  const days: Date[] = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    const day = new Date(origin);
    day.setDate(origin.getDate() - index);
    days.push(day);
  }
  return days;
}

export function weekdayLabel(index: number): string {
  return WEEKDAYS[index] ?? '';
}

export function repeatLabel(pattern: string, customDays: number[] | undefined): string {
  if (pattern === 'daily') return 'Every day';
  if (pattern === 'weekdays') return 'Weekdays';
  const days = (customDays ?? []).filter((day) => day >= 0 && day <= 6).sort((a, b) => a - b);
  if (!days.length) return 'Custom';
  return days.map((day) => weekdayLabel(day)).join(', ');
}

export function chartTick(date: Date, index: number, total: number): string {
  if (total <= 7) {
    if (index === 0) return formatMonthDay(date);
    return String(date.getDate());
  }
  if (index === 0 || index === total - 1 || index % 5 === 0) return formatMonthDay(date);
  return '';
}
