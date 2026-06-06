import { signal, computed } from '@preact/signals';

export const storeSignal = signal(null);
export const saveStatusSignal = signal('saved');

// Transient (never persisted) — recomputed by autoReflowSections() on every content change.
export const autoBreaksSignal = signal([]); // string[] of section IDs that need an auto break before them
export const scheduleOverflowSignal = signal(null); // { sectionId: string, overflowPx: number } | null

export function commit() {
  storeSignal.value = { ...storeSignal.value };
}

export const currentDay = computed(() => {
  const s = storeSignal.value;
  if (!s || !s.days) return null;
  return s.days.find(d => d.id === s.currentDayId) || s.days[0];
});
