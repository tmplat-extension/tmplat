import { type DataInstallContext } from 'extension/common/data/data-install-context.model';
import { type DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataUpdateContext } from 'extension/common/data/data-update-context.model';
import { type DataUpdater } from 'extension/common/data/data-updater';
import { RequiredDataRepository } from 'extension/common/data/data.repository';
import { type DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { type ValidationService, ValidationServiceToken } from 'extension/common/validation/validation.service';
import {
  type TemplateCollectionRepository,
  TemplateCollectionRepositoryToken,
} from 'extension/template/data/template-collection.repository';
import { type TemplateSettings, TemplateSettingsSchema } from 'extension/template/data/template-data.schema';
import { getPredefinedTemplates } from 'extension/template/predefined-templates';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';
import { resolveTemplateId } from 'extension/template/template.utils';

const TemplateDataRepositoryName = 'TemplateDataRepository';

export const TemplateDataRepositoryToken = Symbol(TemplateDataRepositoryName);

/**
 * Stores the template *settings* in `browser.storage.sync`.
 *
 * Only the settings sync: they are small and bounded, whereas the templates they configure are neither, and live in
 * `browser.storage.local` under `TemplateCollectionRepository`. See MIGRATION-GAPS.md §1.7.
 */
@injectable()
export class TemplateDataRepository
  extends RequiredDataRepository<typeof TemplateSettingsSchema, TemplateSettings>
  implements DataInstaller, DataUpdater
{
  constructor(
    @inject(DataServiceToken) dataService: DataService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(ValidationServiceToken) validationService: ValidationService,
    @inject(TemplateCollectionRepositoryToken) private readonly templates: TemplateCollectionRepository,
  ) {
    super({
      dataStorage: dataService.sync,
      logger: logging.getLogger(TemplateDataRepositoryName),
      namespace: DataNamespace.Template,
      schema: TemplateSettingsSchema,
      validationService,
    });
  }

  install(_context: DataInstallContext): Promise<boolean> {
    return this.init(() => {
      // Derived from the shipped predefined templates rather than from storage, so that this does not depend on the
      // template collection having been installed first - data installers run concurrently
      const predefinedTemplates = getPredefinedTemplates();
      const templateId = resolveTemplateId(predefinedTemplates, null);

      return {
        action: {
          mode: TemplateActionMode.Popup,
          popup: {
            autoCloseEnabled: true,
            optionLinkEnabled: true,
          },
          templateId,
        },
        contextMenu: {
          autoPasteEnabled: false,
          enabled: true,
          mode: TemplateContextMenuMode.Menu,
          optionLinkEnabled: true,
          templateId,
        },
        link: {
          target: false,
          title: false,
        },
        markdown: {
          inline: false,
        },
        shortcuts: {
          autoPasteEnabled: false,
          enabled: true,
        },
      };
    });
  }

  /**
   * Repairs `action.templateId` and `contextMenu.templateId` when either names a template that no longer exists.
   *
   * The settings sync across devices but the templates they reference do not, so this also covers arriving at a device
   * whose local templates never included the referenced one.
   *
   * The context menu used to borrow `action.templateId` rather than holding its own, so a menu already configured to
   * show a single template inherits that choice here rather than being silently re-pointed at another template.
   */
  async update(_context: DataUpdateContext): Promise<boolean> {
    return this.mutate(async (data, cancel) => {
      const templates = await this.templates.getItems();
      const actionTemplateId = resolveTemplateId(templates, data.action.templateId);
      const contextMenuTemplateId = resolveTemplateId(
        templates,
        data.contextMenu.templateId ??
          (data.contextMenu.mode === TemplateContextMenuMode.Template ? data.action.templateId : null),
      );

      if (actionTemplateId === data.action.templateId && contextMenuTemplateId === data.contextMenu.templateId) {
        cancel();
        return data;
      }

      data.action.templateId = actionTemplateId;
      data.contextMenu.templateId = contextMenuTemplateId;

      return data;
    });
  }
}
