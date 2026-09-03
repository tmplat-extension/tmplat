/**
 * The normalized view of the template being executed, as exposed by the `template` context entry.
 *
 * Predefined and user-defined templates are deliberately projected into a single shape so that a template does not
 * need to branch on `predefined` to read a title or description. Predefined templates contribute their resolved
 * (localized) title and description rather than their message keys, in the same way that they are projected on export.
 */
export type TemplateContextTemplate = {
  readonly content: string;
  readonly description: string | null;
  readonly enabled: boolean;
  readonly id: string;
  readonly predefined: boolean;
  readonly shortcut: string | null;
  readonly title: string;
};
