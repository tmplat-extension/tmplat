import { inject, injectable } from 'extension/common/di';
import { RespondingMessageListener } from 'extension/common/message/message-listener';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import {
  type ContextMenuTargetHolder,
  ContextMenuTargetHolderToken,
} from 'extension/common/state/context-menu-target-holder';
import {
  type TabContextMessageInput,
  type TabContextMessageOutput,
} from 'extension/tab/message/tab-context-message.schema';
import { type TabContext, type TabContextLinkTarget, type TabContextSelection } from 'extension/tab/tab-context.schema';

@injectable()
export class TabContextMessageListener extends RespondingMessageListener<
  TabContextMessageInput,
  TabContextMessageOutput
> {
  constructor(
    @inject(ContextMenuTargetHolderToken) private readonly contextMenuTargetHolder: ContextMenuTargetHolder,
    @inject(MessageServiceToken) messageService: MessageService,
  ) {
    super(messageService, MessageType.TabContext);
  }

  protected async onMessage(_input: TabContextMessageInput): Promise<TabContextMessageOutput> {
    /*
     * TODO: Allow message to describe what information should be returned (should only happen if using long-lived
     *  connection with tab during template engine execution)
     */
    const context: TabContext = {
      characterSet: document.characterSet,
      cookiesEnabled: navigator.cookieEnabled,
      html: document.documentElement.outerHTML,
      images: TabContextMessageListener.mapItemProperty(document.images, 'src'),
      javaEnabled: navigator.javaEnabled(),
      lastModified: document.lastModified,
      linkTarget: this.getLinkTarget(),
      links: TabContextMessageListener.mapItemProperty(document.links, 'href'),
      meta: TabContextMessageListener.mapMetaContent(),
      plugins: TabContextMessageListener.mapItemProperty(navigator.plugins, 'name'),
      referrer: document.referrer,
      screenColorDepth: screen.colorDepth,
      screenSize: {
        height: screen.height,
        width: screen.width,
      },
      scripts: TabContextMessageListener.mapItemProperty(document.scripts, 'src'),
      selection: TabContextMessageListener.getSelection(),
      size: {
        height: innerHeight,
        width: innerWidth,
      },
      storage: {
        local: TabContextMessageListener.cloneStorage(localStorage),
        session: TabContextMessageListener.cloneStorage(sessionStorage),
      },
      styleSheets: TabContextMessageListener.mapItemProperty(document.styleSheets, 'href'),
      text: document.body?.textContent ?? '',
    };

    return { context };
  }

  private getLinkTarget(): TabContextLinkTarget | undefined {
    const target = this.contextMenuTargetHolder.get();
    const anchor = target?.closest<HTMLAnchorElement>('a[href]');
    if (!anchor) {
      return undefined;
    }

    return {
      html: anchor.outerHTML,
      text: anchor.textContent ?? '',
    };
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
      images: TabContextMessageListener.mapItemProperty(
        container.querySelectorAll<HTMLImageElement>('img[src]'),
        'src',
      ),
      links: TabContextMessageListener.mapItemProperty(
        container.querySelectorAll<HTMLAnchorElement>('a[href]'),
        'href',
      ),
      text: selection.toString(),
    };
  }

  private static mapItemProperty<Element, Property extends keyof Element>(
    elements: DomCollection<Element>,
    propertyName: Property,
  ): NonNullable<Element[Property]>[] {
    // TODO: Confirm URLs are absolute (especially when extracted from selection)
    const results = new Set<NonNullable<Element[Property]>>();

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
