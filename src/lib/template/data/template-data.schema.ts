import { z } from 'zod';
import { ExtensionVersionSchema } from 'extension/common/extension-version.schema';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';

export const TemplateActionPopupSchema = z
  .object({
    autoCloseEnabled: z.boolean(),
    optionLinkEnabled: z.boolean(),
  })
  .meta({ id: 'TemplateActionPopup' });

export type TemplateActionPopup = z.infer<typeof TemplateActionPopupSchema>;

export const TemplateActionSchema = z
  .object({
    mode: z.enum(TemplateActionMode),
    popup: TemplateActionPopupSchema,
    templateId: z.string().nonempty().nullable(),
  })
  .meta({ id: 'TemplateAction' });

export type TemplateAction = z.infer<typeof TemplateActionSchema>;

export const TemplateContextMenuSchema = z
  .object({
    autoPasteEnabled: z.boolean(), // TODO: Is this used?
    enabled: z.boolean(),
    mode: z.enum(TemplateContextMenuMode),
    optionLinkEnabled: z.boolean(),
  })
  .meta({ id: 'TemplateContextMenu' });

export type TemplateContextMenu = z.infer<typeof TemplateContextMenuSchema>;

export const TemplateLinkSchema = z
  .object({
    target: z.boolean(),
    title: z.boolean(),
  })
  .meta({ id: 'TemplateLink' });

export type TemplateLink = z.infer<typeof TemplateLinkSchema>;

export const TemplateMarkdownSchema = z
  .object({
    inline: z.boolean(),
  })
  .meta({ id: 'TemplateMarkdown' });

export type TemplateMarkdown = z.infer<typeof TemplateMarkdownSchema>;

export const TemplateShortcutSchema = z
  .object({
    autoPasteEnabled: z.boolean(),
    enabled: z.boolean(),
  })
  .meta({ id: 'TemplateShortcut' });

export type TemplateShortcut = z.infer<typeof TemplateShortcutSchema>;

export const TemplateShortcutStringSchema = z
  .string()
  .regex(/^[A-Z0-9]$/)
  .meta({ id: 'TemplateShortcutString' });

export type TemplateShortcutString = z.infer<typeof TemplateShortcutStringSchema>;

/**
 * Normalizes `value` to the canonical single upper-case alphanumeric shortcut, or `null` when it cannot be
 * represented as one.
 *
 * 1.x validated shortcuts with an *unanchored, case-insensitive* expression (`R_VALID_SHORTCUT = /[A-Z0-9]/i`) and
 * only trimmed and upper-cased them on the options page wizard, so its import path could persist values such as
 * `'u'` or `'ab'` verbatim. Both the data migrator and the transfer schema run legacy data through here so that the
 * same value cannot produce a different outcome depending on which path it arrives through.
 */
export const normalizeTemplateShortcut = (value: string | null | undefined): TemplateShortcutString | null => {
  const normalized = value?.trim().toUpperCase();

  return normalized && TemplateShortcutStringSchema.safeParse(normalized).success ? normalized : null;
};

export const TemplateBaseDefinitionSchema = z
  .object({
    enabled: z.boolean(),
    id: z.string().nonempty().readonly(),
    shortcut: TemplateShortcutStringSchema.nullable(),
  })
  .meta({ id: 'TemplateBaseDefinition' });

export type TemplateBaseDefinition = z.infer<typeof TemplateBaseDefinitionSchema>;

export const TemplateMigrationSchema = z
  .object({
    id: z.string().nonempty().readonly(),
    version: ExtensionVersionSchema.readonly(),
  })
  .meta({ id: 'TemplateMigration' });

export type TemplateMigration = z.infer<typeof TemplateMigrationSchema>;

export const TemplateMigrationsSchema = z
  .partialRecord(ExtensionVersionSchema, TemplateMigrationSchema)
  .meta({ id: 'TemplateMigrations' });

export type TemplateMigrations = z.infer<typeof TemplateMigrationsSchema>;

export const TemplatePredefinedSchema = TemplateBaseDefinitionSchema.extend({
  predefined: z.literal(true).readonly(),
}).meta({ id: 'TemplatePredefined' });

export type TemplatePredefined = z.infer<typeof TemplatePredefinedSchema>;

export const TemplateUserDefinedSchema = TemplateBaseDefinitionSchema.extend({
  content: z.string().nonempty(),
  description: z.string().nullable(),
  migrations: TemplateMigrationsSchema.optional(),
  predefined: z.literal(false).readonly(),
  title: z.string().nonempty(),
}).meta({ id: 'TemplateUserDefined' });

export type TemplateUserDefined = z.infer<typeof TemplateUserDefinedSchema>;

export const TemplateDefinitionSchema = z
  .discriminatedUnion('predefined', [TemplatePredefinedSchema, TemplateUserDefinedSchema])
  .meta({ id: 'TemplateDefinition' });

export type TemplateDefinition = z.infer<typeof TemplateDefinitionSchema>;

export const TemplateDataSchema = z
  .object({
    action: TemplateActionSchema,
    contextMenu: TemplateContextMenuSchema,
    link: TemplateLinkSchema,
    markdown: TemplateMarkdownSchema,
    shortcuts: TemplateShortcutSchema,
    templates: z.array(TemplateDefinitionSchema),
  })
  .meta({ id: 'TemplateData' });

export type TemplateData = z.infer<typeof TemplateDataSchema>;
