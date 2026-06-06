import { signal, computed } from '@preact/signals';

export const storeSignal = signal(null);
export const saveStatusSignal = signal('saved');

export function commit() {
  storeSignal.value = { ...storeSignal.value };
}

export const currentDay = computed(() => {
  const s = storeSignal.value;
  if (!s || !s.days) return null;
  return s.days.find(d => d.id === s.currentDayId) || s.days[0];
});
