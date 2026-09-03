import { decodeBase64Utf8, encodeBase64Utf8 } from 'extension/common/codec/base64.utils';
import { inject, injectable } from 'extension/common/di';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { isUndefined } from 'extension/common/type.utils';
import { validateSchema } from 'extension/common/validation.utils';
import {
  TemplateData,
  TemplateDataTemplate,
  TemplateDataTemplateBase,
  TemplateDataTemplateUserDefined,
} from 'extension/template/data/template-data.model';
import { TemplateDataRepository, TemplateDataRepositoryToken } from 'extension/template/data/template-data.repository';
import { getPredefinedTemplate } from 'extension/template/predefined-templates';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';
import {
  TEMPLATE_TRANSFER_VERSION,
  TemplateTransfer,
  TemplateTransferTemplate,
} from 'extension/template/template-transfer.model';
import { templateTransferSchema } from 'extension/template/template-transfer.schema';
import { Template, TemplatePredefined } from 'extension/template/template.model';

export const TemplateServiceToken = Symbol('TemplateService');

@injectable()
export class TemplateService {
  constructor(
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(TemplateDataRepositoryToken) private readonly repository: TemplateDataRepository,
  ) {}

  addChangeListener(listener: TemplateServiceChangeListener) {
    this.repository.addChangeListener(({ newValue }) => {
      if (newValue) {
        listener(newValue);
      }
    });
  }

  async createTemplate(dto: CreateTemplateDto): Promise<Template> {
    const [createdTemplate] = await this.createTemplates([dto]);

    return createdTemplate;
  }

  /**
   * Creates any number of user-defined templates in a single write.
   *
   * Any shortcut that is already assigned to another template - or duplicated within `dtos` - is discarded, since
   * shortcuts must remain unique for {@link findTemplateByShortcut} to be deterministic.
   */
  async createTemplates(dtos: readonly CreateTemplateDto[]): Promise<Template[]> {
    const createdTemplates: TemplateDataTemplateUserDefined[] = [];

    await this.repository.mutate((data) => {
      const ids = new Set(data.templates.map((template) => template.id));
      const shortcuts = new Set(
        data.templates.map((template) => template.shortcut).filter((shortcut): shortcut is string => shortcut != null),
      );

      for (const dto of dtos) {
        const shortcut = dto.shortcut && !shortcuts.has(dto.shortcut) ? dto.shortcut : null;
        if (shortcut) {
          shortcuts.add(shortcut);
        }

        const id = TemplateService.generateId(ids);
        ids.add(id);

        const createdTemplate: TemplateDataTemplateUserDefined = {
          ...dto,
          id,
          predefined: false,
          shortcut,
        };

        createdTemplates.push(createdTemplate);
        data.templates.push(createdTemplate);
      }

      return data;
    });

    return createdTemplates;
  }

  createTemplateActionInfo(data: TemplateData): TemplateActionInfo {
    if (data.action.mode === TemplateActionMode.Popup) {
      return { mode: TemplateActionMode.Popup };
    }

    const template = TemplateService.toTemplates(data.templates).find(
      (template) => template.id === data.action.templateId,
    );
    return {
      mode: TemplateActionMode.Template,
      template: template?.enabled ? template : undefined,
      templateId: data.action.templateId,
    };
  }

  createTemplateContextMenuInfo(data: TemplateData): TemplateContextMenuInfo {
    const contextMenuInfo = {
      autoPasteEnabled: data.contextMenu.autoPasteEnabled,
      enabled: data.contextMenu.enabled,
      optionLinkEnabled: data.contextMenu.optionLinkEnabled,
      templates: TemplateService.toTemplates(data.templates).filter((template) => template.enabled),
    };
    if (data.contextMenu.mode === TemplateContextMenuMode.Menu) {
      return {
        ...contextMenuInfo,
        mode: TemplateContextMenuMode.Menu,
      };
    }

    return {
      ...contextMenuInfo,
      mode: TemplateContextMenuMode.Template,
      templateId: data.action.templateId,
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
      templates: TemplateService.toTemplates(data.templates).filter((template) => template.enabled),
    };
  }

