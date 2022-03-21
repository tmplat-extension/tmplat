import { DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataUpdater } from 'extension/common/data/data-updater';
import { DataRepository } from 'extension/common/data/data.repository';
import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';
import { TemplateData, TemplateDataTemplate } from 'extension/template/data/template-data.model';
import { templateDataSchema } from 'extension/template/data/template-data.schema';
import { getPredefinedTemplates } from 'extension/template/predefined-templates';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';

export const TemplateDataRepositoryToken = Symbol('TemplateDataRepository');

@injectable()
export class TemplateDataRepository extends DataRepository<TemplateData> implements DataInstaller, DataUpdater {
  constructor(@inject(DataServiceToken) dataService: DataService) {
    super(DataNamespace.Template, templateDataSchema, dataService.sync);
  }

  install(): Promise<void> {
    const templates: TemplateDataTemplate[] = [];

    TemplateDataRepository.appendPredefinedTemplates(templates);

    return this.set({
      action: {
        mode: TemplateActionMode.Popup,
        popup: {
          autoCloseEnabled: true,
          optionLinkEnabled: true,
        },
        templateId: templates.find((template) => template.predefined)!.id,
      },
      contextMenu: {
        autoPasteEnabled: false,
        enabled: true,
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
      templates,
    });
  }

  isInstalled(): Promise<boolean> {
    return this.isNotEmpty();
  }

  async update(): Promise<void> {
    const data = await this.get();

    if (TemplateDataRepository.appendPredefinedTemplates(data.templates)) {
      await this.set(data);
    }
  }

  private static appendPredefinedTemplates(templates: TemplateDataTemplate[]): boolean {
    const originalTemplateCount = templates.length;
    const ids = new Set(templates.map((template) => template.id));

    getPredefinedTemplates().forEach((template) => {
      if (!ids.has(template.id)) {
        templates.push(template);
      }
    });

    return templates.length > originalTemplateCount;
  }
}
