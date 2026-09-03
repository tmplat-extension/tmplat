import { type IntlMessageKey } from 'extension/common/intl/intl-message-key';

const WIKIPEDIA_HREF_PREFIX = 'https://en.wikipedia.org/wiki';
const WIKIPEDIA_LETTER_CASE_STYLISTIC_USAGE_HREF = `${WIKIPEDIA_HREF_PREFIX}/Letter_case#Stylistic_or_specialised_usage`;

const defineLink = (key: IntlMessageKey, href: string): TemplateContextCategoryLink => ({ key, href });

export const IanaCharacterSetsLink = defineLink(
  'context_category_link_iana_character_sets_text',
  'https://www.iana.org/assignments/character-sets/character-sets.xhtml',
);

export const LuxonFormattingTokensLink = defineLink(
  'context_category_link_luxon_formatting_tokens_text',
  'https://moment.github.io/luxon/#/formatting?id=table-of-tokens',
);

export const WikipediaCamelCaseLink = defineLink(
  'context_category_link_wikipedia_camel_case_text',
  `${WIKIPEDIA_HREF_PREFIX}/CamelCase`,
);

export const WikipediaKebabCaseLink = defineLink(
  'context_category_link_wikipedia_kebab_case_text',
  WIKIPEDIA_LETTER_CASE_STYLISTIC_USAGE_HREF,
);

export const WikipediaLatin1SupplementLink = defineLink(
  'context_category_link_wikipedia_latin_1_supplement_text',
  `${WIKIPEDIA_HREF_PREFIX}/Latin-1_Supplement`,
);

export const WikipediaLatinExtendedALink = defineLink(
  'context_category_link_wikipedia_latin_extended_a_text',
  `${WIKIPEDIA_HREF_PREFIX}/Latin_Extended-A`,
);

export const WikipediaSnakeCaseLink = defineLink(
  'context_category_link_wikipedia_snake_case_text',
  `${WIKIPEDIA_HREF_PREFIX}/Snake_case`,
);

export const WikipediaStartCaseLink = defineLink(
  'context_category_link_wikipedia_start_case_text',
  WIKIPEDIA_LETTER_CASE_STYLISTIC_USAGE_HREF,
);

export type TemplateContextCategoryLink = {
  readonly key: IntlMessageKey;
  readonly href: string;
};
