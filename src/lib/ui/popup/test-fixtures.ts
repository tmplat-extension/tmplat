import { type Template } from 'extension/template/template.model';
import { type TemplatePopupInfo, type TemplatePopupInfoAction } from 'extension/template/template.service';

export const createTemplate = (overrides: Partial<Template> = {}): Template =>
  ({
    content: 'Template content',
    description: null,
    enabled: true,
    id: 'template-1',
    predefined: false,
    shortcut: null,
    title: 'Template 1',
    ...overrides,
  }) as Template;

export const createTemplatePopupInfo = (overrides: Partial<TemplatePopupInfo> = {}): TemplatePopupInfo => ({
  action: createTemplatePopupInfoAction(),
  shortcuts: { enabled: true },
  templates: [createTemplate()],
  ...overrides,
});

export const createTemplatePopupInfoAction = (
  overrides: Partial<TemplatePopupInfoAction> = {},
): TemplatePopupInfoAction => ({
  autoCloseEnabled: false,
  optionLinkEnabled: true,
  ...overrides,
});
