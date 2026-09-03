import { describe, expect, it } from 'vitest';
import { type IntlService } from 'extension/common/intl/intl.service';
import { templateContextEntriesDefinitions } from 'extension/template/context/entry';
import { type GuideEntry } from 'extension/ui/common/components/guide/guide.model';
import {
  getCollectionGuideEntries,
  getOperationGuideEntries,
  getPropertyGuideEntries,
  getStandardGuideEntries,
  matchesGuideQuery,
} from 'extension/ui/common/components/guide/guide.utils';

const intl = { getMessage: (key: string) => key } as unknown as IntlService;

function findEntry(entries: readonly GuideEntry[], name: string): GuideEntry {
  const entry = entries.find((candidate) => candidate.name === name);
  expect(entry).toBeDefined();
  return entry!;
}

function expectSortedByName(entries: readonly GuideEntry[]): void {
  expect(entries.map((entry) => entry.name)).toEqual(
    entries.map((entry) => entry.name).toSorted((a, b) => a.localeCompare(b)),
  );
}

describe('guide.utils', () => {
  it('returns standard entries sorted by display name with aliases folded into their target entry', () => {
    const entries = getStandardGuideEntries(intl);

    expectSortedByName(entries);
    expect(entries).not.toContainEqual(expect.objectContaining({ name: 'browserVersion' }));
    expect(entries).not.toContainEqual(expect.objectContaining({ name: 'originalUrl' }));
    expect(entries).not.toContainEqual(expect.objectContaining({ name: 'originalSource' }));
    expect(findEntry(entries, 'browserFullVersion')).toEqual(
      expect.objectContaining({
        aliases: ['browserVersion'],
        descriptionKey: 'context_browser_full_version_standard_description',
        type: 'guide_data_type_string',
      }),
    );
    expect(findEntry(entries, 'url').aliases).toEqual(['originalSource', 'originalUrl']);
  });

  it('does not list any real alias definition as a separate guide entry', () => {
    const entries = [
      ...getStandardGuideEntries(intl),
      ...getCollectionGuideEntries(intl),
      ...getOperationGuideEntries(intl),
    ];
    const entryNames = new Set(entries.map((entry) => entry.name));

    for (const definition of templateContextEntriesDefinitions) {
      if (definition.aliasOf) {
        expect(entryNames).not.toContain(definition.name);
        expect(
          entries.some((entry) => entry.name === definition.aliasOf && entry.aliases.includes(definition.name)),
        ).toBe(true);
      }
    }
  });

  it('formats collection type labels for arrays, typed objects and property-documented objects', () => {
    const entries = getCollectionGuideEntries(intl);

    expectSortedByName(entries);
    expect(findEntry(entries, 'hashSegments')).toEqual(
      expect.objectContaining({
        descriptionKey: 'context_hash_segments_collection_description',
        type: 'guide_data_type_array<guide_data_type_string>',
      }),
    );
    expect(findEntry(entries, 'searchParams')).toEqual(
      expect.objectContaining({
        descriptionKey: 'context_search_params_collection_description',
        type: 'guide_data_type_object<guide_data_type_string>',
      }),
    );
    expect(findEntry(entries, 'options')).toEqual(
      expect.objectContaining({
        descriptionKey: 'context_options_collection_description',
        type: 'guide_data_type_object',
      }),
    );
    expect(findEntry(entries, 'popular')).toEqual(expect.objectContaining({ deprecated: '2.0.0' }));
  });

  it('formats operation type labels for input/output signatures and no-value signatures', () => {
    const entries = getOperationGuideEntries(intl);

    expectSortedByName(entries);
    expect(findEntry(entries, 'dateTime')).toEqual(
      expect.objectContaining({
        descriptionKey: 'context_date_time_operation_description',
        links: expect.arrayContaining([
          expect.objectContaining({ key: 'context_category_link_luxon_formatting_tokens_text' }),
        ]),
        type: '(guide_data_type_string) → guide_data_type_string',
      }),
    );
    expect(findEntry(entries, 'pushUrl')).toEqual(
      expect.objectContaining({ type: '(guide_data_type_string) → guide_data_type_none' }),
    );
    expect(findEntry(entries, 'popUrl')).toEqual(expect.objectContaining({ type: '() → guide_data_type_none' }));
  });

  it('flattens documented collection properties into full dot-notation paths', () => {
    const entries = getPropertyGuideEntries(intl);

    expectSortedByName(entries);
    expect(findEntry(entries, 'options.templates')).toEqual(
      expect.objectContaining({
        added: '2.0.0',
        descriptionKey: 'context_options_templates_description',
        type: 'guide_data_type_object',
      }),
    );
    expect(findEntry(entries, 'options.templates.action')).toEqual(
      expect.objectContaining({
        descriptionKey: 'context_options_templates_action_description',
        type: 'guide_data_type_object',
      }),
    );
    expect(findEntry(entries, 'options.templates.action.mode')).toEqual(
      expect.objectContaining({
        descriptionKey: 'context_options_templates_action_mode_description',
        type: 'guide_data_type_string',
        values: ['popup', 'template'],
      }),
    );
  });

  it('propagates property metadata that changes how the guide warns or constrains users', () => {
    const entries = getPropertyGuideEntries(intl);

    expect(findEntry(entries, 'options.urlShorteners.yourls.auth.password')).toEqual(
      expect.objectContaining({
        sensitive: true,
        type: 'guide_data_type_string',
      }),
    );
    expect(findEntry(entries, 'options.urlShorteners.yourls.auth.mode')).toEqual(
      expect.objectContaining({
        values: ['advanced', 'basic'],
      }),
    );
  });

  it('matches a query against an entry name or alias without considering case or surrounding whitespace', () => {
    const urlEntry = findEntry(getStandardGuideEntries(intl), 'url');

    expect(matchesGuideQuery(urlEntry, ' URL ')).toBe(true);
    expect(matchesGuideQuery(urlEntry, 'originalsource')).toBe(true);
    expect(matchesGuideQuery(urlEntry, 'not-present')).toBe(false);
    expect(matchesGuideQuery(urlEntry, '   ')).toBe(true);
  });
});
