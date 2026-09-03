import { IntlMessageKey } from 'extension/common/intl/intl-message-key';
import { TemplateDataTemplatePredefined } from 'extension/template/data/template-data.model';

const predefinedTemplates: readonly PredefinedTemplate[] = [
  defineTemplate('00001', {
    descriptionKey: 'predefined_template_url_description',
    content: '{url}',
    shortcut: 'U',
    titleKey: 'predefined_template_url_title',
  }),
  defineTemplate('00002', {
    content: '{#shorten}{url}{/shorten}',
    descriptionKey: 'predefined_template_short_url_description',
    shortcut: 'S',
    titleKey: 'predefined_template_short_url_title',
  }),
  // TODO: Change template to use new entries for links*
  defineTemplate('00003', {
    content:
      '<a href="{{url}}"{#linksTarget} target="_blank"{/linksTarget}{#linksTitle} title="{{title}}"{/linksTitle}>{{title}}</a>',
    descriptionKey: 'predefined_template_anchor_description',
    shortcut: 'A',
    titleKey: 'predefined_template_anchor_title',
  }),
  defineTemplate('00004', {
    content: '{#encode}{url}{/encode}',
    descriptionKey: 'predefined_template_encoded_description',
    shortcut: 'E',
    titleKey: 'predefined_template_encoded_title',
  }),
  defineTemplate('00005', {
    content: '[url={url}]{title}[/url]',
    descriptionKey: 'predefined_template_bbcode_description',
    enabled: false,
    shortcut: 'B',
    titleKey: 'predefined_template_bbcode_title',
  }),
  // TODO: Change template to use new entries for links*
  defineTemplate('00006', {
    content: '[{title}]({url}{#linksTitle} "{title}"{/linksTitle})',
    descriptionKey: 'predefined_template_markdown_description',
    enabled: false,
    shortcut: 'M',
    titleKey: 'predefined_template_markdown_title',
  }),
  defineTemplate('00007', {
    content: '{selectionMarkdown}',
    descriptionKey: 'predefined_template_markdown_selection_description',
    enabled: false,
    shortcut: 'I',
    titleKey: 'predefined_template_markdown_selection_title',
  }),
];

/**
 * Dictionary of every predefined template, derived from the predefined template array and keyed by template ID.
 *
 * Only the properties of a predefined template that a user can change (i.e. `enabled` and `shortcut`) are persisted,
 * so everything else must be resolved from here. That way, the content and localization keys of a predefined template
 * can be changed freely between releases without having to migrate anything that has already been stored.
 */
const predefinedTemplateDictionary: ReadonlyMap<string, PredefinedTemplate> = new Map(
  predefinedTemplates.map((predefinedTemplate) => [predefinedTemplate.id, predefinedTemplate]),
);

/**
 * Returns the predefined template with the given `id`, if any.
 *
 * A missing predefined template is expected whenever stored data still references a template that has since been
 * dropped, which is tidied up by `TemplateDataRepository` on the next update.
 */
export function getPredefinedTemplate(id: string): PredefinedTemplate | undefined {
  return predefinedTemplateDictionary.get(id);
}

/**
 * Returns every predefined template, in the order in which they are to be presented by default.
 *
 * This is typically only needed to populate the default entries on install/update - use {@link getPredefinedTemplate}
 * to resolve the non-persisted properties of a stored predefined template.
 */
export function getPredefinedTemplates(): readonly PredefinedTemplate[] {
  return predefinedTemplates;
}

/**
 * Reduces `predefinedTemplate` to only those properties that are persisted for a predefined template.
 */
export function toPredefinedTemplateData(predefinedTemplate: PredefinedTemplate): TemplateDataTemplatePredefined {
  return {
    enabled: predefinedTemplate.enabled,
    id: predefinedTemplate.id,
    predefined: true,
    shortcut: predefinedTemplate.shortcut,
  };
}

function defineTemplate(
  predefinedId: string,
  { content, descriptionKey, enabled = true, shortcut = null, titleKey }: PredefinedTemplateDefinition,
): PredefinedTemplate {
  return {
    content,
    descriptionKey,
    enabled,
    id: `PREDEFINED.${predefinedId}`,
    shortcut,
    titleKey,
  };
}

export type PredefinedTemplate = {
  readonly content: string;
  readonly descriptionKey: IntlMessageKey;
  readonly enabled: boolean;
  readonly id: string;
  readonly shortcut: string | null;
  readonly titleKey: IntlMessageKey;
};

/**
 * The properties of a predefined template that are resolved from {@link getPredefinedTemplate} rather than persisted.
 */
export type PredefinedTemplateProperties = Pick<PredefinedTemplate, 'content' | 'descriptionKey' | 'titleKey'>;

type PredefinedTemplateDefinition = PredefinedTemplateProperties & {
  readonly enabled?: boolean;
  readonly shortcut?: string | null;
};
