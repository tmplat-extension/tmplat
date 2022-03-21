export function decodeBase64(str: string | null): string {
  return str ? atob(str) : '';
}

export function encodeBase64(str: string | null): string {
  return str ? btoa(str) : '';
}
