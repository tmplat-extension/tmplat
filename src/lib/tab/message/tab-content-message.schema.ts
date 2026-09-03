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

/**
 * Discriminated on `queryAll` because the shape of `output` depends entirely on it: a query for all matches always
 * resolves an array (empty when nothing matched) and a query for a single match always resolves a string.
 *
 * `queryAll` is echoed back purely to carry that discriminator. An undiscriminated
 * `z.string().or(z.array(z.string()))` would accept either shape for either request, so a content script regression
 * would be silently coerced by its consumers rather than reported. Validating it here means `MessageService` rejects
 * a mismatched response in the content script that produced it, rather than in the worker that received it.
 */
export const TabContentMessageOutputSchema = z
  .discriminatedUnion('queryAll', [
    z.object({ output: z.array(z.string()), queryAll: z.literal(true) }),
    z.object({ output: z.string(), queryAll: z.literal(false) }),
  ])
  .meta({ id: 'TabContentMessageOutput' });

export type TabContentMessageOutput = z.infer<typeof TabContentMessageOutputSchema>;
