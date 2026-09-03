import { z } from 'zod';

export const ConvertMarkdownMessageInputSchema = z
  .object({
    html: z.string().nonempty(),
    inline: z.boolean(),
  })
  .meta({ id: 'ConvertMarkdownMessageInput' });

export type ConvertMarkdownMessageInput = z.infer<typeof ConvertMarkdownMessageInputSchema>;

export const ConvertMarkdownMessageOutputSchema = z
  .object({
    markdown: z.string(),
  })
  .meta({ id: 'ConvertMarkdownMessageOutput' });

export type ConvertMarkdownMessageOutput = z.infer<typeof ConvertMarkdownMessageOutputSchema>;
