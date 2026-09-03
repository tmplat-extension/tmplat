import { describe, expect, it } from 'vitest';
import { MessageType } from 'extension/common/message/message-type.enum';
import { PasteMessageConfig } from 'extension/tab/message/paste-message-config';
import { PasteMessageInputSchema } from 'extension/tab/message/paste-message.schema';
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

  // The output is discriminated on `queryAll` because the shape of `output` depends entirely on it. An
  // undiscriminated union would accept either shape for either request, letting a content script regression be
  // silently coerced by its consumers instead of reported.
  describe('output', () => {
    it.each([
      ['a string for a single-match query', { output: 'hello', queryAll: false }],
      ['an empty string for a single-match query that matched nothing', { output: '', queryAll: false }],
      ['an array of strings for an all-match query', { output: ['a', 'b'], queryAll: true }],
      ['an empty array for an all-match query that matched nothing', { output: [], queryAll: true }],
    ])('accepts %s', (_label, value) => {
      expect(TabContentMessageOutputSchema.safeParse(value).success).toBe(true);
    });

    it.each([
      ['a numeric output', { output: 1, queryAll: false }],
      ['an array for a single-match query', { output: ['a'], queryAll: false }],
      ['a string for an all-match query', { output: 'a', queryAll: true }],
      ['an array of non-strings for an all-match query', { output: [1], queryAll: true }],
      ['a missing discriminator', { output: 'a' }],
      ['a non-boolean discriminator', { output: 'a', queryAll: 'no' }],
    ])('rejects %s', (_label, value) => {
      expect(TabContentMessageOutputSchema.safeParse(value).success).toBe(false);
    });

    it('reports the mismatch against output rather than the discriminator', () => {
      const result = TabContentMessageOutputSchema.safeParse({ output: 'a', queryAll: true });

      expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual(['output']);
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

describe('PasteMessage schemas', () => {
  it('accepts an input carrying the rendered output', () => {
    expect(PasteMessageInputSchema.safeParse({ value: 'rendered' }).success).toBe(true);
  });

  // There is nothing to splice in, so an empty value would be a silent no-op rather than a paste
  it('rejects an empty value', () => {
    expect(PasteMessageInputSchema.safeParse({ value: '' }).success).toBe(false);
  });

  it.each([{}, { value: 1 }, { value: null }, { value: ['a'] }])('rejects the malformed input %j', (input) => {
    expect(PasteMessageInputSchema.safeParse(input).success).toBe(false);
  });
});

describe('tab message configs', () => {
  // A paste is fire-and-forget: the copy it follows has already succeeded, so there is no outcome to report back
  it('defines the Paste config as not responding', () => {
    expect(PasteMessageConfig).toMatchObject({
      responds: false,
      type: MessageType.Paste,
      schemas: { input: PasteMessageInputSchema },
    });
  });

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
