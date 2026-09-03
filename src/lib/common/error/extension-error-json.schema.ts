import { z } from 'zod';
import { ExtensionErrorCodeSchema } from 'extension/common/error/extension-error-code.schema';
import { FieldErrorSchema } from 'extension/common/error/field-error.schema';

export const ExtensionErrorJSONSchema = z
  .object({
    code: ExtensionErrorCodeSchema,
    fieldErrors: z.array(FieldErrorSchema).optional(),
    message: z.string(),
    name: z.string().regex(/^ExtensionError\([A-Z]{3}[1-9][0-9]{5}\)$/),
    stack: z.string().optional(),
  })
  .meta({ id: 'ExtensionErrorJSON' });

export type ExtensionErrorJSON = z.infer<typeof ExtensionErrorJSONSchema>;
