import { describe, expect, it } from 'vitest';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { createTestTemplateContextManager } from 'extension/test/template-context-manager.factory';

/**
 * Runtime equivalence checks for deprecated alias entries.
 *
 * `entry/index.test.ts` already asserts *structurally* that every alias shares the renderer of the entry it points at.
 * These tests complement that by driving a representative sample of aliases through the real templating engine, under
 * their lower-cased registration keys, and asserting they produce exactly what their modern target produces.
 */
describe('deprecated alias context entries', () => {
  const options = {
    tabContext: { meta: { keywords: 'a, b' }, screenColorDepth: 30, size: { height: 720, width: 1024 } },
    url: 'https://john@www.example.com:8443/a/b/c.html?foo=bar#p=1&q=2',
  } as const;

  it.each([
    ['originalUrl', '{originalurl}', '{url}'],
    ['originalSource', '{originalsource}', '{url}'],
    ['query', '{query}', '{search}'],
    ['fragment', '{fragment}', '{hash}'],
    ['anchor', '{anchor}', '{hash}'],
    ['base', '{base}', '{origin}'],
    ['originalTitle', '{originaltitle}', '{title}'],
    ['pageHeight', '{pageheight}', '{height}'],
    ['pageWidth', '{pagewidth}', '{width}'],
    ['depth', '{depth}', '{screencolordepth}'],
  ])('renders %s identically to its target', async (_name, aliasTemplate, targetTemplate) => {
    const alias = await createTestTemplateContextManager(options).render(aliasTemplate);
    const target = await createTestTemplateContextManager(options).render(targetTemplate);

    expect(alias).toBe(target);
    expect(alias).not.toBe('');
  });

  it.each([
    ['encode', '{#encode}a b&c{/encode}', '{#encodeuricomponent}a b&c{/encodeuricomponent}'],
    ['decode', '{#decode}a%20b{/decode}', '{#decodeuricomponent}a%20b{/decodeuricomponent}'],
    ['escape', '{#escape}<a>&</a>{/escape}', '{#escapehtml}<a>&</a>{/escapehtml}'],
    ['unescape', '{#unescape}&lt;a&gt;{/unescape}', '{#unescapehtml}&lt;a&gt;{/unescapehtml}'],
    ['capitalise', '{#capitalise}hELLO{/capitalise}', '{#capitalize}hELLO{/capitalize}'],
    ['trimLeft', '[{#trimleft}  x  {/trimleft}]', '[{#trimstart}  x  {/trimstart}]'],
    ['trimRight', '[{#trimright}  x  {/trimright}]', '[{#trimend}  x  {/trimend}]'],
    ['param', '{#param}foo{/param}', '{#searchparam}foo{/searchparam}'],
  ])('renders operation alias %s identically to its target', async (_name, aliasTemplate, targetTemplate) => {
    const alias = await createTestTemplateContextManager(options).render(aliasTemplate);
    const target = await createTestTemplateContextManager(options).render(targetTemplate);

    expect(alias).toBe(target);
  });

  it('renders the {favicon} alias identically to {faviconUrl}', async () => {
    const config = { tab: { favIconUrl: 'https://x.test/f.ico' }, url: 'https://x.test/' };
    const alias = await createTestTemplateContextManager(config).render('{favicon}');
    const target = await createTestTemplateContextManager(config).render('{faviconurl}');

    expect(alias).toBe('https://x.test/f.ico');
    expect(alias).toBe(target);
  });

  it('renders the {count}/{customCount} aliases identically to the template counts', async () => {
    const data = {
      data: {
        template: {
          templates: [
            { content: 'a', description: null, enabled: true, id: 'u1', predefined: false, shortcut: null, title: 'A' },
            { enabled: true, id: 'PREDEFINED.1', predefined: true, shortcut: null },
          ],
        },
      },
    };

    await expect(createTestTemplateContextManager(data).render('{count}')).resolves.toBe('2');
    await expect(createTestTemplateContextManager(data).render('{customcount}')).resolves.toBe('1');
  });

  describe('legacy constant and option entries', () => {
    it('resolves the fixed-value legacy entries', async () => {
      const { render } = createTestTemplateContextManager();

      await expect(render('{toolbarstyle}|{notificationduration}|[{popular}]')).resolves.toBe('false|0|[]');
    });

    it('resolves {java} from the tab context', async () => {
      const { render } = createTestTemplateContextManager({ tabContext: { javaEnabled: true } });

      await expect(render('{java}')).resolves.toBe('true');
    });

    it('derives the legacy toolbar entries from the action mode', async () => {
      const { render } = createTestTemplateContextManager({
        data: {
          template: {
            action: {
              mode: TemplateActionMode.Popup,
              popup: { autoCloseEnabled: true, optionLinkEnabled: false },
              templateId: null,
            },
          },
        },
      });

      await expect(render('{toolbarpopup}|{toolbarfeature}|{toolbarclose}|{toolbaroptions}')).resolves.toBe(
        'true|false|true|false',
      );
    });

    it('treats a non-popup action mode as the toolbar "feature" being enabled', async () => {
      const { render } = createTestTemplateContextManager({
        data: {
          template: {
            action: {
              mode: TemplateActionMode.Template,
              popup: { autoCloseEnabled: true, optionLinkEnabled: true },
              templateId: 'tid',
            },
          },
        },
      });

      await expect(render('{toolbarpopup}|{toolbarfeature}|{toolbarkey}')).resolves.toBe('false|true|tid');
    });
  });
});
