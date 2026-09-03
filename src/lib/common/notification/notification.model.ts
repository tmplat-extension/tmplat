export type Notification = {
  /**
   * Secondary line rendered beneath {@link Notification.message} in a smaller, muted font. Used for supporting
   * detail the user does not need to read, such as an error code.
   */
  readonly contextMessage?: string;
  readonly id?: string;
  readonly message?: string;
  readonly title?: string;
};
