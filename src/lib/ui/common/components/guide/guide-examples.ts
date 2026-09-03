import { type GuideExample } from 'extension/ui/common/components/guide/guide.model';

/**
 * Examples are deliberately hard-coded per category rather than per entry, as they are intended to demonstrate the
 * syntax shared by every entry within a category.
 *
 * They use the `tmplat-mustache` syntax, which differs from stock mustache.js: tags are delimited by *single* curly
 * braces, values are unescaped by default, and `{{name}}` (or `{&name}`) is what escapes.
 *
 * Entry names are written in camel case to match how they are declared and displayed, but lookups are
 * case-insensitive, so the casing used here is purely cosmetic.
 *
 * Each example assumes the active tab is `https://example.com/docs/intro?q=tmplat#usage` titled "Example & Domain".
 * `guide-examples.test.ts` renders every example against that scenario, so an output here cannot drift from what the
 * engine actually produces.
 */
export const standardGuideExamples: readonly GuideExample[] = [
  {
    descriptionKey: 'guide_example_standard_reference',
    template: '{title}',
    output: 'Example & Domain',
  },
  {
    descriptionKey: 'guide_example_standard_escaping',
    template: '{{title}}',
    output: 'Example &amp; Domain',
  },
  {
    descriptionKey: 'guide_example_standard_surrounding_text',
    template: '[{title}]({url})',
    output: '[Example & Domain](https://example.com/docs/intro?q=tmplat#usage)',
  },
  {
    descriptionKey: 'guide_example_standard_boolean_section',
    template: '{#cookiesEnabled}Cookies are enabled{/cookiesEnabled}',
    output: 'Cookies are enabled',
  },
];

export const collectionGuideExamples: readonly GuideExample[] = [
  {
    descriptionKey: 'guide_example_collection_direct',
    template: '{segments}',
    output: 'docs,intro',
  },
  {
    descriptionKey: 'guide_example_collection_iterate',
    template: '{#segments}/{.}{/segments}',
    output: '/docs/intro',
  },
  {
    descriptionKey: 'guide_example_collection_property',
    template: '{cookies.session_id}',
    output: 'a1b2c3d4',
  },
  {
    descriptionKey: 'guide_example_collection_nested',
    template: '{options.templates.markdown.inline}',
    output: 'true',
  },
  {
    descriptionKey: 'guide_example_collection_section',
    template: '{#options}{templates.links.target}{/options}',
    output: 'true',
  },
  {
    descriptionKey: 'guide_example_collection_inverted',
    template: '{#keywords}{.} {/keywords}{^keywords}No keywords{/keywords}',
    output: 'No keywords',
  },
];

export const operationGuideExamples: readonly GuideExample[] = [
  {
    descriptionKey: 'guide_example_operation_wrap',
    template: '{#upper}{title}{/upper}',
    output: 'EXAMPLE & DOMAIN',
  },
  {
    descriptionKey: 'guide_example_operation_nested',
    template: '{#encodeUriComponent}{#upper}{title}{/upper}{/encodeUriComponent}',
    output: 'EXAMPLE%20%26%20DOMAIN',
  },
  {
    descriptionKey: 'guide_example_operation_literal_argument',
    template: '{#searchParam}q{/searchParam}',
    output: 'tmplat',
  },
  {
    descriptionKey: 'guide_example_operation_no_input',
    template: '{#dateTime}yyyy-MM-dd{/dateTime}',
    output: '2026-09-03',
  },
];

export const optionGuideExamples: readonly GuideExample[] = [
  {
    descriptionKey: 'guide_example_option_path',
    template: '{options.templates.links.target}',
    output: 'true',
  },
  {
    descriptionKey: 'guide_example_option_boolean_section',
    template: '{#options.templates.contextMenu.enabled}Context menu is enabled{/options.templates.contextMenu.enabled}',
    output: 'Context menu is enabled',
  },
  {
    descriptionKey: 'guide_example_option_inverted',
    template: '{^options.templates.links.title}No title attribute{/options.templates.links.title}',
    output: 'No title attribute',
  },
  {
    descriptionKey: 'guide_example_option_group_section',
    template: '{#options.urlShorteners.yourls}{url}{/options.urlShorteners.yourls}',
    output: 'https://sho.rt',
  },
];
