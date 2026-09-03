import { describe, expect, it } from 'vitest';
import { createTestTemplateContextManager } from 'extension/test/template-context-manager.factory';

const withTabContext = (
  tabContext: NonNullable<Parameters<typeof createTestTemplateContextManager>[0]>['tabContext'],
) => createTestTemplateContextManager({ tabContext });

/**
 * Tests for the page/tab-metadata context entries, which read from the tab context (gathered from the page) or the tab
 * itself.
 */
describe('tab metadata context entries', () => {
  describe('scalar tab-context values', () => {
    it.each([
      ['characterSet', { characterSet: 'ISO-8859-1' }, 'ISO-8859-1'],
      ['cookiesEnabled', { cookiesEnabled: false }, 'false'],
      ['html', { html: '<p>hi</p>' }, '<p>hi</p>'],
      ['text', { text: 'plain text' }, 'plain text'],
      ['referrer', { referrer: 'https://ref.test/' }, 'https://ref.test/'],
      ['screenColorDepth', { screenColorDepth: 30 }, '30'],
      ['screenHeight', { screenSize: { height: 900, width: 1600 } }, '900'],
      ['screenWidth', { screenSize: { height: 900, width: 1600 } }, '1600'],
      ['author', { meta: { author: 'Jane Doe' } }, 'Jane Doe'],
      ['description', { meta: { description: 'A page' } }, 'A page'],
    ])('resolves {%s}', async (name, tabContext, expected) => {
      const { render } = withTabContext(tabContext as never);

      await expect(render(`{${name}}`)).resolves.toBe(expected);
    });
  });

  describe('dimensions', () => {
    it('resolves {height}/{width} from the tab-context page size', async () => {
      const { render } = withTabContext({ size: { height: 640, width: 480 } });

      await expect(render('{height}x{width}')).resolves.toBe('640x480');
    });
  });

  describe('collections', () => {
    it('resolves {#images} to the page images', async () => {
      const { render } = withTabContext({ images: ['a.png', 'b.png'] });

      await expect(render('{#images}{.}|{/images}')).resolves.toBe('a.png|b.png|');
    });

    it('resolves {#image} at a one-based index', async () => {
      const { render } = withTabContext({ images: ['a.png', 'b.png'] });

      await expect(render('{#image}2{/image}')).resolves.toBe('b.png');
    });

    it.each([
      ['links', { links: ['l1', 'l2'] }, 'l1|l2|'],
      ['plugins', { plugins: ['p1'] }, 'p1|'],
      ['scripts', { scripts: ['s1', 's2'] }, 's1|s2|'],
      ['styleSheets', { styleSheets: ['x.css'] }, 'x.css|'],
    ])('resolves {#%s} to its list', async (name, tabContext, expected) => {
      const { render } = withTabContext(tabContext as never);

      await expect(render(`{#${name}}{.}|{/${name}}`)).resolves.toBe(expected);
    });
  });

  describe('keywords', () => {
    it('splits comma-separated keywords, trimming surrounding whitespace', async () => {
      const { render } = withTabContext({ meta: { keywords: 'alpha, beta ,gamma' } });

      await expect(render('{#keywords}{.}|{/keywords}')).resolves.toBe('alpha|beta|gamma|');
    });

    it('resolves a single {#keyword} at a one-based index', async () => {
      const { render } = withTabContext({ meta: { keywords: 'alpha, beta, gamma' } });

      await expect(render('{#keyword}2{/keyword}')).resolves.toBe('beta');
    });

    it('yields no keywords when the meta keyword is absent', async () => {
      const { render } = withTabContext({ meta: {} });

      await expect(render('[{#keywords}{.}{/keywords}]')).resolves.toBe('[]');
    });
  });

  describe('named meta', () => {
    it('resolves a named {#meta} value', async () => {
      const { render } = withTabContext({ meta: { 'og:title': 'Title' } });

      await expect(render('{#meta}og:title{/meta}')).resolves.toBe('Title');
    });
  });

  describe('selection', () => {
    const selection = { html: '<b>sel</b>', images: ['i.png'], links: ['l'], text: 'sel' };

    it.each([
      ['selection', 'sel'],
      ['selectionHtml', '<b>sel</b>'],
    ])('resolves {%s}', async (name, expected) => {
      const { render } = withTabContext({ selection });

      await expect(render(`{${name}}`)).resolves.toBe(expected);
    });

    it('resolves {#selectedImages} and {#selectedLinks}', async () => {
      const { render } = withTabContext({ selection });

      await expect(render('{#selectedImages}{.}{/selectedImages}-{#selectedLinks}{.}{/selectedLinks}')).resolves.toBe(
        'i.png-l',
      );
    });
  });

  describe('link target', () => {
    it('resolves {linkHtml}/{linkText} from the hovered link target', async () => {
      const { render } = withTabContext({ linkTarget: { html: '<a>x</a>', text: 'x' } });

      await expect(render('{linkHtml}|{linkText}')).resolves.toBe('<a>x</a>|x');
    });

    it('resolves {linkHtml}/{linkText} to empty strings when there is no link target', async () => {
      const { render } = withTabContext({});

      await expect(render('[{linkHtml}][{linkText}]')).resolves.toBe('[][]');
    });
  });

  describe('storage', () => {
    it('resolves a named {#localStorage} and {#sessionStorage} value', async () => {
      const { render } = withTabContext({ storage: { local: { theme: 'dark' }, session: { id: '7' } } });

      await expect(render('{#localStorage}theme{/localStorage}-{#sessionStorage}id{/sessionStorage}')).resolves.toBe(
        'dark-7',
      );
    });
  });

  describe('tab values', () => {
    it('resolves {faviconUrl}, {title} and {source} from the tab', async () => {
      const { render } = createTestTemplateContextManager({
        tab: { favIconUrl: 'https://x.test/f.ico', title: 'My Tab' },
        url: 'https://x.test/page',
      });

      await expect(render('{faviconUrl}|{title}|{source}')).resolves.toBe(
        'https://x.test/f.ico|My Tab|https://x.test/page',
      );
    });

    it('falls back to the tab URL for {title} when the tab has no title', async () => {
      const { render } = createTestTemplateContextManager({ tab: { title: '' }, url: 'https://x.test/page' });

      await expect(render('{title}')).resolves.toBe('https://x.test/page');
    });

    it('resolves {#tabs} to the URLs of the tabs in the current window', async () => {
      const { render } = createTestTemplateContextManager({
        tabs: [{ url: 'https://one.test/' }, { url: 'https://two.test/' }],
      });

      await expect(render('{#tabs}{.}|{/tabs}')).resolves.toBe('https://one.test/|https://two.test/|');
    });

    it('resolves {offline} from navigator.onLine', async () => {
      const { render } = createTestTemplateContextManager();

      await expect(render('{offline}')).resolves.toBe('true');
    });
  });
});
