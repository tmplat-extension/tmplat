import { z } from 'zod';
import { TabContextSchema } from 'extension/tab/tab-context.schema';

export const TabContextMessageInputSchema = z.object().meta({ id: 'TabContextMessageInput' });

export type TabContextMessageInput = z.infer<typeof TabContextMessageInputSchema>;

export const TabContextMessageOutputSchema = z
  .object({
    context: TabContextSchema,
  })
  .meta({ id: 'TabContextMessageOutput' });

export type TabContextMessageOutput = z.infer<typeof TabContextMessageOutputSchema>;
