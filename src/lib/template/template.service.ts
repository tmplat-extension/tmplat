import { decodeBase64Utf8, encodeBase64Utf8 } from 'extension/common/codec/base64.utils';
import { inject, injectable } from 'extension/common/di';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { type ValidationService, ValidationServiceToken } from 'extension/common/validation/validation.service';
import {
  type TemplateCollectionRepository,
  TemplateCollectionRepositoryToken,
} from 'extension/template/data/template-collection.repository';
import {
  type TemplateDataRepository,
  TemplateDataRepositoryToken,
} from 'extension/template/data/template-data.repository';
import {
  type TemplateBaseDefinition,
  type TemplateDefinition,
  type TemplateSettings,
  type TemplateUserDefined as TemplateUserDefinedData,
} from 'extension/template/data/template-data.schema';
import { getPredefinedTemplate } from 'extension/template/predefined-templates';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';
import { type TemplateIdGenerator, TemplateIdGeneratorToken } from 'extension/template/template-id-generator';
import {
  TEMPLATE_TRANSFER_VERSION,
  type TemplateTransfer,
  type TemplateTransferData,
  TemplateTransferDataSchema,
} from 'extension/template/template-transfer.schema';
import { type Template, type TemplatePredefined } from 'extension/template/template.model';
import { resolveTemplateId } from 'extension/template/template.utils';

const TemplateServiceName = 'TemplateService';

export const TemplateServiceToken = Symbol(TemplateServiceName);

@injectable()
export class TemplateService {
  private readonly logger: Logger;

  constructor(
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(TemplateDataRepositoryToken) private readonly repository: TemplateDataRepository,
    @inject(TemplateCollectionRepositoryToken) private readonly templates: TemplateCollectionRepository,
    @inject(TemplateIdGeneratorToken) private readonly idGenerator: TemplateIdGenerator,
    @inject(ValidationServiceToken) private readonly validationService: ValidationService,
  ) {
    this.logger = logging.getLogger(TemplateServiceName);
  }

  /**
   * Registers `listener` to be notified whenever the settings or any template change.
   *
   * The listener is passed nothing and is expected to re-read what it needs. Settings and templates now live in
   * separate storage areas, so a change to one cannot carry a consistent snapshot of the other, and composing one
   * synchronously here would hand out a stale view.
   */
  addChangeListener(listener: TemplateServiceChangeListener) {
    this.repository.addChangeListener(() => listener());
    this.templates.addChangeListener(() => listener());
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
    const existingTemplates = await this.templates.getItems();
    const ids = new Set(existingTemplates.map((template) => template.id));
    const shortcuts = new Set(
      existingTemplates.map((template) => template.shortcut).filter((shortcut): shortcut is string => shortcut != null),
    );
    const createdTemplates: TemplateUserDefinedData[] = [];

    for (const dto of dtos) {
      const shortcut = dto.shortcut && !shortcuts.has(dto.shortcut) ? dto.shortcut : null;
      if (shortcut) {
        shortcuts.add(shortcut);
      }

      const id = this.idGenerator.generate(ids);
      ids.add(id);

      createdTemplates.push({
        ...dto,
        id,
        predefined: false,
        shortcut,
      });
    }

    await this.templates.addItems(createdTemplates);

    return createdTemplates;
  }

  /**
   * Describes what the toolbar button should do, resolving `action.templateId` where the user has asked for a single
   * template rather than the popup.
   *
   * `action.templateId` being unset is *not* treated as an error, because it only happens when there is no template to
   * point at: the options page seeds a selection whenever the mode is switched to `Template`, and
   * `TemplateDataRepository.update` re-points a reference whose template has gone. Both fall back to the first
   * template, so only an empty collection can leave it `null` - and the popup, which can at least show an empty list
   * and a link to the options page, is the only thing left to offer.
   *
   * A reference that names a template which does *not* exist is a different matter and does throw. That means the
   * repair above did not run or did not hold, so the settings are broken rather than merely unset, and quietly
   * falling back to the popup would hide that while looking like the user's own configuration.
   */
  private createTemplateActionInfo(data: TemplateSettings, templates: readonly Template[]): TemplateActionInfo {
    if (data.action.mode === TemplateActionMode.Popup || !data.action.templateId) {
      return { mode: TemplateActionMode.Popup };
    }

    const template = templates.find((p) => p.id === data.action.templateId);
    if (!template) {
      throw ExtensionError.from('TPL404000', data.action.templateId);
    }

    return {
      mode: TemplateActionMode.Template,
      template,
      templateId: data.action.templateId,
    };
  }

