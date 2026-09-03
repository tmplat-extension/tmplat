import { describe, expect, it, vi } from 'vitest';
import { type TemplateContextManager } from 'extension/template/context/template-context-manager';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import {
  type TemplateContextEntryDefinition,
  type TemplateContextEntryDefinitionAlias,
  type TemplateContextEntryNestedRenderer,
  type TemplateContextEntryValue,
} from 'extension/template/context/template-context.model';
import {
  buildTemplate,
  createContentRenderer,
  createNumericContentRenderer,
  createTrimmedContentRenderer,
  defineWithAliases,
  toTemplateContextKey,
} from 'extension/template/context/template-context.utils';
import { type Template } from 'extension/template/template.model';
import { type TemplateService } from 'extension/template/template.service';

const render = async (template: string): Promise<string> => template;

const createManagerStub = (): TemplateContextManager =>
  ({
    async render(text: string, renderer: (template: string) => Promise<string>) {
      return text && (await renderer(text));
    },
    async renderTrim(text: string, renderer: (template: string) => Promise<string>) {
      return text && (await renderer(text)).trim();
    },
  }) as unknown as TemplateContextManager;

const invokeRenderer = async (
  definition: Pick<TemplateContextEntryDefinition, 'render'>,
  text: string,
): Promise<TemplateContextEntryValue> => {
  const entry = definition.render(createManagerStub());
  const nested = (entry as () => TemplateContextEntryNestedRenderer)();

  return nested(text, render);
};

describe('toTemplateContextKey', () => {
  it.each([
    [TemplateContextName.Author, 'author'],
    [TemplateContextName.BrowserFullVersion, 'browserfullversion'],
    [TemplateContextName.CamelCase, 'camelcase'],
  ])('lower-cases %s', (name, expected) => {
    expect(toTemplateContextKey(name)).toBe(expected);
  });

  it('is idempotent', () => {
    const key = toTemplateContextKey(TemplateContextName.BrowserFullVersion);

    expect(toTemplateContextKey(key as TemplateContextName)).toBe(key);
  });
});

describe('buildTemplate', () => {
  const templateService = {
    getTemplateDescription: vi.fn(() => 'Resolved description'),
    getTemplateTitle: vi.fn(() => 'Resolved title'),
  } as unknown as TemplateService;

  const template = {
    content: '{url}',
    enabled: true,
    id: 'abc',
    predefined: true,
    shortcut: 'U',
  } as unknown as Template;

  it('resolves the title and description via the template service', () => {
    expect(buildTemplate(template, templateService)).toEqual({
      content: '{url}',
      description: 'Resolved description',
      enabled: true,
      id: 'abc',
      predefined: true,
      shortcut: 'U',
      title: 'Resolved title',
    });
  });

  it('does not expose message keys from the underlying template', () => {
    const predefined = { ...template, descriptionKey: 'a_key', titleKey: 'another_key' } as unknown as Template;

    expect(buildTemplate(predefined, templateService)).not.toHaveProperty('titleKey');
    expect(buildTemplate(predefined, templateService)).not.toHaveProperty('descriptionKey');
  });
});

describe('defineWithAliases', () => {
  const definition: TemplateContextEntryDefinition = {
    added: '1.0.0',
    categories: {},
    features: [],
    name: TemplateContextName.Title,
    render: () => 'title',
  };

  const alias: TemplateContextEntryDefinitionAlias = {
    added: '1.0.0',
    aliasOf: TemplateContextName.Title,
    name: TemplateContextName.OriginalTitle,
  };

  it('returns the definition first, followed by each alias', () => {
    const definitions = defineWithAliases(definition, [alias]);

    expect(definitions).toHaveLength(2);
    expect(definitions[0].name).toBe(TemplateContextName.Title);
    expect(definitions[1].name).toBe(TemplateContextName.OriginalTitle);
  });

  it('records the alias names on the primary definition', () => {
    expect(defineWithAliases(definition, [alias])[0].aliases).toEqual([TemplateContextName.OriginalTitle]);
  });

  it('copies the categories, features and renderer onto each alias', () => {
    const [, aliased] = defineWithAliases(definition, [alias]);

    expect(aliased.categories).toBe(definition.categories);
    expect(aliased.features).toBe(definition.features);
    expect(aliased.render).toBe(definition.render);
    expect(aliased.aliasOf).toBe(TemplateContextName.Title);
  });

  it('returns just the definition when there are no aliases', () => {
    expect(defineWithAliases(definition, [])).toHaveLength(1);
  });

  it('throws when an alias points at a different entry', () => {
    expect(() => defineWithAliases(definition, [{ ...alias, aliasOf: TemplateContextName.Url }])).toThrow(
      /does not match alias/,
    );
  });
});

describe('createContentRenderer', () => {
  it('passes the rendered content to the mapper', async () => {
    const definition = { render: createContentRenderer((content) => content.toUpperCase()) };

    await expect(invokeRenderer(definition, ' abc ')).resolves.toBe(' ABC ');
  });

  it('short-circuits empty content without invoking the mapper', async () => {
    const mapper = vi.fn((content: string) => content);
    const definition = { render: createContentRenderer(mapper) };

    await expect(invokeRenderer(definition, '')).resolves.toBe('');
    expect(mapper).toHaveBeenCalledWith('', expect.anything());
  });
});

describe('createTrimmedContentRenderer', () => {
  it('trims the rendered content before passing it to the mapper', async () => {
    const definition = { render: createTrimmedContentRenderer((content) => content) };

    await expect(invokeRenderer(definition, '  abc  ')).resolves.toBe('abc');
  });
});

describe('createNumericContentRenderer', () => {
  it.each([
    ['  42  ', 42],
    ['7', 7],
    ['-3', -3],
    ['10px', 10],
  ])('parses %j as %i before passing it to the mapper', async (text, expected) => {
    const definition = { render: createNumericContentRenderer((value) => value) };

    await expect(invokeRenderer(definition, text)).resolves.toBe(expected);
  });

  it('passes NaN to the mapper for non-numeric content', async () => {
    const definition = { render: createNumericContentRenderer((value) => Number.isNaN(value)) };

    await expect(invokeRenderer(definition, 'abc')).resolves.toBe(true);
  });
});
