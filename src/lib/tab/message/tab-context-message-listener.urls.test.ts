import { afterEach, describe, expect, it } from 'vitest';
import { type MessageService } from 'extension/common/message/message.service';
import { ContextMenuTargetHolder } from 'extension/common/state/context-menu-target-holder';
import { TabContextMessageListener } from 'extension/tab/message/tab-context-message-listener';
import { type TabContextMessageOutput } from 'extension/tab/message/tab-context-message.schema';

/*
 * Absolutizing a url is a claim about how the DOM resolves an attribute against the document's base url, and about
 * which nodes may be mutated while doing it. Neither can be asserted against the duck-typed literals the sibling
 * `tab-context-message-listener.test.ts` uses to cover context assembly - a stub would only restate the assumption -
 * so these tests run in the `dom` project against real elements and a real selection, with nothing stubbed.
 */

class TestableTabContextMessageListener extends TabContextMessageListener {
  invoke(): Promise<TabContextMessageOutput> {
    return this.onMessage({});
  }
}

const BaseUrl = 'https://example.com/base/';

const createListener = (targetHolder = new ContextMenuTargetHolder()) =>
  new TestableTabContextMessageListener(targetHolder, {} as unknown as MessageService);

const render = (html: string): HTMLDivElement => {
  document.head.innerHTML = `<base href="${BaseUrl}">`;

  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.appendChild(host);

  return host;
};

const select = (host: HTMLElement): void => {
  const range = document.createRange();
  range.selectNodeContents(host);

  const selection = getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
};

describe('TabContextMessageListener (urls)', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    getSelection()?.removeAllRanges();
  });

  describe('selection', () => {
    // 1.x rewrote these attributes before capturing the selection HTML (`content.coffee:246-247`). Without it the
    // serialized HTML carries relative urls, which are broken as soon as the output is pasted anywhere else.
    it('rewrites relative urls in the selection html to absolute ones', async () => {
      const host = render('<p><a href="../page.html">x</a><img src="img/p.png"></p>');
      select(host);

      const { context } = await createListener().invoke();

      expect(context.selection.html).toBe(
        '<p><a href="https://example.com/page.html">x</a><img src="https://example.com/base/img/p.png"></p>',
      );
    });

    it('leaves an already absolute url untouched', async () => {
      const host = render('<a href="https://other.test/x">x</a>');
      select(host);

      const { context } = await createListener().invoke();

      expect(context.selection.html).toBe('<a href="https://other.test/x">x</a>');
    });

    // The extracted collections read DOM *properties*, which resolve against the base url regardless, so these are
    // absolute whether or not the attributes were rewritten.
    it('extracts absolute urls for the selected links and images', async () => {
      const host = render('<p><a href="../page.html">x</a><img src="img/p.png"></p>');
      select(host);

      const { context } = await createListener().invoke();

      expect(context.selection.links).toEqual(['https://example.com/page.html']);
      expect(context.selection.images).toEqual(['https://example.com/base/img/p.png']);
    });
  });

  describe('linkTarget', () => {
    it('captures the enclosing anchor with an absolute url', async () => {
      const host = render('<a href="../page.html"><span>link</span></a>');
      const targetHolder = new ContextMenuTargetHolder();
      targetHolder.set(host.querySelector('span')!);

      const { context } = await createListener(targetHolder).invoke();

      expect(context.linkTarget).toEqual({
        html: '<a href="https://example.com/page.html"><span>link</span></a>',
        text: 'link',
      });
    });

    // This anchor is a live node in the page the user is looking at. Rewriting it in place would silently edit their
    // page, so it must be cloned first.
    it('never mutates the anchor in the page', async () => {
      const host = render('<a href="../page.html">link</a>');
      const anchor = host.querySelector('a')!;
      const targetHolder = new ContextMenuTargetHolder();
      targetHolder.set(anchor);

      await createListener(targetHolder).invoke();

      expect(anchor.getAttribute('href')).toBe('../page.html');
    });
  });
});
