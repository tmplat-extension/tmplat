import { describe, expect, it, vi } from 'vitest';
import { type MessageService } from 'extension/common/message/message.service';
import { TabContentMessageExpressionType } from 'extension/tab/message/tab-content-message-expression-type.enum';
import { TabContentMessageFormat } from 'extension/tab/message/tab-content-message-format.enum';
import { TabContentMessageListener } from 'extension/tab/message/tab-content-message-listener';
import { type TabContentMessageInput } from 'extension/tab/message/tab-content-message.schema';

// XPathResult numeric constants, mirroring the WHATWG values the source switches on. Node has no DOM, so they are
// stubbed as a global for the duration of a test.
const XPATH_RESULT = {
  ANY_TYPE: 0,
  NUMBER_TYPE: 1,
  STRING_TYPE: 2,
  BOOLEAN_TYPE: 3,
  UNORDERED_NODE_ITERATOR_TYPE: 4,
  ORDERED_NODE_ITERATOR_TYPE: 5,
  UNORDERED_NODE_SNAPSHOT_TYPE: 6,
  ORDERED_NODE_SNAPSHOT_TYPE: 7,
  ANY_UNORDERED_NODE_TYPE: 8,
  FIRST_ORDERED_NODE_TYPE: 9,
};

type FakeElement = { innerHTML?: string; textContent?: string | null };

const element = (innerHTML: string, textContent: string | null = innerHTML): FakeElement => ({
  innerHTML,
  textContent,
});

const createListener = () => new TabContentMessageListener({} as unknown as MessageService);

const stubDocument = (overrides: Record<string, unknown>) => {
  vi.stubGlobal('XPathResult', XPATH_RESULT);
  vi.stubGlobal('document', overrides);
};

const selectorInput = (overrides: Partial<TabContentMessageInput> = {}): TabContentMessageInput => ({
  expression: 'h1',
  expressionType: TabContentMessageExpressionType.Selector,
  format: TabContentMessageFormat.Text,
  queryAll: false,
  ...overrides,
});

const xpathInput = (overrides: Partial<TabContentMessageInput> = {}): TabContentMessageInput => ({
  expression: '//h1',
  expressionType: TabContentMessageExpressionType.Xpath,
  format: TabContentMessageFormat.Text,
  queryAll: false,
  ...overrides,
});

describe('TabContentMessageListener', () => {
  describe('selector expressions', () => {
    it('returns the text content of the first match', async () => {
      stubDocument({ querySelector: vi.fn(() => element('<b>Hi</b>', 'Hi')) });

      await expect(createListener().onMessage(selectorInput())).resolves.toEqual({ output: 'Hi' });
    });

    it('returns the inner HTML of the first match when the html format is requested', async () => {
      stubDocument({ querySelector: vi.fn(() => element('<b>Hi</b>')) });

      await expect(
        createListener().onMessage(selectorInput({ format: TabContentMessageFormat.Html })),
      ).resolves.toEqual({ output: '<b>Hi</b>' });
    });

    it('returns an empty string when nothing matches', async () => {
      stubDocument({ querySelector: vi.fn(() => null) });

      await expect(createListener().onMessage(selectorInput())).resolves.toEqual({ output: '' });
    });

    it('returns an empty string when a matched element has no text content', async () => {
      stubDocument({ querySelector: vi.fn(() => element('', null)) });

      await expect(createListener().onMessage(selectorInput())).resolves.toEqual({ output: '' });
    });

    it('returns an array of every match when queryAll is set', async () => {
      stubDocument({ querySelectorAll: vi.fn(() => [element('', 'one'), element('', 'two')]) });

      await expect(createListener().onMessage(selectorInput({ queryAll: true }))).resolves.toEqual({
        output: ['one', 'two'],
      });
    });
  });

  describe('xpath expressions', () => {
    const givenXPathResult = (result: Record<string, unknown>) => {
      stubDocument({ evaluate: vi.fn(() => result) });
    };

    it('stringifies a boolean result', async () => {
      givenXPathResult({ resultType: XPATH_RESULT.BOOLEAN_TYPE, booleanValue: true });

      await expect(createListener().onMessage(xpathInput())).resolves.toEqual({ output: 'true' });
    });

    it('stringifies a number result', async () => {
      givenXPathResult({ resultType: XPATH_RESULT.NUMBER_TYPE, numberValue: 42 });

      await expect(createListener().onMessage(xpathInput())).resolves.toEqual({ output: '42' });
    });

    it('returns a string result verbatim', async () => {
      givenXPathResult({ resultType: XPATH_RESULT.STRING_TYPE, stringValue: 'hello' });

      await expect(createListener().onMessage(xpathInput())).resolves.toEqual({ output: 'hello' });
    });

    it('wraps a scalar result in an array when queryAll is set', async () => {
      givenXPathResult({ resultType: XPATH_RESULT.STRING_TYPE, stringValue: 'hello' });

      await expect(createListener().onMessage(xpathInput({ queryAll: true }))).resolves.toEqual({ output: ['hello'] });
    });

    it('formats a single ordered node result', async () => {
      givenXPathResult({
        resultType: XPATH_RESULT.FIRST_ORDERED_NODE_TYPE,
        singleNodeValue: element('<i>x</i>', 'x'),
      });

      await expect(createListener().onMessage(xpathInput())).resolves.toEqual({ output: 'x' });
    });

    it('collects every node of a snapshot when queryAll is set', async () => {
      const nodes = [element('', 'a'), element('', 'b')];
      givenXPathResult({
        resultType: XPATH_RESULT.ORDERED_NODE_SNAPSHOT_TYPE,
        snapshotLength: nodes.length,
        snapshotItem: (index: number) => nodes[index],
      });

      await expect(createListener().onMessage(xpathInput({ queryAll: true }))).resolves.toEqual({
        output: ['a', 'b'],
      });
    });

    it('returns only the first node of a snapshot when queryAll is not set', async () => {
      const nodes = [element('', 'a'), element('', 'b')];
      givenXPathResult({
        resultType: XPATH_RESULT.ORDERED_NODE_SNAPSHOT_TYPE,
        snapshotLength: nodes.length,
        snapshotItem: (index: number) => nodes[index],
      });

      await expect(createListener().onMessage(xpathInput())).resolves.toEqual({ output: 'a' });
    });

    it('iterates every node of an iterator result when queryAll is set', async () => {
      const nodes = [element('', 'a'), element('', 'b'), null];
      let index = 0;
      givenXPathResult({
        resultType: XPATH_RESULT.ORDERED_NODE_ITERATOR_TYPE,
        iterateNext: () => nodes[index++] ?? null,
      });

      await expect(createListener().onMessage(xpathInput({ queryAll: true }))).resolves.toEqual({
        output: ['a', 'b'],
      });
    });

    it('returns an empty string for an unhandled result type', async () => {
      givenXPathResult({ resultType: XPATH_RESULT.ANY_TYPE });

      await expect(createListener().onMessage(xpathInput())).resolves.toEqual({ output: '' });
    });
  });
});
