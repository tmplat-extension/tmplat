import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateIconName } from 'extension/template/template-icon-name.model';
import { TemplateTitleMode } from 'extension/template/template-title-mode.enum';

export type TemplateData = {
  action: TemplateDataAction;
  contextMenu: TemplateDataContextMenu;
  link: TemplateDataLink;
  markdown: TemplateDataMarkdown;
  shortcuts: TemplateDataShortcuts;
  templates: TemplateDataTemplate[];
};

export type TemplateDataAction = {
  mode: TemplateActionMode;
  popup: TemplateDataActionPopup;
  templateId: string;
};

export type TemplateDataActionPopup = {
  autoCloseEnabled: boolean;
  optionLinkEnabled: boolean;
};

export type TemplateDataContextMenu = {
  // TODO: Is this used?
  autoPasteEnabled: boolean;
  enabled: boolean;
  optionLinkEnabled: boolean;
};

export type TemplateDataLink = {
  target: boolean;
  title: boolean;
};

export type TemplateDataMarkdown = {
  inline: boolean;
};

export type TemplateDataShortcuts = {
  autoPasteEnabled: boolean;
  enabled: boolean;
};

export type TemplateDataTemplate = TemplateDataTemplatePredefined | TemplateDataTemplateUserDefined;

export type TemplateDataTemplateBase = {
  content: string;
  enabled: boolean;
  icon: TemplateIconName | null;
  readonly id: string;
  shortcut: string | null;
};

export type TemplateDataTemplatePredefined = TemplateDataTemplateBase & {
  readonly predefined: true;
  readonly title: TemplateDataTemplatePredefinedTitle;
};

export type TemplateDataTemplatePredefinedTitle = {
  readonly key: IntlMessageKey;
  readonly mode: TemplateTitleMode.Localized;
};

export type TemplateDataTemplateUserDefined = TemplateDataTemplateBase & {
  readonly predefined: false;
  title: TemplateDataTemplateUserDefinedTitle;
};

export type TemplateDataTemplateUserDefinedTitle = {
  readonly mode: TemplateTitleMode.Exact;
  readonly value: string;
};
