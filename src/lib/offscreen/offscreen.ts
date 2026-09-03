export const OffscreenToken = Symbol('OffscreenToken');

export interface Offscreen {
  run(): void;
}