  /**
   * Describes what the context menu should contain, resolving its own `contextMenu.templateId` where the user has
   * asked for a single template rather than a menu.
   *
   * That id used to be borrowed from the toolbar button, which meant choosing a template for one silently changed the
   * other and left the context menu with no way to pick its own. `TemplateDataRepository.update` seeds the dedicated
   * id from the toolbar button's for anyone configured before the split.
   *
   * The unset and dangling cases are handled exactly as in `createTemplateActionInfo`, for the same reasons.
   */
  private createTemplateContextMenuInfo(
    data: TemplateSettings,
    templates: readonly Template[],
  ): TemplateContextMenuInfo {
    const contextMenuInfo = {
      autoPasteEnabled: data.contextMenu.autoPasteEnabled,
      enabled: data.contextMenu.enabled,
      optionLinkEnabled: data.contextMenu.optionLinkEnabled,
      templates: templates.filter((template) => template.enabled),
    };
    if (data.contextMenu.mode === TemplateContextMenuMode.Menu || !data.contextMenu.templateId) {
      return {
        ...contextMenuInfo,
        mode: TemplateContextMenuMode.Menu,
      };
    }

    const template = templates.find((p) => p.id === data.contextMenu.templateId);
    if (!template) {
      throw ExtensionError.from('TPL404000', data.contextMenu.templateId);
    }

    return {
      ...contextMenuInfo,
      mode: TemplateContextMenuMode.Template,
      template,
      templateId: data.contextMenu.templateId,
    };
  }

  private createTemplatePopupInfo(data: TemplateSettings, templates: readonly Template[]): TemplatePopupInfo {
    return {
      action: {
        autoCloseEnabled: data.action.popup.autoCloseEnabled,
        optionLinkEnabled: data.action.popup.optionLinkEnabled,
      },
      shortcuts: {
        enabled: data.shortcuts.enabled,
      },
      templates: templates.filter((template) => template.enabled),
    };
  }

