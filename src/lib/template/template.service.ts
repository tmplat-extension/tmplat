import { isUndefined, omit } from 'lodash-es';

import { inject, injectable } from 'extension/common/di';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { TemplateData, TemplateDataTemplate } from 'extension/template/data/template-data.model';
import { TemplateDataRepository, TemplateDataRepositoryToken } from 'extension/template/data/template-data.repository';
import { TemplateTitleMode } from 'extension/template/template-title-mode.enum';
import { Template } from 'extension/template/template.model';

export const TemplateServiceToken = Symbol('TemplateService');

@injectable()
export class TemplateService {
  constructor(
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(TemplateDataRepositoryToken) private readonly repository: TemplateDataRepository,
  ) {}

  addChangeListener(listener: TemplateServiceChangeListener) {
    this.repository.addChangeListener(({ oldValue, newValue }) => {
      if (oldValue && newValue) {
        listener(newValue);
      }
    });
  }

  async createTemplate(dto: CreateTemplateDto): Promise<Template> {
    const data = await this.repository.get();
    const id = TemplateService.generateId(data.templates);

    const createdTemplate: TemplateDataTemplate = {
      ...omit(dto, 'title'),
      id,
      predefined: false,
      title: {
        mode: TemplateTitleMode.Exact,
        value: dto.title,
      },
    };

    data.templates.push(createdTemplate);

    await this.repository.set(data);

    return createdTemplate;
  }

  createTemplateContextMenuInfo(data: TemplateData): TemplateContextMenuInfo {
    return {
      autoPasteEnabled: data.contextMenu.autoPasteEnabled,
      enabled: data.contextMenu.enabled,
      optionLinkEnabled: data.contextMenu.optionLinkEnabled,
      templates: data.templates.filter((template) => template.enabled),
    };
  }

  createTemplatePopupInfo(data: TemplateData): TemplatePopupInfo {
    return {
      action: {
        autoCloseEnabled: data.action.popup.autoCloseEnabled,
        optionLinkEnabled: data.action.popup.optionLinkEnabled,
      },
      shortcuts: {
        enabled: data.shortcuts.enabled,
      },
      templates: data.templates.filter((template) => template.enabled),
    };
  }

  createTemplateShortcutInfo(data: TemplateData): TemplateShortcutInfo {
    return {
      autoPasteEnabled: data.shortcuts.autoPasteEnabled,
      enabled: data.shortcuts.enabled,
      shortcuts: data.templates
        .map((template) => template.shortcut)
        .filter((shortcut): shortcut is string => shortcut != null),
    };
  }

  async findTemplateById(id: string): Promise<Template | undefined> {
    const templates = await this.getTemplates();

    return templates.find((template) => template.id === id);
  }

  async findTemplateByShortcut(shortcut: string): Promise<Template | undefined> {
    const safeShortcut = shortcut.toUpperCase();
    const templates = await this.getTemplates();

    return templates.find((template) => template.shortcut === safeShortcut);
  }

  getTemplateTitle({ title }: Template): string {
    if (title.mode === TemplateTitleMode.Localized) {
      return this.intl.getMessage(title.key);
    }

    return title.value;
  }

  async getTemplateContextMenuInfo(): Promise<TemplateContextMenuInfo> {
    const data = await this.repository.get();

    return this.createTemplateContextMenuInfo(data);
  }

  async getTemplatePopupInfo(): Promise<TemplatePopupInfo> {
    const data = await this.repository.get();

    return this.createTemplatePopupInfo(data);
  }

  async getTemplateShortcutInfo(): Promise<TemplateShortcutInfo> {
    const data = await this.repository.get();

    return this.createTemplateShortcutInfo(data);
  }

  async getTemplates(): Promise<Template[]> {
    return (await this.repository.get()).templates;
  }

  removeTemplate(id: string): Promise<void> {
    return this.repository.modify((data) => {
      let template: TemplateDataTemplate | null = null;
      let templateIndex = -1;

      for (let i = 0; i < data.templates.length; i++) {
        if (data.templates[i].id === id) {
          template = data.templates[i];
          templateIndex = i;
          break;
        }
      }

      if (!template) {
        throw new Error(`Could not find Template: '${id}'`);
      }
      if (template.predefined) {
        throw new Error(`Could not remove predefined Template: '${id}'`);
      }

      data.templates.splice(templateIndex, 1);

      return data;
    });
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto): Promise<Template> {
    const data = await this.repository.get();
    const existingTemplate = data.templates.find((template) => template.id === id);

    if (!existingTemplate) {
      throw new Error(`Could not find Template: '${id}'`);
    }

    existingTemplate.content = dto.content;
    existingTemplate.enabled = dto.enabled;
    existingTemplate.icon = dto.icon;
    existingTemplate.shortcut = dto.shortcut;

    if (!(existingTemplate.predefined || isUndefined(dto.title))) {
      existingTemplate.title = {
        mode: TemplateTitleMode.Exact,
        value: dto.title,
      };
    }

    await this.repository.set(data);

    return existingTemplate;
  }

  private static generateId(templates: Template[]): string {
    let id: string;
    const ids = new Set(templates.map((template) => template.id));

    do {
      id = crypto.randomUUID();
    } while (ids.has(id));

    return id;
  }
}

export type CreateTemplateDto = Omit<TemplateDataTemplate, 'id' | 'predefined' | 'title'> & {
  title: string;
};

export type TemplateContextMenuInfo = {
  // TODO: Is this used?
  readonly autoPasteEnabled: boolean;
  readonly enabled: boolean;
  readonly optionLinkEnabled: boolean;
  readonly templates: readonly Template[];
};

export type TemplatePopupInfo = {
  readonly action: TemplatePopupInfoAction;
  readonly shortcuts: TemplatePopupInfoShortcuts;
  readonly templates: readonly Template[];
};

export type TemplatePopupInfoAction = {
  readonly autoCloseEnabled: boolean;
  readonly optionLinkEnabled: boolean;
};

export type TemplatePopupInfoShortcuts = {
  readonly enabled: boolean;
};

export type TemplateServiceChangeListener = (data: TemplateData) => void;

export type TemplateShortcutInfo = {
  readonly autoPasteEnabled: boolean;
  readonly enabled: boolean;
  readonly shortcuts: readonly string[];
};

export type UpdateTemplateDto = Omit<TemplateDataTemplate, 'id' | 'predefined' | 'title'> & {
  title?: string;
};
