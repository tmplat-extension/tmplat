import { z } from 'zod';

export const PasteMessageInputSchema = z
  .object({
    value: z.string().nonempty(),
  })
  .meta({ id: 'PasteMessageInput' });

export type PasteMessageInput = z.infer<typeof PasteMessageInputSchema>;
