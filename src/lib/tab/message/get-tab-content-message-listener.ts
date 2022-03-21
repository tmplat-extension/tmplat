import { inject, injectable } from 'extension/common/di';
import { ReturnMessageListener } from 'extension/common/message/message-listener';
import { MessageType } from 'extension/common/message/message-type.enum';
import { MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import { GetTabContentMessageExpressionType } from 'extension/tab/message/get-tab-content-message-expression-type.enum';
import { GetTabContentMessageFormat } from 'extension/tab/message/get-tab-content-message-format.enum';
import { GetTabContentMessage, GetTabContentMessageReply } from 'extension/tab/message/get-tab-content-message.model';
import {
  getTabContentMessageReplySchema,
  getTabContentMessageSchema,
} from 'extension/tab/message/get-tab-content-message.schema';

@injectable()
export class GetTabContentMessageListener extends ReturnMessageListener<
  GetTabContentMessage,
  GetTabContentMessageReply
> {
  constructor(@inject(MessageServiceToken) messageService: MessageService) {
    super(
      {
        schemas: {
          message: getTabContentMessageSchema,
          reply: getTabContentMessageReplySchema,
        },
        type: MessageType.GetTabContent,
      },
      messageService,
    );
  }

  async onMessage(message: GetTabContentMessage): Promise<GetTabContentMessageReply> {
    const output = GetTabContentMessageListener.getContent(message);

    return { output };
  }

  private static formatOutput(element: Element | null, format: GetTabContentMessageFormat): string {
    if (!element) {
      return '';
    }

    switch (format) {
      case GetTabContentMessageFormat.Html:
        return element.innerHTML;
      case GetTabContentMessageFormat.Text:
        return element.textContent ?? '';
      default:
        throw new Error(`GetTabContentMessageFormat not supported: '${format}'`);
    }
  }

  private static getContent(message: GetTabContentMessage): string | readonly string[] {
    switch (message.expressionType) {
      case GetTabContentMessageExpressionType.Selector:
        return message.queryAll
          ? GetTabContentMessageListener.selectAll(message.expression, message.format)
          : GetTabContentMessageListener.select(message.expression, message.format);
      case GetTabContentMessageExpressionType.Xpath:
        return GetTabContentMessageListener.xpath(message.expression, message.format, message.queryAll);
      default:
        throw new Error(`GetTabContentMessageExpressionType not supported: '${message.expressionType}'`);
    }
  }

  private static select(expression: string, format: GetTabContentMessageFormat): string {
    return GetTabContentMessageListener.formatOutput(document.querySelector(expression), format);
  }

  private static selectAll(expression: string, format: GetTabContentMessageFormat): readonly string[] {
    const elements = document.querySelectorAll(expression);
    const results: string[] = [];

    elements.forEach((element) => {
      results.push(GetTabContentMessageListener.formatOutput(element, format));
    });

    return results;
  }

  private static xpath(
    expression: string,
    format: GetTabContentMessageFormat,
    queryAll: boolean,
  ): string | readonly string[] {
    const result = document.evaluate(expression, document, null, XPathResult.ANY_TYPE);

    switch (result.resultType) {
      case XPathResult.BOOLEAN_TYPE:
        return GetTabContentMessageListener.wrapInArrayIfQueryAll(`${result.booleanValue}`, queryAll);
      case XPathResult.NUMBER_TYPE:
        return GetTabContentMessageListener.wrapInArrayIfQueryAll(`${result.numberValue}`, queryAll);
      case XPathResult.STRING_TYPE:
        return GetTabContentMessageListener.wrapInArrayIfQueryAll(result.stringValue, queryAll);
      case XPathResult.ANY_UNORDERED_NODE_TYPE:
      case XPathResult.FIRST_ORDERED_NODE_TYPE:
        return GetTabContentMessageListener.wrapInArrayIfQueryAll(
          GetTabContentMessageListener.formatOutput(result.singleNodeValue as Element | null, format),
          queryAll,
        );
      case XPathResult.ORDERED_NODE_SNAPSHOT_TYPE:
      case XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE:
        const snapshotContents: string[] = [];

        for (let i = 0; i < result.snapshotLength; i++) {
          const snapshotNode = result.snapshotItem(i);
          if (!snapshotNode) {
            continue;
          }

          snapshotContents.push(GetTabContentMessageListener.formatOutput(snapshotNode as Element, format));

          if (!queryAll) {
            break;
          }
        }

        return queryAll ? snapshotContents : snapshotContents[0] ?? '';
      case XPathResult.ORDERED_NODE_ITERATOR_TYPE:
      case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
        const iteratorContents: string[] = [];
        let iteratorNode: Node | null = null;

        while ((iteratorNode = result.iterateNext())) {
          iteratorContents.push(GetTabContentMessageListener.formatOutput(iteratorNode as Element, format));

          if (!queryAll) {
            break;
          }
        }

        return queryAll ? iteratorContents : iteratorContents[0] ?? '';
      default:
        return GetTabContentMessageListener.wrapInArrayIfQueryAll('', queryAll);
    }
  }

  private static wrapInArrayIfQueryAll(value: string, queryAll: boolean): string | readonly string[] {
    if (!queryAll) {
      return value;
    }
    return value ? [value] : [];
  }
}
