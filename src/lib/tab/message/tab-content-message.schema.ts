import { z } from 'zod';
import { TabContentMessageExpressionType } from 'extension/tab/message/tab-content-message-expression-type.enum';
import { TabContentMessageFormat } from 'extension/tab/message/tab-content-message-format.enum';

export const TabContentMessageInputSchema = z
  .object({
    expression: z.string(),
    expressionType: z.enum(TabContentMessageExpressionType),
    format: z.enum(TabContentMessageFormat),
    queryAll: z.boolean(),
  })
  .meta({ id: 'TabContentMessageInput' });

export type TabContentMessageInput = z.infer<typeof TabContentMessageInputSchema>;

export const TabContentMessageOutputSchema = z
  .object({
    output: z.string().or(z.array(z.string())),
  })
  .meta({ id: 'TabContentMessageOutput' });

export type TabContentMessageOutput = z.infer<typeof TabContentMessageOutputSchema>;
