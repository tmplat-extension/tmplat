import { z } from 'zod';
import { ExtensionErrorJSONSchema } from 'extension/common/error/extension-error-json.schema';
import { MessageType } from 'extension/common/message/message-type.enum';

export const MessageInputSchema = z
  .object({
    data: z.unknown(),
    id: z.uuid(),
    type: z.enum(MessageType),
  })
  .meta({ id: 'MessageInput' });

export type MessageInput = z.infer<typeof MessageInputSchema>;

export const MessageOutputFailureSchema = z
  .object({
    error: ExtensionErrorJSONSchema,
    id: z.uuid(),
    result: z.literal('failure'),
  })
  .meta({ id: 'MessageOutputFailure' });

export type MessageOutputFailure = z.infer<typeof MessageOutputFailureSchema>;

export const MessageOutputSuccessSchema = z
  .object({
    data: z.unknown(),
    id: z.uuid(),
    result: z.literal('success'),
  })
  .meta({ id: 'MessageOutputSuccess' });

export type MessageOutputSuccess = z.infer<typeof MessageOutputSuccessSchema>;

export const MessageOutputSchema = z
  .discriminatedUnion('result', [MessageOutputFailureSchema, MessageOutputSuccessSchema])
  .meta({ id: 'MessageOutput' });

export type MessageOutput = z.infer<typeof MessageOutputSchema>;
