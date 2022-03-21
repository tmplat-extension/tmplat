import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { TemplateIconName } from 'extension/template/template-icon-name.model';
import { TemplateTitleMode } from 'extension/template/template-title-mode.enum';
import { Template } from 'extension/template/template.model';

export function getPredefinedTemplates(): Template[] {
  return [
    defineTemplate('00001', {
      content: '{url}',
      icon: 'Public',
      shortcut: 'U',
      titleKey: IntlMessageKey.PredefinedTemplateUrl,
    }),
    defineTemplate('00002', {
      content: '{#shorten}{url}{/shorten}',
      icon: 'Label',
      shortcut: 'S',
      titleKey: IntlMessageKey.PredefinedTemplateShort,
    }),
    // TODO: Change template to use new entries for links*
    defineTemplate('00003', {
      content:
        '<a href="{url}"{#linksTarget} target="_blank"{/linksTarget}{#linksTitle} title="{{title}}"{/linksTitle}>{{title}}</a>',
      icon: 'Code',
      shortcut: 'A',
      titleKey: IntlMessageKey.PredefinedTemplateAnchor,
    }),
    defineTemplate('00004', {
      content: '{#encode}{url}{/encode}',
      icon: 'Lock',
      shortcut: 'E',
      titleKey: IntlMessageKey.PredefinedTemplateEncoded,
    }),
    defineTemplate('00005', {
      content: '[url={url}]{title}[/url]',
      enabled: false,
      icon: 'Comment',
      shortcut: 'B',
      titleKey: IntlMessageKey.PredefinedTemplateBbcode,
    }),
    // TODO: Change template to use new entries for links*
    defineTemplate('00006', {
      content: '[{title}]({url}{#linksTitle} "{title}"{/linksTitle})',
      enabled: false,
      icon: 'Star',
      shortcut: 'M',
      titleKey: IntlMessageKey.PredefinedTemplateMarkdown,
    }),
    defineTemplate('00007', {
      content: '{selectionMarkdown}',
      enabled: false,
      icon: 'FormatItalic',
      shortcut: 'I',
      titleKey: IntlMessageKey.PredefinedTemplateMarkdownSelection,
    }),
  ];
}

function defineTemplate(
  predefinedId: string,
  { content, enabled = true, icon = null, shortcut = null, titleKey }: PredefinedTemplate,
): Template {
  return {
    content,
    enabled,
    icon,
    id: `PREDEFINED.${predefinedId}`,
    predefined: true,
    shortcut,
    title: {
      key: titleKey,
      mode: TemplateTitleMode.Localized,
    },
  };
}

type PredefinedTemplate = {
  readonly content: string;
  readonly enabled?: boolean;
  readonly icon?: TemplateIconName | null;
  readonly shortcut?: string | null;
  readonly titleKey: IntlMessageKey;
};
