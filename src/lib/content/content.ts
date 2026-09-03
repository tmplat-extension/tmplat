export const ContentToken = Symbol('ContentToken');

export interface Content {
  inject(): void;
}
