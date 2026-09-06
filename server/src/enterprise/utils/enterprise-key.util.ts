import { randomBytes } from 'crypto';

/**
 * Enterprise Key Format: ENT-XXXX-XXXX-XXXX
 * Uses unambiguous uppercase alphanumeric characters.
 */
const KEY_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateEnterpriseKey(): string {
  const bytes = randomBytes(12);
  let chars = '';
  for (let i = 0; i < 12; i++) {
    chars += KEY_ALPHABET[bytes[i] % KEY_ALPHABET.length];
  }
  const chunk1 = chars.slice(0, 4);
  const chunk2 = chars.slice(4, 8);
  const chunk3 = chars.slice(8, 12);
  return `ENT-${chunk1}-${chunk2}-${chunk3}`;
}

export function isValidEnterpriseKeyFormat(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const regex = /^ENT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return regex.test(key.trim().toUpperCase());
}
