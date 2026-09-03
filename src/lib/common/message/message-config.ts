import { type z } from 'zod';
import { type MessageType } from 'extension/common/message/message-type.enum';

export const MessageConfigToken = Symbol('MessageConfig');

export type MessageConfig<Input, Output> =
  | MessageConfigWithoutResponse<Input>
  | MessageConfigWithResponse<Input, Output>;

export type MessageConfigWithResponse<Input, Output> = {
  readonly responds: true;
  readonly schemas: MessageConfigWithResponseSchemas<Input, Output>;
  readonly type: MessageType;
};

export type MessageConfigWithResponseSchemas<Input, Output> = MessageConfigWithoutResponseSchemas<Input> & {
  readonly output: z.ZodType<Output>;
};

export type MessageConfigWithoutResponse<Input> = {
  readonly responds: false;
  readonly schemas: MessageConfigWithoutResponseSchemas<Input>;
  readonly type: MessageType;
};

export type MessageConfigWithoutResponseSchemas<Input> = {
  readonly input: z.ZodType<Input>;
};

export const defineMessageConfig = <Input>(
  type: MessageType,
  schemas: MessageConfigWithoutResponseSchemas<Input>,
): MessageConfigWithoutResponse<Input> =>
  Object.freeze({
    responds: false,
    schemas: Object.freeze(schemas),
    type,
  });

export const defineMessageConfigWithResponse = <Input, Output>(
  type: MessageType,
  schemas: MessageConfigWithResponseSchemas<Input, Output>,
): MessageConfigWithResponse<Input, Output> =>
  Object.freeze({
    responds: true,
    schemas: Object.freeze(schemas),
    type,
  });

export const mapMessageConfigs = (
  configs: Array<MessageConfig<unknown, unknown>>,
): ReadonlyMap<MessageType, MessageConfig<unknown, unknown>> => {
  const map = new Map<MessageType, MessageConfig<unknown, unknown>>();
  for (const config of configs) {
    if (map.has(config.type)) {
      throw new Error(`Duplicate message config for type: ${config.type}`);
    }
    map.set(config.type, config);
  }
  return map;
};
