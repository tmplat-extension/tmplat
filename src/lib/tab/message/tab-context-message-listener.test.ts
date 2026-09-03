import { describe, expect, it, vi } from 'vitest';
import { type MessageService } from 'extension/common/message/message.service';
import { ContextMenuTargetHolder } from 'extension/common/state/context-menu-target-holder';
import { TabContextMessageListener } from 'extension/tab/message/tab-context-message-listener';
import { type TabContextMessageOutput } from 'extension/tab/message/tab-context-message.schema';

// `TabContextMessageListener.onMessage` is `protected`; a trivial subclass exposes it so a test can drive the context
// assembly directly rather than routing a message through the whole `MessageService`.
class TestableTabContextMessageListener extends TabContextMessageListener {
  invoke(): Promise<TabContextMessageOutput> {
    return this.onMessage({});
  }
}

type MetaAttributes = { content?: string; 'http-equiv'?: string; name?: string; property?: string };

const metaElement = (attributes: MetaAttributes) => ({
  getAttribute: (name: string) => (attributes as Record<string, string | undefined>)[name] ?? null,
});

const fakeStorage = (entries: Record<string, string>): Storage => {
  const keys = Object.keys(entries);

  return {
    get length() {
      return keys.length;
    },
    clear: vi.fn(),
    getItem: (key: string) => entries[key] ?? null,
    key: (index: number) => keys[index] ?? null,
    removeItem: vi.fn(),
    setItem: vi.fn(),
  } as unknown as Storage;
};

type DomOptions = {
  body?: { textContent: string | null } | null;
  characterSet?: string;
  cookieEnabled?: boolean;
  images?: { src: string }[];
  javaEnabled?: boolean;
  lastModified?: string;
  links?: { href: string }[];
  local?: Record<string, string>;
  meta?: ReturnType<typeof metaElement>[];
  outerHTML?: string;
  plugins?: { name: string }[];
  referrer?: string;
  scripts?: { src: string }[];
  selection?: Selection | null;
  session?: Record<string, string>;
  styleSheets?: { href: string }[];
};

const installDom = (options: DomOptions = {}) => {
  const document = {
    body: options.body === undefined ? { textContent: '' } : options.body,
    characterSet: options.characterSet ?? 'UTF-8',
    createElement: vi.fn(() => createContainer()),
    documentElement: { outerHTML: options.outerHTML ?? '<html></html>' },
    images: options.images ?? [],
    lastModified: options.lastModified ?? '01/01/2024 00:00:00',
    links: options.links ?? [],
    querySelectorAll: vi.fn((selector: string) => (selector === 'meta[content]' ? (options.meta ?? []) : [])),
    referrer: options.referrer ?? '',
    scripts: options.scripts ?? [],
    styleSheets: options.styleSheets ?? [],
  };

  vi.stubGlobal('document', document);
  vi.stubGlobal('navigator', {
    cookieEnabled: options.cookieEnabled ?? true,
    javaEnabled: () => options.javaEnabled ?? false,
    plugins: options.plugins ?? [],
  });
  vi.stubGlobal('screen', { colorDepth: 24, height: 1080, width: 1920 });
  vi.stubGlobal('innerHeight', 800);
  vi.stubGlobal('innerWidth', 1280);
  vi.stubGlobal('localStorage', fakeStorage(options.local ?? {}));
  vi.stubGlobal('sessionStorage', fakeStorage(options.session ?? {}));
  vi.stubGlobal('getSelection', () => options.selection ?? null);

  return document;
};

// A stand-in for the `<div>` created by `getSelection` to hold the cloned selection contents. `querySelectorAll` is
// asked for `img[src]` and `a[href]`; the elements are keyed off the container that was appended.
const createContainer = () => {
  let appended: { images?: { src: string }[]; links?: { href: string }[]; innerHTML?: string } = {};

  return {
    appendChild: (fragment: { images?: { src: string }[]; links?: { href: string }[]; innerHTML?: string }) => {
      appended = fragment ?? {};
    },
    get innerHTML() {
      return appended.innerHTML ?? '';
    },
    querySelectorAll: (selector: string) =>
      selector === 'img[src]' ? (appended.images ?? []) : (appended.links ?? []),
  };
};

const createSelection = (fragment: {
  images?: { src: string }[];
  innerHTML?: string;
  links?: { href: string }[];
  text: string;
}): Selection =>
  ({
    isCollapsed: false,
    getRangeAt: () => ({ cloneContents: () => fragment }),
    toString: () => fragment.text,
  }) as unknown as Selection;

