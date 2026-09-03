import { describe, expect, it } from 'vitest';
import { getPredefinedTemplate, getPredefinedTemplates } from 'extension/template/predefined-templates';
import {
  createTestTemplateContextManager,
  type TestTemplateContextManagerOptions,
} from 'extension/test/template-context-manager.factory';

const URL_HREF = 'https://example.test/page';

const renderPredefined = async (id: string, options: TestTemplateContextManagerOptions = {}) => {
  const predefinedTemplate = getPredefinedTemplate(id);
  expect(predefinedTemplate, `no predefined template with id '${id}'`).toBeDefined();

  const { render } = createTestTemplateContextManager({
    tab: { title: 'Example Page', url: URL_HREF },
    url: URL_HREF,
    ...options,
  });

  return await render(predefinedTemplate!.content);
};

const withLinkOptions = (target: boolean, title: boolean): TestTemplateContextManagerOptions => ({
  data: { template: { link: { target, title } } },
});

/*
 * The content shipped with every install, which nothing else renders end to end. It is resolved from the source rather
 * than persisted, so a broken template would reach users on upgrade without any stored data changing to reveal it.
 */
describe('predefined templates', () => {
  it('renders the URL template', async () => {
    await expect(renderPredefined('PREDEFINED.00001')).resolves.toBe(URL_HREF);
  });

  it('renders the short URL template', async () => {
    await expect(renderPredefined('PREDEFINED.00002', { shortUrl: 'https://s.test/1' })).resolves.toBe(
      'https://s.test/1',
    );
  });

  it('renders the encoded URL template', async () => {
    await expect(renderPredefined('PREDEFINED.00004')).resolves.toBe(encodeURIComponent(URL_HREF));
  });

  it('renders the BBCode template', async () => {
    await expect(renderPredefined('PREDEFINED.00005')).resolves.toBe(`[url=${URL_HREF}]Example Page[/url]`);
  });

  /*
   * These two read the link options through the `{options}` collection, having previously used the flat
   * `{linksTarget}` and `{linksTitle}` entries, which have been deprecated since 2.0.0.
   *
   * They reach into the collection with a dotted name rather than entering it with a `{#options}` section. That only
   * became possible in tmplat-mustache 5.1.0, which resolves a lazy value part-way along a path; before then the
   * entry's function was never called mid-lookup and the path silently resolved to nothing.
   */
  describe('anchor template', () => {
    it('includes the target and title when both options are enabled', async () => {
      await expect(renderPredefined('PREDEFINED.00003', withLinkOptions(true, true))).resolves.toBe(
        `<a href="${URL_HREF}" target="_blank" title="Example Page">Example Page</a>`,
      );
    });

    it('omits the target and title when both options are disabled', async () => {
      await expect(renderPredefined('PREDEFINED.00003', withLinkOptions(false, false))).resolves.toBe(
        `<a href="${URL_HREF}">Example Page</a>`,
      );
    });

    /*
     * The `href` is escaped with `{#escapeHtml}` rather than `{{...}}`: a raw `&` is invalid in an attribute and a
     * literal entity in a query string would decode, but mustache's own escape also mangles `/` and `=`, which are
     * harmless inside a quoted attribute and make the URL unreadable.
     */
    it('escapes only the HTML-critical characters in the href', async () => {
      const url = 'https://example.test/p?foo=bar&copy=1';
      const rendered = await renderPredefined('PREDEFINED.00003', {
        ...withLinkOptions(false, false),
        tab: { title: 'Tom & Jerry', url },
        url,
      });

      expect(rendered).toBe('<a href="https://example.test/p?foo=bar&amp;copy=1">Tom &amp; Jerry</a>');
    });

    it('includes only the title when only that option is enabled', async () => {
      await expect(renderPredefined('PREDEFINED.00003', withLinkOptions(false, true))).resolves.toBe(
        `<a href="${URL_HREF}" title="Example Page">Example Page</a>`,
      );
    });
  });

  describe('Markdown template', () => {
    it('includes the title when the option is enabled', async () => {
      await expect(renderPredefined('PREDEFINED.00006', withLinkOptions(true, true))).resolves.toBe(
        `[Example Page](${URL_HREF} "Example Page")`,
      );
    });

    it('omits the title when the option is disabled', async () => {
      await expect(renderPredefined('PREDEFINED.00006', withLinkOptions(true, false))).resolves.toBe(
        `[Example Page](${URL_HREF})`,
      );
    });
  });

  it('renders the Markdown selection template', async () => {
    const rendered = await renderPredefined('PREDEFINED.00007', {
      markdown: (html) => `md(${html})`,
      tabContext: { selection: { html: '<b>hi</b>' } },
    });

    expect(rendered).toBe('md(<b>hi</b>)');
  });

  it('renders every predefined template without leaving an unresolved tag', async () => {
    const predefinedTemplates = getPredefinedTemplates();
    const rendered = await Promise.all(predefinedTemplates.map(({ id }) => renderPredefined(id)));

    for (const [index, output] of rendered.entries()) {
      expect(output, predefinedTemplates[index]?.id).not.toMatch(/\{[#^/&]?[\w.]+}/);
    }
  });
});
