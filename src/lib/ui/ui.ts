export const UiToken = Symbol('Ui');

export interface Ui {
  init(): Promise<void>;
}
