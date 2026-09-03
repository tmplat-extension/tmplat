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

    // This anchor is a live node in the user's page, so it is cloned before the URLs within it are rewritten. The
    // clone keeps the same `ownerDocument`, so its URLs still resolve against the page's base URL.
    const clone = anchor.cloneNode(true) as HTMLAnchorElement;
    TabContextMessageListener.absolutizeUrls(clone);

    return {
      html: clone.outerHTML,
      text: anchor.textContent ?? '',
    };
  }

  /**
   * Rewrites every `href`/`src` *attribute* within (and on) `root` to the absolute URL it resolves to.
   *
   * The DOM properties (`a.href`, `img.src`) are already absolute, but the attributes they were parsed from are not,
   * so serialized HTML would otherwise carry relative URLs that break as soon as they are pasted anywhere else. 1.x
   * did exactly this before capturing the selection HTML (`content.coffee:246-247`).
   *
   * The resolved URL is read from the element's reflected property rather than by matching element types, so this
   * covers anything that reflects one (`a`, `area`, `img`, `source`, `script`, `iframe`, `link`) and safely skips
   * anything that does not.
   *
   * `root` must never be a live node from the user's page.
   */
  private static absolutizeUrls(root: Element): void {
    const elements = [root, ...root.querySelectorAll('[href],[src]')];

    for (const element of elements) {
      for (const attributeName of ['href', 'src'] as const) {
        if (!element.hasAttribute(attributeName)) {
          continue;
        }

        const resolved: unknown = (element as unknown as Record<string, unknown>)[attributeName];
        if (typeof resolved === 'string' && resolved) {
          element.setAttribute(attributeName, resolved);
        }
      }
    }
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

    // The container is a detached clone of the selection, so rewriting it is safe - and it must happen before
    // `innerHTML` is read, or the serialized HTML keeps the relative URLs it was parsed from.
    TabContextMessageListener.absolutizeUrls(container);

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
    // The DOM properties read here are always absolute - the getters resolve against the document's base URL, even
    // for the detached selection clone. Attribute values are not, which `absolutizeUrls` handles separately.
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
