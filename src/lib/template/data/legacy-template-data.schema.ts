import { z } from 'zod';

export const LegacyTemplateLinkDataSchema = z
  .object({
    target: z.boolean().optional(),
    title: z.boolean().optional(),
  })
  .meta({ id: 'LegacyTemplateLinkData' });

export type LegacyTemplateLinkData = z.infer<typeof LegacyTemplateLinkDataSchema>;

export const LegacyTemplateMarkdownDataSchema = z
  .object({
    inline: z.boolean().optional(),
  })
  .meta({ id: 'LegacyTemplateMarkdownData' });

export type LegacyTemplateMarkdownData = z.infer<typeof LegacyTemplateMarkdownDataSchema>;

export const LegacyTemplateContextMenuDataSchema = z
  .object({
    enabled: z.boolean().optional(),
    paste: z.boolean().optional(),
    options: z.boolean().optional(),
  })
  .meta({ id: 'LegacyTemplateContextMenuData' });

export type LegacyTemplateContextMenuData = z.infer<typeof LegacyTemplateContextMenuDataSchema>;

export const LegacyTemplateShortcutDataSchema = z
  .object({
    enabled: z.boolean().optional(),
    paste: z.boolean().optional(),
  })
  .meta({ id: 'LegacyTemplateShortcutData' });

export type LegacyTemplateShortcutData = z.infer<typeof LegacyTemplateShortcutDataSchema>;

export const LegacyTemplateToolbarDataSchema = z
  .object({
    close: z.boolean().optional(),
    key: z.string().nullable().optional(),
    options: z.boolean().optional(),
    popup: z.boolean().optional(),
  })
  .meta({ id: 'LegacyTemplateToolbarData' });

export type LegacyTemplateToolbarData = z.infer<typeof LegacyTemplateToolbarDataSchema>;

export const LegacyTemplateDefinitionSchema = z
  .object({
    content: z.string(),
    enabled: z.boolean(),
    index: z.int(),
    key: z.string().nonempty(),
    readOnly: z.boolean(),
    shortcut: z.string().nullable(),
    title: z.string().nonempty(),
  })
  .meta({ id: 'LegacyTemplateDefinition' });

export type LegacyTemplateDefinition = z.infer<typeof LegacyTemplateDefinitionSchema>;

export const LegacyTemplatesDataSchema = z.array(z.looseObject({})).meta({ id: 'LegacyTemplatesData' });

export type LegacyTemplatesData = z.infer<typeof LegacyTemplatesDataSchema>;
