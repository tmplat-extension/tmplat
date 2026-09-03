import { inject, injectable } from 'extension/common/di';
import { RespondingMessageListener } from 'extension/common/message/message-listener';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import { TabContentMessageExpressionType } from 'extension/tab/message/tab-content-message-expression-type.enum';
import { TabContentMessageFormat } from 'extension/tab/message/tab-content-message-format.enum';
import {
  type TabContentMessageInput,
  type TabContentMessageOutput,
} from 'extension/tab/message/tab-content-message.schema';

@injectable()
export class TabContentMessageListener extends RespondingMessageListener<
  TabContentMessageInput,
  TabContentMessageOutput
> {
  constructor(@inject(MessageServiceToken) messageService: MessageService) {
    super(messageService, MessageType.TabContent);
  }

  async onMessage(input: TabContentMessageInput): Promise<TabContentMessageOutput> {
    return input.queryAll
      ? { output: TabContentMessageListener.getAllContent(input), queryAll: true }
      : { output: TabContentMessageListener.getContent(input), queryAll: false };
  }

  private static formatOutput(element: Element | null, format: TabContentMessageFormat): string {
    if (!element) {
      return '';
    }

    switch (format) {
      case TabContentMessageFormat.Html:
        return element.innerHTML;
      case TabContentMessageFormat.Text:
        return element.textContent ?? '';
    }
  }

  /** Resolves every match for the specified `input`, which is an empty array when nothing matched. */
  private static getAllContent(input: TabContentMessageInput): string[] {
    switch (input.expressionType) {
      case TabContentMessageExpressionType.Selector:
        return TabContentMessageListener.selectAll(input.expression, input.format);
      case TabContentMessageExpressionType.Xpath:
        return TabContentMessageListener.xpathAll(input.expression, input.format, true);
    }
  }

  /** Resolves only the first match for the specified `input`, which is an empty string when nothing matched. */
  private static getContent(input: TabContentMessageInput): string {
    switch (input.expressionType) {
      case TabContentMessageExpressionType.Selector:
        return TabContentMessageListener.select(input.expression, input.format);
      case TabContentMessageExpressionType.Xpath:
        return TabContentMessageListener.xpathAll(input.expression, input.format, false)[0] ?? '';
    }
  }

  private static select(expression: string, format: TabContentMessageFormat): string {
    return TabContentMessageListener.formatOutput(document.querySelector(expression), format);
  }

  private static selectAll(expression: string, format: TabContentMessageFormat): string[] {
    const elements = document.querySelectorAll(expression);
    const results: string[] = [];

    elements.forEach((element) => {
      results.push(TabContentMessageListener.formatOutput(element, format));
    });

    return results;
  }

  /**
   * Always resolves an array so that both callers share one implementation; `getContent` takes the first entry.
   *
   * `queryAll` still has to be threaded through because the snapshot and iterator branches stop after the first
   * match when it is `false`, rather than walking a potentially large result set only to discard it.
   */
  private static xpathAll(expression: string, format: TabContentMessageFormat, queryAll: boolean): string[] {
    const result = document.evaluate(expression, document, null, XPathResult.ANY_TYPE);

    switch (result.resultType) {
      case XPathResult.BOOLEAN_TYPE:
        return TabContentMessageListener.wrapInArray(`${result.booleanValue}`);
      case XPathResult.NUMBER_TYPE:
        return TabContentMessageListener.wrapInArray(`${result.numberValue}`);
      case XPathResult.STRING_TYPE:
        return TabContentMessageListener.wrapInArray(result.stringValue);
      case XPathResult.ANY_UNORDERED_NODE_TYPE:
      case XPathResult.FIRST_ORDERED_NODE_TYPE:
        return TabContentMessageListener.wrapInArray(
          TabContentMessageListener.formatOutput(result.singleNodeValue as Element | null, format),
        );
      case XPathResult.ORDERED_NODE_SNAPSHOT_TYPE:
      case XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE: {
        const snapshotContents: string[] = [];

        for (let i = 0; i < result.snapshotLength; i++) {
          const snapshotNode = result.snapshotItem(i);
          if (!snapshotNode) {
            continue;
          }

          snapshotContents.push(TabContentMessageListener.formatOutput(snapshotNode as Element, format));

          if (!queryAll) {
            break;
          }
        }

        return snapshotContents;
      }
      case XPathResult.ORDERED_NODE_ITERATOR_TYPE:
      case XPathResult.UNORDERED_NODE_ITERATOR_TYPE: {
        const iteratorContents: string[] = [];
        let iteratorNode: Node | null = null;

        while ((iteratorNode = result.iterateNext())) {
          iteratorContents.push(TabContentMessageListener.formatOutput(iteratorNode as Element, format));

          if (!queryAll) {
            break;
          }
        }

        return iteratorContents;
      }
      default:
        return [];
    }
  }

  /** An empty value means nothing matched, so it is represented as an empty array rather than `['']`. */
  private static wrapInArray(value: string): string[] {
    return value ? [value] : [];
  }
}
