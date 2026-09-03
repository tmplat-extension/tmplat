import { IntlService } from 'extension/common/intl/intl.service';
import { templateContextEntriesDefinitions } from 'extension/template/context/entry';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import {
  TemplateContextEntryDefinition,
  TemplateContextEntryDefinitionCategories,
  TemplateContextEntryDefinitionCategory,
  TemplateContextEntryDefinitionCollectionCategory,
  TemplateContextEntryDefinitionCollectionProperty,
  TemplateContextEntryDefinitionOperationCategory,
} from 'extension/template/context/template-context.model';
import { GuideEntry } from 'extension/ui/common/components/guide/guide.model';

function getDataTypeLabels(intl: IntlService): Readonly<Record<TemplateContextDataType, string>> {
  return {
    [TemplateContextDataType.Array]: intl.getMessage('guide_data_type_array'),
    [TemplateContextDataType.Boolean]: intl.getMessage('guide_data_type_boolean'),
    [TemplateContextDataType.Number]: intl.getMessage('guide_data_type_number'),
    [TemplateContextDataType.Object]: intl.getMessage('guide_data_type_object'),
    [TemplateContextDataType.String]: intl.getMessage('guide_data_type_string'),
  };
}

/**
 * Returns every entry that can be used as a simple `{name}` tag, sorted by name.
 */
export function getStandardGuideEntries(intl: IntlService): GuideEntry[] {
  const dataTypeLabels = getDataTypeLabels(intl);

  return buildGuideEntries(
    (categories) => categories[TemplateContextCategory.Standard],
    (category) => dataTypeLabels[category.dataType],
  );
}

/**
 * Returns every entry that resolves to a list or object, sorted by name.
 */
export function getCollectionGuideEntries(intl: IntlService): GuideEntry[] {
  const dataTypeLabels = getDataTypeLabels(intl);

  return buildGuideEntries(
    (categories) => categories[TemplateContextCategory.Collection],
    (category) => getCollectionTypeLabel(dataTypeLabels, category),
  );
}

/**
 * Returns every entry that transforms the content of the section that it wraps, sorted by name.
 */
export function getOperationGuideEntries(intl: IntlService): GuideEntry[] {
  const dataTypeLabels = getDataTypeLabels(intl);
  const noneLabel = intl.getMessage('guide_data_type_none');

  return buildGuideEntries(
    (categories) => categories[TemplateContextCategory.Operation],
    (category) => getOperationTypeLabel(dataTypeLabels, noneLabel, category),
  );
}

/**
 * Determines whether `entry` matches `query`, which is compared against both the entry name and any of its aliases.
 */
export function matchesGuideQuery(entry: GuideEntry, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return (
    entry.name.toLowerCase().includes(normalizedQuery) ||
    entry.aliases.some((alias) => alias.toLowerCase().includes(normalizedQuery))
  );
}

function buildGuideEntries<C extends TemplateContextEntryDefinitionCategory>(
  selectCategory: (categories: TemplateContextEntryDefinitionCategories) => C | undefined,
  getTypeLabel: (category: C) => string,
): GuideEntry[] {
  return templateContextEntriesDefinitions
    .flatMap<GuideEntry>((definition) => {
      // Aliases are listed alongside the entry that they alias rather than as entries in their own right, mirroring how
      // the legacy guide combined them (e.g. "fragment/anchor")
      if (definition.aliasOf) {
        return [];
      }

      const category = selectCategory(definition.categories);
      if (!category) {
        return [];
      }

      return [
        {
          added: definition.added,
          aliases: [...(definition.aliases ?? [])].sort((a, b) => a.localeCompare(b)),
          deprecated: definition.deprecated,
          descriptionKey: category.descriptionKey,
          links: category.links ?? [],
          name: definition.name,
          type: getTypeLabel(category),
        },
      ];
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getCollectionTypeLabel(
  dataTypeLabels: Readonly<Record<TemplateContextDataType, string>>,
  category: TemplateContextEntryDefinitionCollectionCategory,
): string {
  if (category.dataType === TemplateContextDataType.Array) {
    return `${dataTypeLabels[TemplateContextDataType.Array]}<${dataTypeLabels[category.itemDataType]}>`;
  }

  // An object either documents each of its properties individually or has a single value type shared by every property
  return 'valueDataType' in category
    ? `${dataTypeLabels[TemplateContextDataType.Object]}<${dataTypeLabels[category.valueDataType]}>`
    : dataTypeLabels[TemplateContextDataType.Object];
}

function getOperationTypeLabel(
  dataTypeLabels: Readonly<Record<TemplateContextDataType, string>>,
  noneLabel: string,
  category: TemplateContextEntryDefinitionOperationCategory,
): string {
  const input = category.inputDataType == null ? '' : dataTypeLabels[category.inputDataType];
  const output = category.outputDataType == null ? noneLabel : dataTypeLabels[category.outputDataType];

  return `(${input}) → ${output}`;
}

/**
 * Returns every documented property of every object collection entry, as full dot-notation paths (e.g.
 * `options.templates.links.target`), sorted so that each branch is immediately followed by its own properties.
 *
 * Paths are what a user actually types, so they are shown in full rather than as a nested tree.
 */
export function getPropertyGuideEntries(intl: IntlService): GuideEntry[] {
  const dataTypeLabels = getDataTypeLabels(intl);

  return templateContextEntriesDefinitions
    .flatMap((definition) => {
      if (definition.aliasOf) {
        return [];
      }

      const category = definition.categories[TemplateContextCategory.Collection];
      if (!category || !('properties' in category)) {
        return [];
      }

      return flattenProperties(dataTypeLabels, category.properties, [definition.name], definition);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function flattenProperties(
  dataTypeLabels: Readonly<Record<TemplateContextDataType, string>>,
  properties: Readonly<Record<string, TemplateContextEntryDefinitionCollectionProperty>>,
  path: readonly string[],
  definition: TemplateContextEntryDefinition,
): GuideEntry[] {
  return Object.entries(properties).flatMap(([key, property]) => {
    const propertyPath = [...path, key];
    const name = propertyPath.join('.');

    // Branches are listed alongside their properties so that the grouping is itself documented and searchable
    if ('properties' in property) {
      return [
        {
          added: definition.added,
          aliases: [],
          deprecated: definition.deprecated,
          descriptionKey: property.descriptionKey,
          links: [],
          name,
          type: dataTypeLabels[TemplateContextDataType.Object],
        },
        ...flattenProperties(dataTypeLabels, property.properties, propertyPath, definition),
      ];
    }

    return [
      {
        added: definition.added,
        aliases: [],
        deprecated: property.deprecated ?? definition.deprecated,
        descriptionKey: property.descriptionKey,
        links: [],
        name,
        sensitive: property.sensitive,
        type: dataTypeLabels[property.dataType],
        values: property.values,
      },
    ];
  });
}
