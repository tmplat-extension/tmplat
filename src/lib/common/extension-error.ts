// TODO: Change from having a localized error to instead using unique error codes

export class ExtensionError extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'ExtensionError';

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
