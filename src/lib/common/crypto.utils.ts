/**
 * Computes the lowercase hexadecimal SHA-256 digest of `value`, using the Web Crypto API available in both
 * background/options and content-script contexts.
 */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
