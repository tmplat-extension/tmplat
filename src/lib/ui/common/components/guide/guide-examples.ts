import { GuideExample } from 'extension/ui/common/components/guide/guide.model';

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
 * Each example assumes the active tab is `https://example.com/docs/intro?q=tmplat#usage` titled "Example & Domain",
 * and every output below has been verified against the engine.
 */

export const standardGuideExamples: readonly GuideExample[] = [
  {
    descriptionKey: 'guide_examples_standard_description_1',
    template: '{title}',
    output: 'Example & Domain',
  },
  {
    descriptionKey: 'guide_examples_standard_description_2',
    template: '{{title}}',
    output: 'Example &amp; Domain',
  },
  {
    descriptionKey: 'guide_examples_standard_description_3',
    template: '[{title}]({url})',
    output: '[Example & Domain](https://example.com/docs/intro?q=tmplat#usage)',
  },
  {
    descriptionKey: 'guide_examples_standard_description_4',
    template: '{#cookiesEnabled}Cookies are enabled{/cookiesEnabled}',
    output: 'Cookies are enabled',
  },
];

export const collectionGuideExamples: readonly GuideExample[] = [
  {
    descriptionKey: 'guide_examples_collection_description_1',
    template: '{segments}',
    output: 'docs,intro',
  },
  {
    descriptionKey: 'guide_examples_collection_description_2',
    template: '{#segments}/{.}{/segments}',
    output: '/docs/intro',
  },
  {
    descriptionKey: 'guide_examples_collection_description_3',
    template: '{cookies.session_id}',
    output: 'a1b2c3d4',
  },
  {
    descriptionKey: 'guide_examples_collection_description_4',
    template: '{options.templates.markdown.inline}',
    output: 'true',
  },
  {
    descriptionKey: 'guide_examples_collection_description_5',
    template: '{#options}{templates.links.target}{/options}',
    output: 'true',
  },
  {
    descriptionKey: 'guide_examples_collection_description_6',
    template: '{#keywords}{.} {/keywords}{^keywords}No keywords{/keywords}',
    output: 'No keywords',
  },
];

export const operationGuideExamples: readonly GuideExample[] = [
  {
    descriptionKey: 'guide_examples_operation_description_1',
    template: '{#upper}{title}{/upper}',
    output: 'EXAMPLE & DOMAIN',
  },
  {
    descriptionKey: 'guide_examples_operation_description_2',
    template: '{#encodeUriComponent}{#upper}{title}{/upper}{/encodeUriComponent}',
    output: 'EXAMPLE%20%26%20DOMAIN',
  },
  {
    descriptionKey: 'guide_examples_operation_description_3',
    template: '{#searchParam}q{/searchParam}',
    output: 'tmplat',
  },
  {
    descriptionKey: 'guide_examples_operation_description_4',
    template: '{#dateTime}yyyy-MM-dd{/dateTime}',
    output: '2026-09-03',
  },
];

export const optionGuideExamples: readonly GuideExample[] = [
  {
    descriptionKey: 'guide_examples_option_description_1',
    template: '{options.templates.links.target}',
    output: 'true',
  },
  {
    descriptionKey: 'guide_examples_option_description_2',
    template: '{#options.templates.contextMenu.enabled}Context menu is enabled{/options.templates.contextMenu.enabled}',
    output: 'Context menu is enabled',
  },
  {
    descriptionKey: 'guide_examples_option_description_3',
    template: '{^options.templates.links.title}No title attribute{/options.templates.links.title}',
    output: 'No title attribute',
  },
  {
    descriptionKey: 'guide_examples_option_description_4',
    template: '{#options.urlShorteners.yourls}{url}{/options.urlShorteners.yourls}',
    output: 'https://sho.rt',
  },
];