  /**
   * Describes what the content scripts need in order to decide whether a keypress is one of ours.
   *
   * Only enabled templates contribute a shortcut. The list exists purely so a content script can tell whether to
   * swallow a keypress, and a disabled template must not swallow one: the popup and context menu both hide disabled
   * templates, so a shortcut that still fired would be the one way to run something the user has switched off.
   */
  private createTemplateShortcutInfo(data: TemplateSettings, templates: readonly Template[]): TemplateShortcutInfo {
    return {
      autoPasteEnabled: data.shortcuts.autoPasteEnabled,
      enabled: data.shortcuts.enabled,
      shortcuts: templates
        .filter((template) => template.enabled)
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
    const [data, templates] = await this.load();

    return this.createTemplateActionInfo(data, templates);
  }

  async getTemplateContextMenuInfo(): Promise<TemplateContextMenuInfo> {
    const [data, templates] = await this.load();

    return this.createTemplateContextMenuInfo(data, templates);
  }

  async getTemplatePopupInfo(): Promise<TemplatePopupInfo> {
    const [data, templates] = await this.load();

    return this.createTemplatePopupInfo(data, templates);
  }

  async getTemplateShortcutInfo(): Promise<TemplateShortcutInfo> {
    const [data, templates] = await this.load();

    return this.createTemplateShortcutInfo(data, templates);
  }

  async getTemplates(): Promise<Template[]> {
    return TemplateService.toTemplates(await this.templates.getItems());
  }

  /** Reads the settings and the templates together, since every `*Info` view is composed from both. */
  private async load(): Promise<[TemplateSettings, Template[]]> {
    const [data, templates] = await Promise.all([this.repository.get(), this.templates.getItems()]);

    return [data, TemplateService.toTemplates(templates)];
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

    const templates = await this.templates.getItems();
    const removableIds = new Set<string>();

    for (const id of ids) {
      const template = templates.find((existingTemplate) => existingTemplate.id === id);

      if (!template) {
        throw ExtensionError.from('TPL404000', id);
      }
      if (template.predefined) {
        throw ExtensionError.from('TPL405000', id);
      }

      removableIds.add(id);
    }

    await this.templates.removeItems([...removableIds]);

    // Both ids live in the settings but reference a template, so removing their target has to repair them
    await this.repository.mutate((data, cancel) => {
      const affects = (templateId: string | null) => !!templateId && removableIds.has(templateId);
      if (!(affects(data.action.templateId) || affects(data.contextMenu.templateId))) {
        cancel();
        return data;
      }

      const remaining = templates.filter((template) => !removableIds.has(template.id));
      if (affects(data.action.templateId)) {
        data.action.templateId = resolveTemplateId(remaining, null);
      }
      if (affects(data.contextMenu.templateId)) {
        data.contextMenu.templateId = resolveTemplateId(remaining, null);
      }

      return data;
    });
  }

  /**
   * Enables or disables any number of templates - predefined or otherwise.
   *
   * Every id is resolved before anything is written. Each template is now its own storage item, so writing as they are
   * visited would leave an unknown id part way through the list having already flipped the ones before it.
   */
  async setTemplatesEnabled(ids: readonly string[], enabled: boolean): Promise<void> {
    if (!ids.length) {
      return;
    }

    const existingIds = new Set(await this.templates.getItemIds());

    for (const id of ids) {
      if (!existingIds.has(id)) {
        throw ExtensionError.from('TPL404000', id);
      }
    }

    for (const id of ids) {
      // Sequential by design: each update is a read-modify-write of its own item, and running them concurrently
      // would interleave those reads
      // oxlint-disable-next-line no-await-in-loop
      await this.updateTemplateItem(id, (template) => {
        template.enabled = enabled;
        return template;
      });
    }
  }

  /**
   * Moves the template with the given `id` to `targetIndex`, preserving the relative order of every other template.
   *
   * Template order is significant as it drives the order in which templates are listed in the popup and context menu,
   * replacing the legacy `index` field.
   */
  async moveTemplate(id: string, targetIndex: number): Promise<void> {
    const ids = await this.templates.getItemIds();
    const currentIndex = ids.indexOf(id);

    if (currentIndex < 0) {
      throw ExtensionError.from('TPL404000', id);
    }

    const safeIndex = Math.max(0, Math.min(targetIndex, ids.length - 1));
    if (safeIndex === currentIndex) {
      return;
    }

    ids.splice(currentIndex, 1);
    ids.splice(safeIndex, 0, id);

    await this.templates.setItemOrder(ids);
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

    const currentIds = await this.templates.getItemIds();
    const movedIds = new Set(ids);
    const moved = currentIds.filter((id) => movedIds.has(id));

    if (moved.length !== movedIds.size) {
      throw ExtensionError.from('TPL404010');
    }

    const remaining = currentIds.filter((id) => !movedIds.has(id));
    const reordered = position === 'top' ? [...moved, ...remaining] : [...remaining, ...moved];

    // Nothing to do if every selected template is already at the requested end, in the same relative order
    if (reordered.every((id, index) => id === currentIds[index])) {
      return;
    }

    await this.templates.setItemOrder(reordered);
  }

  /**
   * Serializes `templates` into a base64-encoded document suitable for sharing or backup.
   *
   * Predefined templates are projected using their resolved (localised) title and description so that they remain
   * meaningful once imported, where they become ordinary user-defined templates.
   */
  exportTemplates(templates: readonly Template[]): string {
    const transfer: TemplateTransferData = {
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
  async importTemplates(templates: readonly TemplateTransfer[]): Promise<Template[]> {
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
  parseTemplates(value: string): TemplateTransfer[] {
    const json = TemplateService.decodeTransfer(value);
    let parsed: unknown;

    try {
      parsed = JSON.parse(json);
    } catch (e) {
      throw ExtensionError.fromCause(e, 'TPL422010');
    }

    const transfer = this.validationService.validateSchema(
      Array.isArray(parsed) ? { templates: parsed, version: TEMPLATE_TRANSFER_VERSION } : parsed,
      TemplateTransferDataSchema,
      {
        code: 'TPL422020',
        parentLogger: this.logger,
      },
    );

    return transfer.templates;
  }

  async toggleTemplateEnabled(id: string): Promise<Template> {
    return this.updateTemplateItem(id, (template) => {
      template.enabled = !template.enabled;
      return template;
    });
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto): Promise<Template> {
    return this.updateTemplateItem(id, (existingTemplate) => {
      if (existingTemplate.predefined) {
        existingTemplate.enabled = dto.enabled;
        existingTemplate.shortcut = dto.shortcut;
      } else if (!(dto.content === undefined || dto.description === undefined || dto.title === undefined)) {
        existingTemplate.content = dto.content;
        existingTemplate.description = dto.description;
        existingTemplate.enabled = dto.enabled;
        existingTemplate.shortcut = dto.shortcut;
        existingTemplate.title = dto.title;
      } else {
        throw ExtensionError.from('TPL400000', id);
      }

      return existingTemplate;
    });
  }

  /**
   * Applies `mutator` to the single stored template named by `id`, returning its hydrated form.
   *
   * Every edit goes through here so that it writes only that template's own key, which is what stops a concurrent edit
   * to a different template from being clobbered.
   */
  private async updateTemplateItem(
    id: string,
    mutator: (template: TemplateDefinition) => TemplateDefinition,
  ): Promise<Template> {
    let updatedTemplate: TemplateDefinition | undefined;

    try {
      await this.templates.updateItem(id, (template) => {
        updatedTemplate = mutator(template);
        return updatedTemplate;
      });
    } catch (e) {
      if (e instanceof ExtensionError && e.code === 'DAT404000') {
        throw ExtensionError.fromCause(e, 'TPL404000', id);
      }
      throw e;
    }

    return TemplateService.requireTemplate(updatedTemplate as TemplateDefinition);
  }

  /**
   * Hydrates `template` into its runtime shape.
   *
   * A predefined template only persists the properties that a user can change, so the rest are resolved from the
   * predefined template dictionary. Nothing is returned when a stored predefined template is no longer available,
   * since it can no longer be resolved (and is tidied up by `TemplateDataRepository` on the next update).
   */
  private static toTemplate(template: TemplateDefinition): Template | undefined {
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

  private static toTemplates(templates: readonly TemplateDefinition[]): Template[] {
    return templates.reduce<Template[]>((acc, template) => {
      const hydratedTemplate = TemplateService.toTemplate(template);
      if (hydratedTemplate) {
        acc.push(hydratedTemplate);
      }
      return acc;
    }, []);
  }

  private static requireTemplate(template: TemplateDefinition): Template {
    const hydratedTemplate = TemplateService.toTemplate(template);

    if (!hydratedTemplate) {
      throw ExtensionError.from('TPL404100', template.id);
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
    } catch (e) {
      throw ExtensionError.fromCause(e, 'TPL422000');
    }
  }
}

export type CreateTemplateDto = Omit<TemplateUserDefinedData, 'id' | 'predefined'>;

export type TemplateActionInfo =
  | {
      readonly mode: TemplateActionMode.Popup;
    }
  | {
      readonly mode: TemplateActionMode.Template;
      readonly template: Template;
      readonly templateId: string;
    };

export type TemplateContextMenuInfo = {
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
      /**
       * Resolved even when disabled, so that `ContextMenuService` can tell "disabled" apart from "missing" - the
       * single menu item it creates is not drawn from `templates`, which only lists what a menu would offer.
       */
      readonly template: Template;
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

/**
 * Notified that the template settings or templates changed, without saying what changed.
 *
 * They are stored in separate areas, so no single argument could describe both consistently; a listener re-reads
 * whichever it needs.
 */
export type TemplateServiceChangeListener = () => void;

export type TemplateShortcutInfo = {
  readonly autoPasteEnabled: boolean;
  readonly enabled: boolean;
  readonly shortcuts: readonly string[];
};

export type UpdateTemplateDto = Pick<TemplateBaseDefinition, 'enabled' | 'shortcut'> &
  Partial<Pick<TemplateUserDefinedData, 'content' | 'description' | 'title'>>;
