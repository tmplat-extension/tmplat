import { isEqual } from 'es-toolkit';
import { type DataInstallContext } from 'extension/common/data/data-install-context.model';
import { type DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataUpdateContext } from 'extension/common/data/data-update-context.model';
import { type DataUpdater } from 'extension/common/data/data-updater';
import { CollectionDataRepository } from 'extension/common/data/data.repository';
import { type DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { type ValidationService, ValidationServiceToken } from 'extension/common/validation/validation.service';
import { type TemplateDefinition, TemplateDefinitionSchema } from 'extension/template/data/template-data.schema';
import {
  getPredefinedTemplate,
  getPredefinedTemplates,
  toPredefinedTemplate,
} from 'extension/template/predefined-templates';

const TemplateCollectionRepositoryName = 'TemplateCollectionRepository';

export const TemplateCollectionRepositoryToken = Symbol(TemplateCollectionRepositoryName);

/**
 * Stores every template as its own `template:item:<id>` entry in `browser.storage.local`, ordered by `template:index`.
 *
 * Templates used to live inside the `template` namespace in `browser.storage.sync`, which capped the *entire*
 * namespace - settings and all templates together - at the 8,192 byte `QUOTA_BYTES_PER_ITEM` limit, i.e. roughly 21
 * modest templates. Moving them here trades cross-device sync for a 10 MB budget and a per-template size limit.
 */
@injectable()
export class TemplateCollectionRepository
  extends CollectionDataRepository<typeof TemplateDefinitionSchema, TemplateDefinition>
  implements DataInstaller, DataUpdater
{
  constructor(
    @inject(DataServiceToken) dataService: DataService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(ValidationServiceToken) validationService: ValidationService,
  ) {
    super({
      dataStorage: dataService.local,
      getItemId: (template) => template.id,
      logger: logging.getLogger(TemplateCollectionRepositoryName),
      namespace: DataNamespace.Template,
      schema: TemplateDefinitionSchema,
      validationService,
    });
  }

  install(_context: DataInstallContext): Promise<boolean> {
    return this.init(() => getPredefinedTemplates().map(toPredefinedTemplate));
  }

  /**
   * Brings the stored predefined templates back in line with the predefined templates this build ships, and repairs any
   * disagreement between the stored order and the templates that actually exist.
   */
  async update(_context: DataUpdateContext): Promise<boolean> {
    const templates = await this.getItems();
    const existingPredefinedIds = new Set<string>();
    const removableIds: string[] = [];

    for (const template of templates) {
      if (!template.predefined) {
        continue;
      }

      // Remove any previously stored predefined template that is no longer available
      if (getPredefinedTemplate(template.id)) {
        existingPredefinedIds.add(template.id);
      } else {
        removableIds.push(template.id);
      }
    }

    let changed = false;

    if (removableIds.length) {
      await this.removeItems(removableIds);
      changed = true;
    }

    // Reduce any previously stored predefined template to only the properties that are still persisted, preserving
    // those that the user controls
    for (const template of templates) {
      if (!template.predefined || removableIds.includes(template.id)) {
        continue;
      }

      const reduced: TemplateDefinition = {
        enabled: template.enabled,
        id: template.id,
        predefined: true,
        shortcut: template.shortcut,
      };

      if (!isEqual(template, reduced)) {
        // Sequential by design: each update is a read-modify-write of its own item
        // oxlint-disable-next-line no-await-in-loop
        await this.updateItem(template.id, () => reduced);
        changed = true;
      }
    }

    // Add any predefined template not previously stored
    const addedTemplates = getPredefinedTemplates()
      .filter((template) => !existingPredefinedIds.has(template.id))
      .map(toPredefinedTemplate);

    if (addedTemplates.length) {
      await this.addItems(addedTemplates);
      changed = true;
    }

    return (await this.reconcile()) || changed;
  }
}
