export class ExtensionError extends Error {
  constructor(message?: string) {
    super(message);

    this.name = 'ExtensionError';

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
