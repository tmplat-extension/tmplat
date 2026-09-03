import { IntlMessageKey } from 'extension/common/intl/intl-message-key';

const WIKIPEDIA_HREF_PREFIX = 'https://en.wikipedia.org/wiki';
const WIKIPEDIA_LETTER_CASE_STYLISTIC_USAGE_HREF = `${WIKIPEDIA_HREF_PREFIX}/Letter_case#Stylistic_or_specialised_usage`;

export const IanaCharacterSetsLink = createLink(
  'context_category_link_iana_character_sets_text',
  'https://www.iana.org/assignments/character-sets/character-sets.xhtml',
);

export const LuxonFormattingTokensLink = createLink(
  'context_category_link_luxon_formatting_tokens_text',
  'https://moment.github.io/luxon/#/formatting?id=table-of-tokens',
);

export const WikipediaCamelCaseLink = createLink(
  'context_category_link_wikipedia_camel_case_text',
  `${WIKIPEDIA_HREF_PREFIX}/CamelCase`,
);

export const WikipediaKebabCaseLink = createLink(
  'context_category_link_wikipedia_kebab_case_text',
  WIKIPEDIA_LETTER_CASE_STYLISTIC_USAGE_HREF,
);

export const WikipediaLatin1SupplementLink = createLink(
  'context_category_link_wikipedia_latin_1_supplement_text',
  `${WIKIPEDIA_HREF_PREFIX}/Latin-1_Supplement`,
);

export const WikipediaLatinExtendedALink = createLink(
  'context_category_link_wikipedia_latin_extended_a_text',
  `${WIKIPEDIA_HREF_PREFIX}/Latin_Extended-A`,
);

export const WikipediaSnakeCaseLink = createLink(
  'context_category_link_wikipedia_snake_case_text',
  `${WIKIPEDIA_HREF_PREFIX}/Snake_case`,
);

export const WikipediaStartCaseLink = createLink(
  'context_category_link_wikipedia_start_case_text',
  WIKIPEDIA_LETTER_CASE_STYLISTIC_USAGE_HREF,
);

function createLink(key: IntlMessageKey, href: string): TemplateContextCategoryLink {
  return { key, href };
}

export type TemplateContextCategoryLink = {
  readonly key: IntlMessageKey;
  readonly href: string;
};
