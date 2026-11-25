/**
 * Cryptographic primitives the services depend on. The app injects the expo-crypto
 * adapter; tests inject a node:crypto adapter, so services stay testable without
 * native modules (plan Complexity Tracking).
 */
export interface CryptoPort {
  randomUUID(): string;
  /** `bytes` cryptographically secure random bytes, as lowercase hex. */
  randomHex(bytes: number): Promise<string>;
  /** SHA-256 of the UTF-8 encoding of `input`, as lowercase hex. */
  sha256Hex(input: string): Promise<string>;
}

export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0');
  return hex;
}
