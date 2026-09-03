import { describe, expect, it } from 'vitest';
import { MessageType } from 'extension/common/message/message-type.enum';
import { TabContentMessageConfig } from 'extension/tab/message/tab-content-message-config';
import { TabContentMessageExpressionType } from 'extension/tab/message/tab-content-message-expression-type.enum';
import { TabContentMessageFormat } from 'extension/tab/message/tab-content-message-format.enum';
import {
  TabContentMessageInputSchema,
  TabContentMessageOutputSchema,
} from 'extension/tab/message/tab-content-message.schema';
import { TabContextMessageConfig } from 'extension/tab/message/tab-context-message-config';
import {
  TabContextMessageInputSchema,
  TabContextMessageOutputSchema,
} from 'extension/tab/message/tab-context-message.schema';
import { createTabContext } from 'extension/test/tab.fake';

const VALID_CONTENT_INPUT = {
  expression: 'h1',
  expressionType: TabContentMessageExpressionType.Selector,
  format: TabContentMessageFormat.Text,
  queryAll: false,
};

describe('tab message enums', () => {
  it('enumerates the supported content expression types', () => {
    expect(Object.values(TabContentMessageExpressionType)).toEqual(['selector', 'xpath']);
  });

  it('enumerates the supported content formats', () => {
    expect(Object.values(TabContentMessageFormat)).toEqual(['html', 'text']);
  });
});

describe('TabContentMessage schemas', () => {
  describe('input', () => {
    it('accepts a valid input', () => {
      expect(TabContentMessageInputSchema.safeParse(VALID_CONTENT_INPUT).success).toBe(true);
    });

    it.each([
      ['an unknown expression type', { ...VALID_CONTENT_INPUT, expressionType: 'css' }],
      ['an unknown format', { ...VALID_CONTENT_INPUT, format: 'markdown' }],
      ['a missing expression', { expressionType: 'selector', format: 'text', queryAll: false }],
      ['a non-boolean queryAll', { ...VALID_CONTENT_INPUT, queryAll: 'no' }],
    ])('rejects %s', (_label, value) => {
      expect(TabContentMessageInputSchema.safeParse(value).success).toBe(false);
    });
  });

  describe('output', () => {
    it.each([
      ['a string', { output: 'hello' }],
      ['an array of strings', { output: ['a', 'b'] }],
    ])('accepts %s', (_label, value) => {
      expect(TabContentMessageOutputSchema.safeParse(value).success).toBe(true);
    });

    it('rejects a numeric output', () => {
      expect(TabContentMessageOutputSchema.safeParse({ output: 1 }).success).toBe(false);
    });
  });
});

describe('TabContextMessage schemas', () => {
  it('accepts an empty input object', () => {
    expect(TabContextMessageInputSchema.safeParse({}).success).toBe(true);
  });

  it('accepts an output wrapping a valid tab context', () => {
    expect(TabContextMessageOutputSchema.safeParse({ context: createTabContext() }).success).toBe(true);
  });

  it('rejects an output whose context is malformed', () => {
    expect(TabContextMessageOutputSchema.safeParse({ context: { text: 1 } }).success).toBe(false);
  });
});

describe('tab message configs', () => {
  it('defines the TabContent config as responding with its schemas', () => {
    expect(TabContentMessageConfig).toMatchObject({
      responds: true,
      type: MessageType.TabContent,
      schemas: { input: TabContentMessageInputSchema, output: TabContentMessageOutputSchema },
    });
  });

  it('defines the TabContext config as responding with its schemas', () => {
    expect(TabContextMessageConfig).toMatchObject({
      responds: true,
      type: MessageType.TabContext,
      schemas: { input: TabContextMessageInputSchema, output: TabContextMessageOutputSchema },
    });
  });
});
