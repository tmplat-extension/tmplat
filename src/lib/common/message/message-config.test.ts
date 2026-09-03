import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  defineMessageConfig,
  defineMessageConfigWithResponse,
  mapMessageConfigs,
  type MessageConfig,
} from 'extension/common/message/message-config';
import { MessageType } from 'extension/common/message/message-type.enum';

describe('defineMessageConfig', () => {
  it('describes a message type that expects no response', () => {
    const schemas = { input: z.object({ tabId: z.number() }) };

    const config = defineMessageConfig(MessageType.TabContent, schemas);

    expect(config).toMatchObject({ responds: false, schemas, type: MessageType.TabContent });
  });

  it('freezes the config and its schemas so a registered config cannot be mutated', () => {
    const config = defineMessageConfig(MessageType.TabContent, { input: z.unknown() });

    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.schemas)).toBe(true);
  });
});

describe('defineMessageConfigWithResponse', () => {
  it('describes a message type that expects a response', () => {
    const schemas = { input: z.object({ content: z.string() }), output: z.object({ copied: z.boolean() }) };

    const config = defineMessageConfigWithResponse(MessageType.Copy, schemas);

    expect(config).toMatchObject({ responds: true, schemas, type: MessageType.Copy });
  });

  it('freezes the config and its schemas', () => {
    const config = defineMessageConfigWithResponse(MessageType.Copy, {
      input: z.unknown(),
      output: z.unknown(),
    });

    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.schemas)).toBe(true);
  });
});

describe('mapMessageConfigs', () => {
  it('indexes each config by its message type', () => {
    const copy = defineMessageConfigWithResponse(MessageType.Copy, { input: z.unknown(), output: z.unknown() });
    const tabContent = defineMessageConfig(MessageType.TabContent, { input: z.unknown() });

    const map = mapMessageConfigs([copy, tabContent]);

    expect(map.get(MessageType.Copy)).toBe(copy);
    expect(map.get(MessageType.TabContent)).toBe(tabContent);
    expect(map.size).toBe(2);
  });

  it('throws when two configs claim the same message type, since only one can be registered', () => {
    const first = defineMessageConfig(MessageType.TabContent, { input: z.unknown() });
    const second = defineMessageConfig(MessageType.TabContent, { input: z.unknown() });

    expect(() => mapMessageConfigs([first as MessageConfig<unknown, unknown>, second])).toThrow(
      /Duplicate message config for type: tab_content/,
    );
  });

  it('produces an empty map for no configs', () => {
    expect(mapMessageConfigs([]).size).toBe(0);
  });
});