const createListener = (targetHolder = new ContextMenuTargetHolder()) =>
  new TestableTabContextMessageListener(targetHolder, {} as unknown as MessageService);

describe('TabContextMessageListener', () => {
  it('assembles the tab context from the document, navigator and screen', async () => {
    installDom({
      characterSet: 'ISO-8859-1',
      cookieEnabled: false,
      images: [{ src: 'a.png' }, { src: 'b.png' }],
      links: [{ href: 'https://x.test/' }],
      outerHTML: '<html><body></body></html>',
      plugins: [{ name: 'PDF Viewer' }],
      referrer: 'https://ref.test/',
      scripts: [{ src: 's.js' }],
      styleSheets: [{ href: 'style.css' }],
    });

    const { context } = await createListener().invoke();

    expect(context).toMatchObject({
      characterSet: 'ISO-8859-1',
      cookiesEnabled: false,
      html: '<html><body></body></html>',
      images: ['a.png', 'b.png'],
      javaEnabled: false,
      links: ['https://x.test/'],
      plugins: ['PDF Viewer'],
      referrer: 'https://ref.test/',
      screenColorDepth: 24,
      screenSize: { height: 1080, width: 1920 },
      scripts: ['s.js'],
      size: { height: 800, width: 1280 },
      styleSheets: ['style.css'],
    });
  });

  it('deduplicates repeated collection values', async () => {
    installDom({ images: [{ src: 'a.png' }, { src: 'a.png' }, { src: 'b.png' }] });

    const { context } = await createListener().invoke();

    expect(context.images).toEqual(['a.png', 'b.png']);
  });

  it('falls back to an empty string when the document has no body', async () => {
    installDom({ body: null });

    const { context } = await createListener().invoke();

    expect(context.text).toBe('');
  });

  it('reads the body text content when present', async () => {
    installDom({ body: { textContent: 'page text' } });

    const { context } = await createListener().invoke();

    expect(context.text).toBe('page text');
  });

  describe('storage', () => {
    it('clones local and session storage entries', async () => {
      installDom({ local: { a: '1', b: '2' }, session: { c: '3' } });

      const { context } = await createListener().invoke();

      expect(context.storage).toEqual({ local: { a: '1', b: '2' }, session: { c: '3' } });
    });
  });

  describe('meta', () => {
    it('keys meta content by name, http-equiv or property in that order', async () => {
      installDom({
        meta: [
          metaElement({ content: 'Jane', name: 'author' }),
          metaElement({ content: 'no-cache', 'http-equiv': 'cache-control' }),
          metaElement({ content: 'article', property: 'og:type' }),
          metaElement({ name: 'ignored-no-content' }),
        ],
      });

      const { context } = await createListener().invoke();

      expect(context.meta).toEqual({ author: 'Jane', 'cache-control': 'no-cache', 'og:type': 'article' });
    });
  });

  describe('selection', () => {
    it('returns an empty selection when nothing is selected', async () => {
      installDom({ selection: null });

      const { context } = await createListener().invoke();

      expect(context.selection).toEqual({ html: '', images: [], links: [], text: '' });
    });

    it('extracts html, text, images and links from the current selection', async () => {
      installDom({
        selection: createSelection({
          images: [{ src: 'sel.png' }],
          innerHTML: '<p>selected</p>',
          links: [{ href: 'https://sel.test/' }],
          text: 'selected',
        }),
      });

      const { context } = await createListener().invoke();

      expect(context.selection).toEqual({
        html: '<p>selected</p>',
        images: ['sel.png'],
        links: ['https://sel.test/'],
        text: 'selected',
      });
    });
  });

  describe('linkTarget', () => {
    it('is undefined when there is no stored context-menu target', async () => {
      installDom();

      const { context } = await createListener().invoke();

      expect(context.linkTarget).toBeUndefined();
    });

    it('is undefined when the target is not within an anchor', async () => {
      installDom();
      const targetHolder = new ContextMenuTargetHolder();
      targetHolder.set({ closest: () => null } as unknown as Element);

      const { context } = await createListener(targetHolder).invoke();

      expect(context.linkTarget).toBeUndefined();
    });

    it('captures the enclosing anchor html and text', async () => {
      installDom();
      const anchor = { outerHTML: '<a href="/x">link</a>', textContent: 'link' };
      const targetHolder = new ContextMenuTargetHolder();
      targetHolder.set({ closest: () => anchor } as unknown as Element);

      const { context } = await createListener(targetHolder).invoke();

      expect(context.linkTarget).toEqual({ html: '<a href="/x">link</a>', text: 'link' });
    });
  });
});
