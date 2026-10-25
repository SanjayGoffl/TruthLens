import { clsx } from 'clsx';

/**
 * shadcn/ui class helper. Tailwind utilities are prefixed, so plain clsx is
 * enough here — the prefixed classes cannot collide with Bootstrap utilities.
 */
export function cn(...inputs) {
  return clsx(inputs);
}
