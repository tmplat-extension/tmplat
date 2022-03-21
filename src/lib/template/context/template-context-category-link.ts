import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';

const WIKIPEDIA_HREF_PREFIX = 'https://en.wikipedia.org/wiki';
const WIKIPEDIA_LETTER_CASE_STYLISTIC_USAGE_HREF = `${WIKIPEDIA_HREF_PREFIX}/Letter_case#Stylistic_or_specialised_usage`;

export const IanaCharacterSetsLink = createLink(
  IntlMessageKey.ContextCategoryLinkIanaCharacterSetsText,
  'https://www.iana.org/assignments/character-sets/character-sets.xhtml',
);

export const LuxonFormattingTokensLink = createLink(
  IntlMessageKey.ContextCategoryLinkLuxonFormattingTokensText,
  'https://moment.github.io/luxon/#/formatting?id=table-of-tokens',
);

export const WikipediaCamelCaseLink = createLink(
  IntlMessageKey.ContextCategoryLinkWikipediaCamelCaseText,
  `${WIKIPEDIA_HREF_PREFIX}/CamelCase`,
);

export const WikipediaKebabCaseLink = createLink(
  IntlMessageKey.ContextCategoryLinkWikipediaKebabCaseText,
  WIKIPEDIA_LETTER_CASE_STYLISTIC_USAGE_HREF,
);

export const WikipediaLatin1SupplementLink = createLink(
  IntlMessageKey.ContextCategoryLinkWikipediaLatin1SupplementText,
  `${WIKIPEDIA_HREF_PREFIX}/Latin-1_Supplement`,
);

export const WikipediaLatinExtendedALink = createLink(
  IntlMessageKey.ContextCategoryLinkWikipediaLatinExtendedAText,
  `${WIKIPEDIA_HREF_PREFIX}/Latin_Extended-A`,
);

export const WikipediaSnakeCaseLink = createLink(
  IntlMessageKey.ContextCategoryLinkWikipediaSnakeCaseText,
  `${WIKIPEDIA_HREF_PREFIX}/Snake_case`,
);

export const WikipediaStartCaseLink = createLink(
  IntlMessageKey.ContextCategoryLinkWikipediaStartCaseText,
  WIKIPEDIA_LETTER_CASE_STYLISTIC_USAGE_HREF,
);

function createLink(key: IntlMessageKey, href: string): TemplateContextCategoryLink {
  return { key, href };
}

export type TemplateContextCategoryLink = {
  readonly key: IntlMessageKey;
  readonly href: string;
};
