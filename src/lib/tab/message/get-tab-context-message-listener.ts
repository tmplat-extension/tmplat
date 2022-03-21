import { inject, injectable } from 'extension/common/di';
import { ReturnMessageListener } from 'extension/common/message/message-listener';
import { MessageType } from 'extension/common/message/message-type.enum';
import { MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import { GetTabContextMessageReply } from 'extension/tab/message/get-tab-context-message.model';
import {
  getTabContextMessageReplySchema,
  getTabContextMessageSchema,
} from 'extension/tab/message/get-tab-context-message.schema';
import { TabContext, TabContextSelection } from 'extension/tab/tab.model';

@injectable()
export class GetTabContextMessageListener extends ReturnMessageListener<any, GetTabContextMessageReply> {
  constructor(@inject(MessageServiceToken) messageService: MessageService) {
    super(
      {
        schemas: {
          message: getTabContextMessageSchema,
          reply: getTabContextMessageReplySchema,
        },
        type: MessageType.GetTabContext,
      },
      messageService,
    );
  }

  protected async onMessage(): Promise<GetTabContextMessageReply> {
    /*
     * TODO: Allow message to describe what information should be returned (should only happen if using long-lived
     *  connection with tab during template engine execution)
     */
    const context: TabContext = {
      characterSet: document.characterSet,
      cookiesEnabled: navigator.cookieEnabled,
      html: document.documentElement.outerHTML,
      images: GetTabContextMessageListener.mapItemProperty(document.images, 'src'),
      javaEnabled: navigator.javaEnabled(),
      lastModified: document.lastModified,
      links: GetTabContextMessageListener.mapItemProperty(document.links, 'href'),
      meta: GetTabContextMessageListener.mapMetaContent(),
      referrer: document.referrer,
      screenColorDepth: screen.colorDepth,
      scripts: GetTabContextMessageListener.mapItemProperty(document.scripts, 'src'),
      selection: GetTabContextMessageListener.getSelection(),
      size: {
        height: innerHeight,
        width: innerWidth,
      },
      storage: {
        local: GetTabContextMessageListener.cloneStorage(localStorage),
        session: GetTabContextMessageListener.cloneStorage(sessionStorage),
      },
      styleSheets: GetTabContextMessageListener.mapItemProperty(document.styleSheets, 'href'),
    };

    return { context };
  }

  private static cloneStorage(storage: Storage): Record<string, string> {
    const result: Record<string, string> = {};

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key) {
        continue;
      }

      result[key] = storage.getItem(key)!;
    }

    return result;
  }

  private static getSelection(): TabContextSelection {
    const selection = getSelection();
    if (!selection || selection.isCollapsed) {
      return {
        html: '',
        images: [],
        links: [],
        text: '',
      };
    }

    const contents = selection.getRangeAt(0).cloneContents();
    const container = document.createElement('div');
    container.appendChild(contents);

    return {
      html: container.innerHTML,
      images: GetTabContextMessageListener.mapItemProperty(
        container.querySelectorAll<HTMLImageElement>('img[src]'),
        'src',
      ),
      links: GetTabContextMessageListener.mapItemProperty(
        container.querySelectorAll<HTMLAnchorElement>('a[href]'),
        'href',
      ),
      text: selection.toString(),
    };
  }

  private static mapItemProperty<E, P extends keyof E>(
    elements: DomCollection<E>,
    propertyName: P,
  ): NonNullable<E[P]>[] {
    // TODO: Confirm URLs are absolute (especially when extracted from selection)
    const results = new Set<NonNullable<E[P]>>();

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const propertyValue = element[propertyName];

      if (propertyValue) {
        results.add(propertyValue!);
      }
    }

    return [...results];
  }

  private static mapMetaContent(): Record<string, string> {
    const elements = document.querySelectorAll('meta[content]');
    const result: Record<string, string> = {};

    elements.forEach((element) => {
      const key =
        element.getAttribute('name') || element.getAttribute('http-equiv') || element.getAttribute('property');
      const value = element.getAttribute('content');

      if (key && value) {
        result[key] = value;
      }
    });

    return result;
  }
}

type DomCollection<T> = {
  readonly length: number;
  [index: number]: T;
};
