import { z } from 'zod';
import { ExecuteTemplateMessageOutcome } from 'extension/template/message/execute-template-message-outcome.enum';
import { ExecuteTemplateMessageSource } from 'extension/template/message/execute-template-message-source.enum';

export const ExecuteTemplateMessageInputBaseSchema = z
  .object({
    suppressNotifications: z.boolean().optional(),
    tabId: z.number().optional(),
    url: z.url().optional(),
  })
  .meta({ id: 'ExecuteTemplateMessageInputBase' });

export type ExecuteTemplateMessageInputBase = z.infer<typeof ExecuteTemplateMessageInputBaseSchema>;

export const ExecuteTemplateMessageInputPopupSchema = ExecuteTemplateMessageInputBaseSchema.extend({
  id: z.string().nonempty(),
  source: z.literal(ExecuteTemplateMessageSource.Popup),
}).meta({ id: 'ExecuteTemplateMessageInputPopup' });

export type ExecuteTemplateMessageInputPopup = z.infer<typeof ExecuteTemplateMessageInputPopupSchema>;

export const ExecuteTemplateMessageInputShortcutSchema = ExecuteTemplateMessageInputBaseSchema.extend({
  shortcut: z.string().min(1).max(1),
  source: z.literal(ExecuteTemplateMessageSource.Shortcut),
}).meta({ id: 'ExecuteTemplateMessageInputShortcut' });

export type ExecuteTemplateMessageInputShortcut = z.infer<typeof ExecuteTemplateMessageInputShortcutSchema>;

export const ExecuteTemplateMessageInputSchema = z
  .discriminatedUnion('source', [ExecuteTemplateMessageInputPopupSchema, ExecuteTemplateMessageInputShortcutSchema])
  .meta({ id: 'ExecuteTemplateMessageInput' });

export type ExecuteTemplateMessageInput = z.infer<typeof ExecuteTemplateMessageInputSchema>;

export const ExecuteTemplateMessageOutputExecutedSchema = z
  .object({
    outcome: z.literal(ExecuteTemplateMessageOutcome.Executed),
    output: z.string().nonempty(),
  })
  .meta({ id: 'ExecuteTemplateMessageOutputExecuted' });

export type ExecuteTemplateMessageOutputExecuted = z.infer<typeof ExecuteTemplateMessageOutputExecutedSchema>;

export const ExecuteTemplateMessageOutputSkippedSchema = z
  .object({
    outcome: z.literal(ExecuteTemplateMessageOutcome.Skipped),
    reason: z.string().nonempty(),
  })
  .meta({ id: 'ExecuteTemplateMessageOutputSkipped' });

export type ExecuteTemplateMessageOutputSkipped = z.infer<typeof ExecuteTemplateMessageOutputSkippedSchema>;

export const ExecuteTemplateMessageOutputSchema = z
  .discriminatedUnion('outcome', [
    ExecuteTemplateMessageOutputExecutedSchema,
    ExecuteTemplateMessageOutputSkippedSchema,
  ])
  .meta({ id: 'ExecuteTemplateMessageOutput' });

export type ExecuteTemplateMessageOutput = z.infer<typeof ExecuteTemplateMessageOutputSchema>;