  createTemplateShortcutInfo(data: TemplateData): TemplateShortcutInfo {
    return {
      autoPasteEnabled: data.shortcuts.autoPasteEnabled,
      enabled: data.shortcuts.enabled,
      shortcuts: TemplateService.toTemplates(data.templates)
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

  getTemplateDescription(template: TemplatePredefined): string;
  getTemplateDescription(template: Template): string | null;
  getTemplateDescription(template: Template): string | null {
    if (template.predefined) {
      return this.intl.getMessage(template.descriptionKey);
    }
    return template.description;
  }

  getTemplateTitle(template: Template): string {
    if (template.predefined) {
      return this.intl.getMessage(template.titleKey);
    }
    return template.title;
  }

  async getTemplateActionInfo(): Promise<TemplateActionInfo> {
    const data = await this.repository.get();

    return this.createTemplateActionInfo(data);
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
    return TemplateService.toTemplates((await this.repository.get()).templates);
  }

  async removeTemplate(id: string): Promise<void> {
    await this.removeTemplates([id]);
  }

  /**
   * Removes any number of user-defined templates in a single write.
   *
   * Predefined templates cannot be removed, mirroring the legacy options page, where the delete action was disabled for
   * them.
   */
  async removeTemplates(ids: readonly string[]): Promise<void> {
    if (!ids.length) {
      return;
    }

    await this.repository.mutate((data) => {
      const removableIds = new Set<string>();

      for (const id of ids) {
        const template = data.templates.find((existingTemplate) => existingTemplate.id === id);

        if (!template) {
          // TODO: Localise error messages and use ExtensionError instead
          throw new Error(`Could not find Template: '${id}'`);
        }
        if (template.predefined) {
          // TODO: Localise error messages and use ExtensionError instead
          throw new Error(`Could not remove predefined Template: '${id}'`);
        }

        removableIds.add(id);
      }

      data.templates = data.templates.filter((template) => !removableIds.has(template.id));

      if (removableIds.has(data.action.templateId)) {
        data.action.templateId = data.templates.find((template) => template.enabled)?.id ?? data.templates[0]?.id ?? '';
      }

      return data;
    });
  }

  /**
   * Enables or disables any number of templates - predefined or otherwise - in a single write.
   */
  async setTemplatesEnabled(ids: readonly string[], enabled: boolean): Promise<void> {
    if (!ids.length) {
      return;
    }

    await this.repository.mutate((data) => {
      for (const id of ids) {
        const template = data.templates.find((existingTemplate) => existingTemplate.id === id);

        if (!template) {
          // TODO: Localise error messages and use ExtensionError instead
          throw new Error(`Could not find Template: '${id}'`);
        }

        template.enabled = enabled;
      }

      return data;
    });
  }

  /**
   * Moves the template with the given `id` to `targetIndex`, preserving the relative order of every other template.
   *
   * Template order is significant as it drives the order in which templates are listed in the popup and context menu,
   * replacing the legacy `index` field.
   */
  async moveTemplate(id: string, targetIndex: number): Promise<void> {
    await this.repository.mutate((data) => {
      const currentIndex = data.templates.findIndex((template) => template.id === id);

      if (currentIndex < 0) {
        // TODO: Localise error messages and use ExtensionError instead
        throw new Error(`Could not find Template: '${id}'`);
      }

      const safeIndex = Math.max(0, Math.min(targetIndex, data.templates.length - 1));
      if (safeIndex === currentIndex) {
        return data;
      }

      const [template] = data.templates.splice(currentIndex, 1);
      data.templates.splice(safeIndex, 0, template);

      return data;
    });
  }

  /**
   * Moves any number of templates to the top or bottom of the entire template list in a single write, preserving
   * their relative order among themselves as well as the relative order of every other (unselected) template.
   *
   * This operates on the full, unfiltered and unpaginated template list, since template order is significant
   * globally (see {@link moveTemplate}), not just within whatever subset happens to be visible in the UI at the time.
   */
  async moveTemplates(ids: readonly string[], position: 'top' | 'bottom'): Promise<void> {
    if (!ids.length) {
      return;
    }

    await this.repository.mutate((data) => {
      const movedIds = new Set(ids);
      const moved = data.templates.filter((template) => movedIds.has(template.id));

      if (moved.length !== movedIds.size) {
        // TODO: Localise error messages and use ExtensionError instead
        throw new Error('Could not find one or more Templates');
      }

      const remaining = data.templates.filter((template) => !movedIds.has(template.id));
      const reordered = position === 'top' ? [...moved, ...remaining] : [...remaining, ...moved];

      // Nothing to do if every selected template is already at the requested end, in the same relative order
      if (reordered.every((template, index) => template.id === data.templates[index].id)) {
        return data;
      }

      data.templates = reordered;

      return data;
    });
  }

  /**
   * Serializes `templates` into a base64-encoded document suitable for sharing or backup.
   *
   * Predefined templates are projected using their resolved (localised) title and description so that they remain
   * meaningful once imported, where they become ordinary user-defined templates.
   */
  exportTemplates(templates: readonly Template[]): string {
    const transfer: TemplateTransfer = {
      templates: templates.map((template) => ({
        content: template.content,
        description: this.getTemplateDescription(template),
        enabled: template.enabled,
        shortcut: template.shortcut,
        title: this.getTemplateTitle(template),
      })),
      version: TEMPLATE_TRANSFER_VERSION,
    };

    return encodeBase64Utf8(JSON.stringify(transfer, null, 2));
  }

  /**
   * Imports the previously parsed `templates` as new user-defined templates.
   *
   * Nothing is overwritten; importing always adds, so a template that clashes with an existing one simply results in a
   * duplicate, which the user is free to remove.
   */
  async importTemplates(templates: readonly TemplateTransferTemplate[]): Promise<Template[]> {
    return this.createTemplates(
      templates.map((template) => ({
        content: template.content,
        description: template.description || null,
        enabled: template.enabled,
        shortcut: template.shortcut || null,
        title: template.title,
      })),
    );
  }

  /**
   * Parses `value` - as produced by {@link exportTemplates} - into the templates that it contains, without importing
   * them, so that the user can review and select a subset first.
   *
   * `value` is expected to be base64-encoded but raw JSON is also accepted, as is a bare array of templates, so that a
   * hand-written or legacy document is not rejected out of hand.
   */
  parseTemplates(value: string): TemplateTransferTemplate[] {
    const json = TemplateService.decodeTransfer(value);
    let parsed: unknown;

    try {
      parsed = JSON.parse(json);
    } catch {
      // TODO: Localise error messages and use ExtensionError instead
      throw new Error('Templates could not be read as they are not valid base64-encoded JSON');
    }

    const transfer = validateSchema(
      templateTransferSchema,
      Array.isArray(parsed) ? { templates: parsed, version: TEMPLATE_TRANSFER_VERSION } : parsed,
      {
        // TODO: Localise error messages and use ExtensionError instead
        general: (error) => new Error(`Templates could not be read: ${error?.message}`),
        undefinedValue: () => new Error('Templates could not be read as they are empty'),
      },
    );

    return transfer.templates;
  }

  async toggleTemplateEnabled(id: string): Promise<Template> {
    const data = await this.repository.get();
    const existingTemplate = data.templates.find((template) => template.id === id);

    if (!existingTemplate) {
      // TODO: Localise error messages and use ExtensionError instead
      throw new Error(`Could not find Template: '${id}'`);
    }

    existingTemplate.enabled = !existingTemplate.enabled;

    await this.repository.set(data);

    return TemplateService.requireTemplate(existingTemplate);
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto): Promise<Template> {
    const data = await this.repository.get();
    const existingTemplate = data.templates.find((template) => template.id === id);

    if (!existingTemplate) {
      // TODO: Localise error messages and use ExtensionError instead
      throw new Error(`Could not find Template: '${id}'`);
    }

    if (existingTemplate.predefined) {
      existingTemplate.enabled = dto.enabled;
      existingTemplate.shortcut = dto.shortcut;
    } else if (!(isUndefined(dto.content) || isUndefined(dto.description) || isUndefined(dto.title))) {
      existingTemplate.content = dto.content;
      existingTemplate.description = dto.description;
      existingTemplate.enabled = dto.enabled;
      existingTemplate.shortcut = dto.shortcut;
      existingTemplate.title = dto.title;
    } else {
      // TODO: Localise error messages and use ExtensionError instead
      throw new Error(`Could not update Template: '${id}'`);
    }

    await this.repository.set(data);

    return TemplateService.requireTemplate(existingTemplate);
  }

  private static generateId(ids: ReadonlySet<string>): string {
    let id: string;

    do {
      id = crypto.randomUUID();
    } while (ids.has(id));

    return id;
  }

  /**
   * Hydrates `template` into its runtime shape.
   *
   * A predefined template only persists the properties that a user can change, so the rest are resolved from the
   * predefined template dictionary. Nothing is returned when a stored predefined template is no longer available,
   * since it can no longer be resolved (and is tidied up by `TemplateDataRepository` on the next update).
   */
  private static toTemplate(template: TemplateDataTemplate): Template | undefined {
    if (!template.predefined) {
      return template;
    }

    const predefinedTemplate = getPredefinedTemplate(template.id);
    if (!predefinedTemplate) {
      return undefined;
    }

    return {
      content: predefinedTemplate.content,
      descriptionKey: predefinedTemplate.descriptionKey,
      enabled: template.enabled,
      id: template.id,
      predefined: true,
      shortcut: template.shortcut,
      titleKey: predefinedTemplate.titleKey,
    };
  }

  private static toTemplates(templates: readonly TemplateDataTemplate[]): Template[] {
    return templates.reduce<Template[]>((acc, template) => {
      const hydratedTemplate = TemplateService.toTemplate(template);
      if (hydratedTemplate) {
        acc.push(hydratedTemplate);
      }
      return acc;
    }, []);
  }

  private static requireTemplate(template: TemplateDataTemplate): Template {
    const hydratedTemplate = TemplateService.toTemplate(template);

    if (!hydratedTemplate) {
      // TODO: Localise error messages and use ExtensionError instead
      throw new Error(`Could not find predefined Template: '${template.id}'`);
    }

    return hydratedTemplate;
  }

  private static decodeTransfer(value: string): string {
    const trimmedValue = value.trim();

    // A document that already looks like JSON is passed through untouched, otherwise it is assumed to be base64
    if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
      return trimmedValue;
    }

    try {
      return decodeBase64Utf8(trimmedValue.replaceAll(/\s/g, ''));
    } catch {
      // TODO: Localise error messages and use ExtensionError instead
      throw new Error('Templates could not be read as they are not valid base64');
    }
  }
}

export type CreateTemplateDto = Omit<TemplateDataTemplateUserDefined, 'id' | 'predefined'>;

export type TemplateActionInfo =
  | {
      readonly mode: TemplateActionMode.Popup;
    }
  | {
      readonly mode: TemplateActionMode.Template;
      readonly template: Template | undefined;
      readonly templateId: string;
    };

export type TemplateContextMenuInfo = {
  // TODO: Is this used?
  readonly autoPasteEnabled: boolean;
  readonly enabled: boolean;
  readonly optionLinkEnabled: boolean;
  readonly templates: readonly Template[];
} & (
  | {
      readonly mode: TemplateContextMenuMode.Menu;
    }
  | {
      readonly mode: TemplateContextMenuMode.Template;
      readonly templateId: string;
    }
);

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

export type UpdateTemplateDto = Pick<TemplateDataTemplateBase, 'enabled' | 'shortcut'> &
  Partial<Pick<TemplateDataTemplateUserDefined, 'content' | 'description' | 'title'>>;
