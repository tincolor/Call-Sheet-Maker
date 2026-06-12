import { signal } from '@preact/signals';

export const storeSignal = signal(null);
export const saveStatusSignal = signal('saved');

export function commit() {
  storeSignal.value = { ...storeSignal.value };
}

