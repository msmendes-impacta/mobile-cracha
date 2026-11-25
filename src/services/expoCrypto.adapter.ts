import * as Crypto from 'expo-crypto';

import { bytesToHex, type CryptoPort } from './crypto.port';

/** Production CryptoPort backed by expo-crypto (SDK 58). Verified manually on device. */
export const expoCryptoAdapter: CryptoPort = {
  randomUUID: () => Crypto.randomUUID(),
  randomHex: async (bytes) => bytesToHex(await Crypto.getRandomBytesAsync(bytes)),
  sha256Hex: (input) =>
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input, {
      encoding: Crypto.CryptoEncoding.HEX,
    }),
};
