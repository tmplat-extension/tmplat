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
    const output = TabContentMessageListener.getContent(input);

    return { output };
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

  private static getContent(input: TabContentMessageInput): string | string[] {
    switch (input.expressionType) {
      case TabContentMessageExpressionType.Selector:
        return input.queryAll
          ? TabContentMessageListener.selectAll(input.expression, input.format)
          : TabContentMessageListener.select(input.expression, input.format);
      case TabContentMessageExpressionType.Xpath:
        return TabContentMessageListener.xpath(input.expression, input.format, input.queryAll);
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

  private static xpath(expression: string, format: TabContentMessageFormat, queryAll: boolean): string | string[] {
    const result = document.evaluate(expression, document, null, XPathResult.ANY_TYPE);

    switch (result.resultType) {
      case XPathResult.BOOLEAN_TYPE:
        return TabContentMessageListener.wrapInArrayIfQueryAll(`${result.booleanValue}`, queryAll);
      case XPathResult.NUMBER_TYPE:
        return TabContentMessageListener.wrapInArrayIfQueryAll(`${result.numberValue}`, queryAll);
      case XPathResult.STRING_TYPE:
        return TabContentMessageListener.wrapInArrayIfQueryAll(result.stringValue, queryAll);
      case XPathResult.ANY_UNORDERED_NODE_TYPE:
      case XPathResult.FIRST_ORDERED_NODE_TYPE:
        return TabContentMessageListener.wrapInArrayIfQueryAll(
          TabContentMessageListener.formatOutput(result.singleNodeValue as Element | null, format),
          queryAll,
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

        return queryAll ? snapshotContents : (snapshotContents[0] ?? '');
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

        return queryAll ? iteratorContents : (iteratorContents[0] ?? '');
      }
      default:
        return TabContentMessageListener.wrapInArrayIfQueryAll('', queryAll);
    }
  }

  private static wrapInArrayIfQueryAll(value: string, queryAll: boolean): string | string[] {
    if (!queryAll) {
      return value;
    }
    return value ? [value] : [];
  }
}
