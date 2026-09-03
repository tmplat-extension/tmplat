import { describe, expect, it } from 'vitest';
import { templateContextEntriesDefinitions } from 'extension/template/context/entry';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { toTemplateContextKey } from 'extension/template/context/template-context.utils';

/**
 * Structural invariants for the template context entry registry.
 *
 * These guard the properties that `TemplateContextManager` relies on when it registers entries by key, none of which
 * the type system can enforce across ~250 independently authored definitions.
 */
describe('templateContextEntriesDefinitions', () => {
  const definitions = templateContextEntriesDefinitions;
  const names = new Set(definitions.map((definition) => definition.name));

  it('is not empty', () => {
    expect(definitions.length).toBeGreaterThan(0);
  });

  it('registers every entry under a unique lower-cased key', () => {
    const keys = definitions.map((definition) => toTemplateContextKey(definition.name));
    const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);

    expect([...new Set(duplicates)]).toEqual([]);
  });

  it('names every entry in camel case, so it reads well in the guide', () => {
    const invalid = definitions.filter((definition) => !/^[a-z][A-Za-z0-9]*$/.test(definition.name));

    expect(invalid.map((definition) => definition.name)).toEqual([]);
  });

  it('never declares the same entry name twice', () => {
    const entryNames = definitions.map((definition) => definition.name);
    const duplicates = entryNames.filter((name, index) => entryNames.indexOf(name) !== index);

    expect([...new Set(duplicates)]).toEqual([]);
  });

  it('declares an added version for every entry', () => {
    const missing = definitions.filter((definition) => !/^\d+\.\d+\.\d+$/.test(definition.added));

    expect(missing.map((definition) => definition.name)).toEqual([]);
  });

  it('declares a renderer for every entry', () => {
    const missing = definitions.filter((definition) => typeof definition.render !== 'function');

    expect(missing.map((definition) => definition.name)).toEqual([]);
  });

  it('declares at least one category for every entry', () => {
    const missing = definitions.filter((definition) => Object.keys(definition.categories).length === 0);

    expect(missing.map((definition) => definition.name)).toEqual([]);
  });

  it('never declares both a collection and an operation category for the same entry', () => {
    const conflicting = definitions.filter(
      (definition) =>
        definition.categories[TemplateContextCategory.Collection] &&
        definition.categories[TemplateContextCategory.Operation],
    );

    expect(conflicting.map((definition) => definition.name)).toEqual([]);
  });

  describe('aliases', () => {
    const aliases = definitions.filter((definition) => definition.aliasOf);

    it('includes at least one alias, so the assertions below are meaningful', () => {
      expect(aliases.length).toBeGreaterThan(0);
    });

    it('points every alias at an entry that is itself registered', () => {
      const dangling = aliases.filter((alias) => !names.has(alias.aliasOf!));

      expect(dangling.map((alias) => alias.name)).toEqual([]);
    });

    it('never points an alias at another alias', () => {
      const aliasNames = new Set(aliases.map((alias) => alias.name));
      const chained = aliases.filter((alias) => aliasNames.has(alias.aliasOf!));

      expect(chained.map((alias) => alias.name)).toEqual([]);
    });

    it('shares the renderer of the entry it aliases', () => {
      const byName = new Map(definitions.map((definition) => [definition.name, definition]));
      const mismatched = aliases.filter((alias) => byName.get(alias.aliasOf!)?.render !== alias.render);

      expect(mismatched.map((alias) => alias.name)).toEqual([]);
    });

    it('is listed in the aliases of the entry it points at', () => {
      const byName = new Map(definitions.map((definition) => [definition.name, definition]));
      const unlisted = aliases.filter((alias) => !byName.get(alias.aliasOf!)?.aliases?.includes(alias.name));

      expect(unlisted.map((alias) => alias.name)).toEqual([]);
    });

    it('only lists aliases that are themselves registered as aliases of that entry', () => {
      const byName = new Map(definitions.map((definition) => [definition.name, definition]));
      const invalid = definitions
        .flatMap((definition) => (definition.aliases ?? []).map((name) => ({ definition, name })))
        .filter(({ definition, name }) => byName.get(name)?.aliasOf !== definition.name);

      expect(invalid.map(({ name }) => name)).toEqual([]);
    });
  });
});
