// Permanent share-link code for a published sphere (eng-review D7): 8 chars of
// base62. Generated app-side; the caller inserts it under a unique constraint
// and regenerates on the rare collision (see PublishToggle). 62^8 ≈ 2.2e14, so
// collisions are astronomically unlikely — the retry is a correctness backstop,
// not a hot path.
const ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
export const SHORT_CODE_LENGTH = 8;

export function generateShortCode(): string {
  const bytes = new Uint8Array(SHORT_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
    // Modulo bias across 62 is negligible for an opaque, non-sequential id.
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}
