import { z } from 'zod';

export const CopyMessageInputSchema = z
  .object({
    content: z.string().nonempty(),
  })
  .meta({ id: 'CopyMessageInput' });

export type CopyMessageInput = z.infer<typeof CopyMessageInputSchema>;

export const CopyMessageOutputSchema = z
  .object({
    copied: z.boolean(),
  })
  .meta({ id: 'CopyMessageOutput' });

export type CopyMessageOutput = z.infer<typeof CopyMessageOutputSchema>;
