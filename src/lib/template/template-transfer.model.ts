/**
 * Version of the import/export format produced by
 * {@link import('extension/template/template.service').TemplateService.exportTemplates}.
 *
 * This is intentionally separate from the extension version so that the format can evolve independently.
 */
export const TEMPLATE_TRANSFER_VERSION = 1;

/**
 * Maximum length permitted for the title of a user-defined template, matching the limit enforced by the legacy options
 * page.
 */
export const TEMPLATE_TITLE_MAX_LENGTH = 32;

/**
 * The document that is base64-encoded when templates are exported and base64-decoded when they are imported.
 */
export type TemplateTransfer = {
  templates: TemplateTransferTemplate[];
  version: number;
};

/**
 * A single template within a {@link TemplateTransfer}.
 *
 * Deliberately contains no `id` or `predefined` flag; every imported template becomes a new user-defined template owned
 * by the importing installation. Predefined templates are projected into this shape on export using their resolved
 * (localised) title and description.
 */
export type TemplateTransferTemplate = {
  content: string;
  description: string | null;
  enabled: boolean;
  shortcut: string | null;
  title: string;
};
