import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { bytesToHex, type CryptoPort } from '../../src/services/crypto.port';

/** Test CryptoPort with the same semantics as the expo-crypto adapter. */
export function createNodeCryptoAdapter(): CryptoPort {
  return {
    randomUUID: () => randomUUID(),
    randomHex: async (bytes) => bytesToHex(new Uint8Array(randomBytes(bytes))),
    sha256Hex: async (input) => createHash('sha256').update(input, 'utf8').digest('hex'),
  };
}
