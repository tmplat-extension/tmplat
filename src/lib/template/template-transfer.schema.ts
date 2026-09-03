import { z } from 'zod';
import { normalizeTemplateShortcut } from 'extension/template/data/template-data.schema';

export const TEMPLATE_TRANSFER_VERSION = 1;

export const TEMPLATE_TITLE_MAX_LENGTH = 32;

export const TemplateTransferSchema = z
  .object({
    content: z.string().transform((v) => v || ' '),
    description: z.string().nullable().optional(),
    enabled: z.boolean(),
    shortcut: z.string().transform(normalizeTemplateShortcut).nullable().optional(),
    title: z.string().min(1).max(TEMPLATE_TITLE_MAX_LENGTH),
  })
  .meta({ id: 'TemplateTransfer' });

export type TemplateTransfer = z.infer<typeof TemplateTransferSchema>;

export const TemplateTransferDataSchema = z
  .object({
    templates: z.array(TemplateTransferSchema).nonempty(),
    version: z.literal(TEMPLATE_TRANSFER_VERSION),
  })
  .meta({ id: 'TemplateTransferData' });

export type TemplateTransferData = z.infer<typeof TemplateTransferDataSchema>;
