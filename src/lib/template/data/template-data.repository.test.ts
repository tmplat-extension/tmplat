import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type DataInstallContext } from 'extension/common/data/data-install-context.model';
import { type DataUpdateContext } from 'extension/common/data/data-update-context.model';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { ValidationService } from 'extension/common/validation/validation.service';
import { TemplateCollectionRepository } from 'extension/template/data/template-collection.repository';
import { TemplateDataRepository } from 'extension/template/data/template-data.repository';
import { TemplateSettingsSchema } from 'extension/template/data/template-data.schema';
import { getPredefinedTemplates } from 'extension/template/predefined-templates';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';
import { asDataService, FakeDataService } from 'extension/test/data-service.fake';
import { createLoggingServiceMock } from 'extension/test/logger.mock';

const installContext = {} as DataInstallContext;
const updateContext = {} as DataUpdateContext;

describe('TemplateDataRepository', () => {
  let collectionRepository: TemplateCollectionRepository;
  let dataService: FakeDataService;
  let repository: TemplateDataRepository;

  beforeEach(() => {
    dataService = new FakeDataService();
    const logging = createLoggingServiceMock() as unknown as LoggingService;
    const validationService = new ValidationService(createLoggingServiceMock() as unknown as LoggingService);
    collectionRepository = new TemplateCollectionRepository(asDataService(dataService), logging, validationService);
    repository = new TemplateDataRepository(
      asDataService(dataService),
      logging,
      validationService,
      collectionRepository,
    );
  });

  describe('install', () => {
    it('installs schema-valid default data', async () => {
      const installed = await repository.install(installContext);

      expect(installed).toBe(true);
      expect(TemplateSettingsSchema.safeParse(await repository.get()).success).toBe(true);
    });

    /*
     * The installers run concurrently, so this one cannot read the collection to pick a default - it derives the id
     * from the predefined templates this build ships, which is what the collection installer seeds itself from.
     */
    it('points the default action at an enabled predefined template', async () => {
      await repository.install(installContext);
      await collectionRepository.install(installContext);

      const { action } = await repository.get();
      const actionTemplate = await collectionRepository.getItem(action.templateId!);
      expect(actionTemplate?.enabled).toBe(true);
    });

    it('stores settings in sync storage, leaving the collection to local', async () => {
      await repository.install(installContext);

      await expect(dataService.sync.getOptional('template')).resolves.toBeDefined();
      await expect(dataService.local.getOptional('template')).resolves.toBeUndefined();
    });

    it('does not store templates alongside the settings', async () => {
      await repository.install(installContext);

      expect(await repository.get()).not.toHaveProperty('templates');
    });

    it('does not overwrite existing data', async () => {
      await repository.install(installContext);
      const before = await repository.get();

      const installed = await repository.install(installContext);

      expect(installed).toBe(false);
      await expect(repository.get()).resolves.toEqual(before);
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      await collectionRepository.install(installContext);
    });

    it('reports no change immediately after a fresh install', async () => {
      await repository.install(installContext);

      await expect(repository.update(updateContext)).resolves.toBe(false);
    });

    it('repairs a dangling action templateId', async () => {
      await repository.install(installContext);
      await repository.mutate((data) => {
        data.action.templateId = 'does-not-exist';
        return data;
      });

      const changed = await repository.update(updateContext);

      expect(changed).toBe(true);
      const { action } = await repository.get();
      await expect(collectionRepository.getItem(action.templateId!)).resolves.toBeDefined();
    });

    it('leaves an action templateId that still names a stored template', async () => {
      await repository.install(installContext);
      const id = getPredefinedTemplates()[0].id;
      await repository.mutate((data) => {
        data.action.templateId = id;
        return data;
      });

      await expect(repository.update(updateContext)).resolves.toBe(false);
      await expect(repository.get()).resolves.toMatchObject({ action: { templateId: id } });
    });

    it('repairs a dangling context menu templateId', async () => {
      await repository.install(installContext);
      await repository.mutate((data) => {
        data.contextMenu.templateId = 'does-not-exist';
        return data;
      });

      const changed = await repository.update(updateContext);

      expect(changed).toBe(true);
      const { contextMenu } = await repository.get();
      await expect(collectionRepository.getItem(contextMenu.templateId!)).resolves.toBeDefined();
    });

    /*
     * The context menu used to borrow `action.templateId`, so the first update after it gained its own has to inherit
     * the template the user actually chose rather than silently re-pointing the menu at the default.
     */
    it('adopts the action templateId for a context menu already set to template mode', async () => {
      await repository.install(installContext);
      const id = getPredefinedTemplates()[2].id;
      await repository.mutate((data) => {
        data.action.templateId = id;
        data.contextMenu.mode = TemplateContextMenuMode.Template;
        data.contextMenu.templateId = null;
        return data;
      });

      await expect(repository.update(updateContext)).resolves.toBe(true);
      await expect(repository.get()).resolves.toMatchObject({ contextMenu: { templateId: id } });
    });

    it('does not adopt the action templateId for a context menu in menu mode', async () => {
      await repository.install(installContext);
      const id = getPredefinedTemplates()[2].id;
      await repository.mutate((data) => {
        data.action.templateId = id;
        data.contextMenu.templateId = null;
        return data;
      });

      await repository.update(updateContext);

      const { contextMenu } = await repository.get();
      expect(contextMenu.templateId).not.toBe(id);
      await expect(collectionRepository.getItem(contextMenu.templateId!)).resolves.toBeDefined();
    });

    it('persists the repaired data through set', async () => {
      await repository.install(installContext);
      await repository.mutate((data) => {
        data.action.templateId = 'does-not-exist';
        return data;
      });
      const setSpy = vi.spyOn(repository, 'set');

      await repository.update(updateContext);

      expect(setSpy).toHaveBeenCalledTimes(1);
    });
  });
});
