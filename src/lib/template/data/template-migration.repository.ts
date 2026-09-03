import { isEqual } from 'es-toolkit';
import {
  type DataRepository,
  type DataRepositoryChangeListener,
  type DataRepositoryInitializer,
  type DataRepositoryMutator,
} from 'extension/common/data/data.repository';
import { inject, injectable } from 'extension/common/di';
import {
  type TemplateCollectionRepository,
  TemplateCollectionRepositoryToken,
} from 'extension/template/data/template-collection.repository';
import {
  type TemplateDataRepository,
  TemplateDataRepositoryToken,
} from 'extension/template/data/template-data.repository';
import { type TemplateDefinition, type TemplateSettings } from 'extension/template/data/template-data.schema';

export const TemplateMigrationRepositoryToken = Symbol('TemplateMigrationRepository');

/**
 * Presents the template settings and the template collection as the single `{ ...settings, templates: [...] }` object
 * that the 1.x data migration steps were written against.
 *
 * The migration steps reason about the whole template list at once - they reorder it by the legacy `index` field and
 * resolve `toolbar.key` against it - which is exactly the shape the storage split removed. Rather than rewrite that
 * logic (and its tests) around per-item writes, the adapter translates one whole-list mutation into the corresponding
 * per-item writes. It exists solely for the legacy migration; ordinary code uses the two repositories directly.
 */
@injectable()
export class TemplateMigrationRepository implements DataRepository<TemplateMigrationData> {
  constructor(
    @inject(TemplateDataRepositoryToken) private readonly settings: TemplateDataRepository,
    @inject(TemplateCollectionRepositoryToken) private readonly templates: TemplateCollectionRepository,
  ) {}

  addChangeListener<OldData = TemplateMigrationData>(
    listener: DataRepositoryChangeListener<TemplateMigrationData, OldData>,
  ): void {
    this.settings.addChangeListener(listener as DataRepositoryChangeListener<TemplateSettings, OldData>);
  }

  async clear(): Promise<void> {
    await this.settings.clear();
    await this.templates.clear();
  }

  async get(): Promise<TemplateMigrationData> {
    const [settings, templates] = await Promise.all([this.settings.get(), this.templates.getItems()]);

    return { ...settings, templates };
  }

  async getOptional(): Promise<TemplateMigrationData | undefined> {
    const settings = await this.settings.getOptional();
    if (settings === undefined) {
      return undefined;
    }

    return { ...settings, templates: await this.templates.getItems() };
  }

  async init(initializer: DataRepositoryInitializer<TemplateMigrationData>): Promise<boolean> {
    if (await this.settings.isNotEmpty()) {
      return false;
    }

    await this.set(await initializer());

    return true;
  }

  async isEmpty(): Promise<boolean> {
    return this.settings.isEmpty();
  }

  async isNotEmpty(): Promise<boolean> {
    return this.settings.isNotEmpty();
  }

  async mutate(mutator: DataRepositoryMutator<TemplateMigrationData>): Promise<boolean> {
    let cancelled = false;
    const data = await this.get();
    const mutated = await mutator(data, () => {
      cancelled = true;
    });

    if (cancelled) {
      return false;
    }

    await this.set(mutated);

    return true;
  }

  /**
   * Writes the settings and reconciles the collection against `templates`.
   *
   * Items are added, removed and updated individually rather than rewritten wholesale so that a template the migration
   * did not touch is not needlessly rewritten - which would otherwise burn through the write rate limit on a user with
   * a large collection.
   */
  async set({ templates, ...settings }: TemplateMigrationData): Promise<void> {
    const existingTemplates = await this.templates.getItems();
    const existingById = new Map(existingTemplates.map((template) => [template.id, template]));
    const nextIds = new Set(templates.map((template) => template.id));

    const removableIds = existingTemplates
      .filter((template) => !nextIds.has(template.id))
      .map((template) => template.id);
    if (removableIds.length) {
      await this.templates.removeItems(removableIds);
    }

    const addedTemplates = templates.filter((template) => !existingById.has(template.id));
    if (addedTemplates.length) {
      await this.templates.addItems(addedTemplates);
    }

    for (const template of templates) {
      const existingTemplate = existingById.get(template.id);

      if (existingTemplate && !isEqual(existingTemplate, template)) {
        // Sequential by design: each update is a read-modify-write of its own item
        // oxlint-disable-next-line no-await-in-loop
        await this.templates.updateItem(template.id, () => template);
      }
    }

    await this.templates.setItemOrder(templates.map((template) => template.id));
    await this.settings.set(settings);
  }
}

export type TemplateMigrationData = TemplateSettings & {
  templates: TemplateDefinition[];
};
