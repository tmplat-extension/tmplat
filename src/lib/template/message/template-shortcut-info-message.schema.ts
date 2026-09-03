import { z } from 'zod';

export const TemplateShortcutInfoMessageInputSchema = z.object().meta({ id: 'TemplateShortcutInfoMessageInput' });

export type TemplateShortcutInfoMessageInput = z.infer<typeof TemplateShortcutInfoMessageInputSchema>;

export const TemplateShortcutInfoMessageOutputSchema = z
  .object({
    autoPasteEnabled: z.boolean(),
    enabled: z.boolean(),
    shortcuts: z.array(z.string()),
  })
  .meta({ id: 'TemplateShortcutInfoMessageOutput' });

export type TemplateShortcutInfoMessageOutput = z.infer<typeof TemplateShortcutInfoMessageOutputSchema>;

export const TemplateShortcutInfoChangedMessageInputSchema = z
  .object()
  .meta({ id: 'TemplateShortcutInfoChangedMessageInput' });

export type TemplateShortcutInfoChangedMessageInput = z.infer<typeof TemplateShortcutInfoChangedMessageInputSchema>;
