import { z } from 'zod';

export const TEMPLATE_TRANSFER_VERSION = 1;

export const TEMPLATE_TITLE_MAX_LENGTH = 32;

export const TemplateTransferTemplateSchema = z
  .object({
    content: z.string(),
    description: z.string().nullable().optional(),
    enabled: z.boolean(),
    shortcut: z.string().min(1).max(1).nullable().optional(),
    title: z.string().min(1).max(TEMPLATE_TITLE_MAX_LENGTH),
  })
  .meta({ id: 'TemplateTransferTemplate' });

export type TemplateTransferTemplate = z.infer<typeof TemplateTransferTemplateSchema>;

export const TemplateTransferSchema = z
  .object({
    templates: z.array(TemplateTransferTemplateSchema).nonempty(),
    version: z.literal(TEMPLATE_TRANSFER_VERSION),
  })
  .meta({ id: 'TemplateTransfer' });

export type TemplateTransfer = z.infer<typeof TemplateTransferSchema>;
