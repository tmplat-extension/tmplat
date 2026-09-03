export function decodeBase64(str: string | null): string {
  return str ? atob(str) : '';
}

export function encodeBase64(str: string | null): string {
  return str ? btoa(str) : '';
}

/**
 * Decodes a base64 string that was encoded by {@link encodeBase64Utf8}.
 *
 * Unlike {@link decodeBase64}, this supports the full Unicode range and so must be used for any user-authored content
 * (e.g. template content), which is not restricted to Latin-1.
 */
export function decodeBase64Utf8(str: string | null): string {
  if (!str) {
    return '';
  }

  const binary = atob(str);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

/**
 * Encodes a string as base64 after first encoding it as UTF-8.
 *
 * Unlike {@link encodeBase64}, this supports the full Unicode range and so must be used for any user-authored content
 * (e.g. template content), which is not restricted to Latin-1.
 */
export function encodeBase64Utf8(str: string | null): string {
  if (!str) {
    return '';
  }

  const bytes = new TextEncoder().encode(str);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}
