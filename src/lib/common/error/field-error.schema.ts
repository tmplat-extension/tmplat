import { z } from 'zod';

export const FieldErrorSchema = z
  .object({
    message: z.string(),
    path: z.array(z.string()),
    type: z.string(),
  })
  .meta({ id: 'FieldError' });

export type FieldError = z.infer<typeof FieldErrorSchema>;
