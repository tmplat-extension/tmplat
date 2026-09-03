import { z } from 'zod';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';

export const TemplateDataActionPopupSchema = z
  .object({
    autoCloseEnabled: z.boolean(),
    optionLinkEnabled: z.boolean(),
  })
  .meta({ id: 'TemplateDataActionPopup' });

export type TemplateDataActionPopup = z.infer<typeof TemplateDataActionPopupSchema>;

export const TemplateDataActionSchema = z
  .object({
    mode: z.enum(TemplateActionMode),
    popup: TemplateDataActionPopupSchema,
    templateId: z.string().nonempty().nullable(),
  })
  .meta({ id: 'TemplateDataAction' });

export type TemplateDataAction = z.infer<typeof TemplateDataActionSchema>;

export const TemplateDataContextMenuSchema = z
  .object({
    autoPasteEnabled: z.boolean(), // TODO: Is this used?
    enabled: z.boolean(),
    mode: z.enum(TemplateContextMenuMode),
    optionLinkEnabled: z.boolean(),
  })
  .meta({ id: 'TemplateDataContextMenu' });

export type TemplateDataContextMenu = z.infer<typeof TemplateDataContextMenuSchema>;

export const TemplateDataLinkSchema = z
  .object({
    target: z.boolean(),
    title: z.boolean(),
  })
  .meta({ id: 'TemplateDataLink' });

export type TemplateDataLink = z.infer<typeof TemplateDataLinkSchema>;

export const TemplateDataMarkdownSchema = z
  .object({
    inline: z.boolean(),
  })
  .meta({ id: 'TemplateDataMarkdown' });

export type TemplateDataMarkdown = z.infer<typeof TemplateDataMarkdownSchema>;

export const TemplateDataShortcutsSchema = z
  .object({
    autoPasteEnabled: z.boolean(),
    enabled: z.boolean(),
  })
  .meta({ id: 'TemplateDataShortcuts' });

export type TemplateDataShortcuts = z.infer<typeof TemplateDataShortcutsSchema>;

export const TemplateDataTemplateBaseSchema = z
  .object({
    enabled: z.boolean(),
    id: z.string().nonempty().readonly(),
    shortcut: z.string().min(1).max(1).nullable(),
  })
  .meta({ id: 'TemplateDataTemplateBase' });

export type TemplateDataTemplateBase = z.infer<typeof TemplateDataTemplateBaseSchema>;

export const TemplateDataTemplatePredefinedSchema = TemplateDataTemplateBaseSchema.extend({
  predefined: z.literal(true).readonly(),
}).meta({ id: 'TemplateDataTemplatePredefined' });

export type TemplateDataTemplatePredefined = z.infer<typeof TemplateDataTemplatePredefinedSchema>;

export const TemplateDataTemplateUserDefinedSchema = TemplateDataTemplateBaseSchema.extend({
  content: z.string().nonempty(),
  description: z.string().nullable(),
  predefined: z.literal(false).readonly(),
  title: z.string().nonempty(),
}).meta({ id: 'TemplateDataTemplateUserDefined' });

export type TemplateDataTemplateUserDefined = z.infer<typeof TemplateDataTemplateUserDefinedSchema>;

export const TemplateDataTemplateSchema = z
  .discriminatedUnion('predefined', [TemplateDataTemplatePredefinedSchema, TemplateDataTemplateUserDefinedSchema])
  .meta({ id: 'TemplateDataTemplate' });

export type TemplateDataTemplate = z.infer<typeof TemplateDataTemplateSchema>;

export const TemplateDataSchema = z
  .object({
    action: TemplateDataActionSchema.required(),
    contextMenu: TemplateDataContextMenuSchema.required(),
    link: TemplateDataLinkSchema.required(),
    markdown: TemplateDataMarkdownSchema.required(),
    shortcuts: TemplateDataShortcutsSchema.required(),
    templates: z.array(TemplateDataTemplateSchema),
  })
  .meta({ id: 'TemplateData' });

export type TemplateData = z.infer<typeof TemplateDataSchema>;
