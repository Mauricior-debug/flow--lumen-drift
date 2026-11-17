export function textOf(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map((item) => textOf(item)).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.message === 'string') return record.message;
    if (typeof record.label === 'string') return record.label;
    if (typeof record.path === 'string') return record.path;
    if (typeof record.error === 'string') return record.error;
    return '';
  }
  return '';
}

export function oneParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return textOf(value[0]);
  return textOf(value);
}
