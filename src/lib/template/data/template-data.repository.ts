import _cloneDeep from 'lodash.clonedeep';
import _isEqual from 'lodash.isequal';
import { DataInstallContext } from 'extension/common/data/data-install-context.model';
import { DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataUpdateContext } from 'extension/common/data/data-update-context.model';
import { DataUpdater } from 'extension/common/data/data-updater';
import { RequiredDataRepository } from 'extension/common/data/data.repository';
import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';
import { TemplateData } from 'extension/template/data/template-data.model';
import { templateDataSchema } from 'extension/template/data/template-data.schema';
import {
  getPredefinedTemplate,
  getPredefinedTemplates,
  toPredefinedTemplateData,
} from 'extension/template/predefined-templates';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';

export const TemplateDataRepositoryToken = Symbol('TemplateDataRepository');

@injectable()
export class TemplateDataRepository extends RequiredDataRepository<TemplateData> implements DataInstaller, DataUpdater {
  constructor(@inject(DataServiceToken) dataService: DataService) {
    super(DataNamespace.Template, templateDataSchema, dataService.sync);
  }

  install(_context: DataInstallContext): Promise<boolean> {
    return this.init(() => {
      const predefinedTemplates = getPredefinedTemplates();

      return {
        action: {
          mode: TemplateActionMode.Popup,
          popup: {
            autoCloseEnabled: true,
            optionLinkEnabled: true,
          },
          templateId: predefinedTemplates.find((template) => template.enabled)?.id ?? predefinedTemplates[0]?.id ?? '',
        },
        contextMenu: {
          autoPasteEnabled: false,
          enabled: true,
          mode: TemplateContextMenuMode.Menu,
          optionLinkEnabled: true,
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
        templates: predefinedTemplates.map(toPredefinedTemplateData),
      };
    });
  }

  async update(_context: DataUpdateContext): Promise<boolean> {
    const data = await this.get();

    if (this.updatePredefinedTemplates(data)) {
      await this.set(data);
      return true;
    }

    return false;
  }

  private updatePredefinedTemplates(data: TemplateData): boolean {
    const existingPredefinedIds = new Set<string>();
    const predefinedTemplates = getPredefinedTemplates();
    const dataTemplatesClone = _cloneDeep(data.templates);

    data.templates = data.templates
      // Remove any previously stored predefined template that is no longer available
      .filter((template) => !template.predefined || !!getPredefinedTemplate(template.id))
      // Reduce any previously stored predefined template to only the properties that are still persisted, preserving
      // those that the user controls
      .map((template) => {
        if (template.predefined) {
          existingPredefinedIds.add(template.id);
          return {
            enabled: template.enabled,
            id: template.id,
            predefined: true as const,
            shortcut: template.shortcut,
          };
        }
        return template;
      })
      // Add any predefined template not previously stored
      .concat(
        predefinedTemplates.filter((template) => !existingPredefinedIds.has(template.id)).map(toPredefinedTemplateData),
      );

    const actionTemplateIdExists = data.templates.some((template) => template.id === data.action.templateId);
    if (!actionTemplateIdExists) {
      data.action.templateId = data.templates.find((template) => template.enabled)?.id ?? data.templates[0]?.id ?? '';
    }

    return !(_isEqual(dataTemplatesClone, data.templates) && actionTemplateIdExists);
  }
}
