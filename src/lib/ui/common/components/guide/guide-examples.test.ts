import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTestTemplateContextManager,
  type TestTemplateContextManagerOptions,
} from 'extension/test/template-context-manager.factory';
import {
  collectionGuideExamples,
  operationGuideExamples,
  optionGuideExamples,
  standardGuideExamples,
} from 'extension/ui/common/components/guide/guide-examples';
import { type GuideExample } from 'extension/ui/common/components/guide/guide.model';

const URL_HREF = 'https://example.com/docs/intro?q=tmplat#usage';

/** The scenario every example's documented output is written against, per the comment in `guide-examples.ts`. */
const OPTIONS: TestTemplateContextManagerOptions = {
  cookies: { session_id: 'a1b2c3d4' },
  data: {
    template: {
      contextMenu: { enabled: true },
      link: { target: true, title: false },
      markdown: { inline: true },
    },
    url_shortener: { providers: { yourls: { url: 'https://sho.rt' } } },
  },
  tab: { title: 'Example & Domain', url: URL_HREF },
  tabContext: { cookiesEnabled: true },
  url: URL_HREF,
};

const expectExample = async ({ output, template }: GuideExample) => {
  const { render } = createTestTemplateContextManager(OPTIONS);

  await expect(render(template), template).resolves.toBe(output);
};

/*
 * The guide claims every output has been verified against the engine, which nothing enforced. Six examples used a full
 * dotted path into a lazy collection (`{options.templates.links.target}`), which the engine could not resolve at the
 * time and rendered as an empty string, so the guide was teaching syntax that silently did nothing. tmplat-mustache
 * 5.1.0 resolves lazy values mid-path, so the examples now use dot notation again - and these tests keep them honest.
 */
describe('guide examples', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-09-03T12:00:00Z'));
  });

  it.each(standardGuideExamples)('renders the standard example $template', expectExample);

  it.each(collectionGuideExamples)('renders the collection example $template', expectExample);

  it.each(operationGuideExamples)('renders the operation example $template', expectExample);

  it.each(optionGuideExamples)('renders the option example $template', expectExample);

  /*
   * An inverted section also renders its body when the name cannot be resolved at all, so it would still pass above if
   * its path were broken. Pinning the enabled case is what proves the name really is being read.
   */
  it('renders nothing for an inverted section whose option is set', async () => {
    const { render } = createTestTemplateContextManager({
      ...OPTIONS,
      data: { ...OPTIONS.data, template: { link: { target: true, title: true } } },
    });

    await expect(
      render('{^options.templates.links.title}No title attribute{/options.templates.links.title}'),
    ).resolves.toBe('');
  });
});
