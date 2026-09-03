import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { RequiredDataRepository } from 'extension/common/data/data.repository';
import { ValidationService } from 'extension/common/validation/validation.service';
import { type TemplateDataRepository } from 'extension/template/data/template-data.repository';
import {
  type TemplateData,
  TemplateDataSchema,
  type TemplateDataTemplate,
} from 'extension/template/data/template-data.schema';
import { getPredefinedTemplates } from 'extension/template/predefined-templates';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';
import { TemplateService } from 'extension/template/template.service';
import { FakeDataStorage } from 'extension/test/data-storage.fake';
import { asIntlService, createIntlServiceMock } from 'extension/test/intl.mock';
import { createLoggingServiceMock } from 'extension/test/logger.mock';

const PREDEFINED_ID = 'PREDEFINED.00001';

const userTemplate = (overrides: Partial<TemplateDataTemplate> = {}): TemplateDataTemplate =>
  ({
    content: '{url}',
    description: null,
    enabled: true,
    id: 'user-1',
    predefined: false,
    shortcut: null,
    title: 'User 1',
    ...overrides,
  }) as TemplateDataTemplate;

const predefinedTemplate = (overrides: Partial<TemplateDataTemplate> = {}): TemplateDataTemplate =>
  ({
    enabled: true,
    id: PREDEFINED_ID,
    predefined: true,
    shortcut: null,
    ...overrides,
  }) as TemplateDataTemplate;

const createData = (overrides: Partial<TemplateData> = {}): TemplateData => ({
  action: {
    mode: TemplateActionMode.Popup,
    popup: { autoCloseEnabled: true, optionLinkEnabled: true },
    templateId: null,
  },
  contextMenu: {
    autoPasteEnabled: false,
    enabled: true,
    mode: TemplateContextMenuMode.Menu,
    optionLinkEnabled: true,
  },
  link: { target: true, title: true },
  markdown: { inline: false },
  shortcuts: { autoPasteEnabled: false, enabled: true },
  templates: [],
  ...overrides,
});

// Backed by a real repository over the in-memory storage fake rather than a hand-rolled stub, so that schema
// validation and the read-modify-write semantics of `mutate` are genuinely exercised.
class TestTemplateRepository extends RequiredDataRepository<typeof TemplateDataSchema> {
  constructor(storage: FakeDataStorage) {
    super({
      dataStorage: storage,
      namespace: DataNamespace.Template,
      schema: TemplateDataSchema,
      validationService: new ValidationService(createLoggingServiceMock() as never),
    });
  }
}

describe('TemplateService', () => {
  let service: TemplateService;
  let storage: FakeDataStorage;

  const givenData = (data: TemplateData) => {
    storage = new FakeDataStorage({ [DataNamespace.Template]: data });

    service = new TemplateService(
      asIntlService(createIntlServiceMock()),
      createLoggingServiceMock() as never,
      new TestTemplateRepository(storage) as unknown as TemplateDataRepository,
      new ValidationService(createLoggingServiceMock() as never),
    );
  };

  const storedData = (): TemplateData => storage.snapshot()[DataNamespace.Template] as TemplateData;
  const storedIds = (): string[] => storedData().templates.map((template) => template.id);

  beforeEach(() => {
    givenData(createData());
  });

  describe('createTemplates', () => {
    it('assigns a generated id and marks the template as user-defined', async () => {
      const [created] = await service.createTemplates([
        { content: '{title}', description: null, enabled: true, shortcut: null, title: 'T' },
      ]);

      expect(created.id).toEqual(expect.any(String));
      expect(created.predefined).toBe(false);
      expect(storedIds()).toEqual([created.id]);
    });

    it('creates every template in a single write', async () => {
      const created = await service.createTemplates([
        { content: 'a', description: null, enabled: true, shortcut: null, title: 'A' },
        { content: 'b', description: null, enabled: true, shortcut: null, title: 'B' },
      ]);

      expect(created).toHaveLength(2);
      expect(storedIds()).toHaveLength(2);
    });

    it('assigns a distinct id to each template', async () => {
      const created = await service.createTemplates([
        { content: 'a', description: null, enabled: true, shortcut: null, title: 'A' },
        { content: 'b', description: null, enabled: true, shortcut: null, title: 'B' },
      ]);

      expect(new Set(created.map((template) => template.id)).size).toBe(2);
    });

    it('keeps a requested shortcut that is not already taken', async () => {
      const [created] = await service.createTemplates([
        { content: 'a', description: null, enabled: true, shortcut: 'Z', title: 'A' },
      ]);

      expect(created.shortcut).toBe('Z');
    });

    it('discards a shortcut already assigned to an existing template', async () => {
      givenData(createData({ templates: [userTemplate({ shortcut: 'Z' })] }));

      const [created] = await service.createTemplates([
        { content: 'a', description: null, enabled: true, shortcut: 'Z', title: 'A' },
      ]);

      expect(created.shortcut).toBeNull();
    });

    it('discards a shortcut duplicated within the same batch, keeping the first', async () => {
      const created = await service.createTemplates([
        { content: 'a', description: null, enabled: true, shortcut: 'Z', title: 'A' },
        { content: 'b', description: null, enabled: true, shortcut: 'Z', title: 'B' },
      ]);

      expect(created.map((template) => template.shortcut)).toEqual(['Z', null]);
    });

    it('appends to the existing templates rather than replacing them', async () => {
      givenData(createData({ templates: [userTemplate()] }));

      await service.createTemplate({ content: 'a', description: null, enabled: true, shortcut: null, title: 'A' });

      expect(storedIds()).toHaveLength(2);
      expect(storedIds()[0]).toBe('user-1');
    });
  });

  describe('getTemplates', () => {
    it('hydrates a predefined template from the predefined dictionary', async () => {
      givenData(createData({ templates: [predefinedTemplate({ shortcut: 'Q' })] }));

      const [template] = await service.getTemplates();
      const predefined = getPredefinedTemplates().find((p) => p.id === PREDEFINED_ID)!;

      expect(template).toEqual({
        content: predefined.content,
        descriptionKey: predefined.descriptionKey,
        enabled: true,
        id: PREDEFINED_ID,
        predefined: true,
        // the user's stored shortcut wins over the predefined default
        shortcut: 'Q',
        titleKey: predefined.titleKey,
      });
    });

    it('drops a stored predefined template that no longer exists', async () => {
      givenData(createData({ templates: [predefinedTemplate({ id: 'PREDEFINED.99999' }), userTemplate()] }));

      await expect(service.getTemplates()).resolves.toHaveLength(1);
    });
  });

  describe('findTemplateByShortcut', () => {
    beforeEach(() => {
      givenData(createData({ templates: [userTemplate({ shortcut: 'Z' })] }));
    });

    it.each([
      ['an upper case shortcut', 'Z'],
      ['a lower case shortcut', 'z'],
    ])('matches %s', async (_label, shortcut) => {
      await expect(service.findTemplateByShortcut(shortcut)).resolves.toMatchObject({ id: 'user-1' });
    });

    it('resolves undefined for an unassigned shortcut', async () => {
      await expect(service.findTemplateByShortcut('Y')).resolves.toBeUndefined();
    });
  });

  describe('findTemplateById', () => {
    it('resolves undefined for an unknown id', async () => {
      await expect(service.findTemplateById('nope')).resolves.toBeUndefined();
    });
  });

  describe('removeTemplates', () => {
    it('removes only the given templates', async () => {
      givenData(createData({ templates: [userTemplate(), userTemplate({ id: 'user-2' })] }));

      await service.removeTemplate('user-1');

      expect(storedIds()).toEqual(['user-2']);
    });

    it('refuses to remove a predefined template', async () => {
      givenData(createData({ templates: [predefinedTemplate()] }));

      await expect(service.removeTemplates([PREDEFINED_ID])).rejects.toThrow('Could not remove predefined Template');
      expect(storedIds()).toEqual([PREDEFINED_ID]);
    });

    it('removes nothing when any id is unknown', async () => {
      givenData(createData({ templates: [userTemplate()] }));

      await expect(service.removeTemplates(['user-1', 'nope'])).rejects.toThrow('Could not find Template');
      expect(storedIds()).toEqual(['user-1']);
    });

    it('is a no-op for an empty list', async () => {
      givenData(createData({ templates: [userTemplate()] }));

      await service.removeTemplates([]);

      expect(storedIds()).toEqual(['user-1']);
    });

    it('reassigns the action template when the one it pointed at is removed', async () => {
      givenData(
        createData({
          action: {
            mode: TemplateActionMode.Template,
            popup: { autoCloseEnabled: true, optionLinkEnabled: true },
            templateId: 'user-1',
          },
          templates: [userTemplate(), userTemplate({ id: 'user-2' })],
        }),
      );

      await service.removeTemplate('user-1');

      expect(storedData().action.templateId).toBe('user-2');
    });

    it('prefers an enabled template when reassigning the action template', async () => {
      givenData(
        createData({
          action: {
            mode: TemplateActionMode.Template,
            popup: { autoCloseEnabled: true, optionLinkEnabled: true },
            templateId: 'user-1',
          },
          templates: [userTemplate(), userTemplate({ enabled: false, id: 'user-2' }), userTemplate({ id: 'user-3' })],
        }),
      );

      await service.removeTemplate('user-1');

      expect(storedData().action.templateId).toBe('user-3');
    });

    it('clears the action template when the last template is removed', async () => {
      givenData(
        createData({
          action: {
            mode: TemplateActionMode.Template,
            popup: { autoCloseEnabled: true, optionLinkEnabled: true },
            templateId: 'user-1',
          },
          templates: [userTemplate()],
        }),
      );

      await service.removeTemplate('user-1');

      expect(storedData().action.templateId).toBeNull();
    });

    it('leaves the action template alone when a different template is removed', async () => {
      givenData(
        createData({
          action: {
            mode: TemplateActionMode.Template,
            popup: { autoCloseEnabled: true, optionLinkEnabled: true },
            templateId: 'user-2',
          },
          templates: [userTemplate(), userTemplate({ id: 'user-2' })],
        }),
      );

      await service.removeTemplate('user-1');

      expect(storedData().action.templateId).toBe('user-2');
    });
  });

  describe('setTemplatesEnabled', () => {
    it('applies to every given template, predefined included', async () => {
      givenData(createData({ templates: [userTemplate(), predefinedTemplate()] }));

      await service.setTemplatesEnabled(['user-1', PREDEFINED_ID], false);

      expect(storedData().templates.map((template) => template.enabled)).toEqual([false, false]);
    });

    it('changes nothing when any id is unknown', async () => {
      givenData(createData({ templates: [userTemplate()] }));

      await expect(service.setTemplatesEnabled(['user-1', 'nope'], false)).rejects.toThrow('Could not find Template');
      expect(storedData().templates[0].enabled).toBe(true);
    });

    it('is a no-op for an empty list', async () => {
      givenData(createData({ templates: [userTemplate()] }));

      await service.setTemplatesEnabled([], false);

      expect(storedData().templates[0].enabled).toBe(true);
    });
  });

  describe('moveTemplate', () => {
    beforeEach(() => {
      givenData(
        createData({
          templates: [userTemplate(), userTemplate({ id: 'user-2' }), userTemplate({ id: 'user-3' })],
        }),
      );
    });

    it('moves a template later, shifting the others up', async () => {
      await service.moveTemplate('user-1', 2);

      expect(storedIds()).toEqual(['user-2', 'user-3', 'user-1']);
    });

    it('moves a template earlier, shifting the others down', async () => {
      await service.moveTemplate('user-3', 0);

      expect(storedIds()).toEqual(['user-3', 'user-1', 'user-2']);
    });

    it.each([
      ['a negative index', -5, ['user-1', 'user-2', 'user-3']],
      ['an index beyond the end', 99, ['user-2', 'user-3', 'user-1']],
    ])('clamps %s', async (_label, index, expected) => {
      await service.moveTemplate('user-1', index);

      expect(storedIds()).toEqual(expected);
    });

    it('is a no-op when the template is already at the target index', async () => {
      await service.moveTemplate('user-2', 1);

      expect(storedIds()).toEqual(['user-1', 'user-2', 'user-3']);
    });

    it('rejects an unknown id', async () => {
      await expect(service.moveTemplate('nope', 0)).rejects.toThrow('Could not find Template');
    });
  });

  describe('moveTemplates', () => {
    beforeEach(() => {
      givenData(
        createData({
          templates: [
            userTemplate(),
            userTemplate({ id: 'user-2' }),
            userTemplate({ id: 'user-3' }),
            userTemplate({ id: 'user-4' }),
          ],
        }),
      );
    });

    it('moves the selection to the top, preserving relative order on both sides', async () => {
      await service.moveTemplates(['user-2', 'user-4'], 'top');

      expect(storedIds()).toEqual(['user-2', 'user-4', 'user-1', 'user-3']);
    });

    it('moves the selection to the bottom, preserving relative order on both sides', async () => {
      await service.moveTemplates(['user-1', 'user-3'], 'bottom');

      expect(storedIds()).toEqual(['user-2', 'user-4', 'user-1', 'user-3']);
    });

    it('uses the stored order of the selection, not the order the ids were given in', async () => {
      await service.moveTemplates(['user-4', 'user-2'], 'top');

      expect(storedIds()).toEqual(['user-2', 'user-4', 'user-1', 'user-3']);
    });

    it('is a no-op when the selection is already at that end', async () => {
      await service.moveTemplates(['user-1', 'user-2'], 'top');

      expect(storedIds()).toEqual(['user-1', 'user-2', 'user-3', 'user-4']);
    });

    it('is a no-op for an empty selection', async () => {
      await service.moveTemplates([], 'top');

      expect(storedIds()).toEqual(['user-1', 'user-2', 'user-3', 'user-4']);
    });

    it('moves nothing when any id is unknown', async () => {
      await expect(service.moveTemplates(['user-1', 'nope'], 'top')).rejects.toThrow(
        'Could not find one or more Templates',
      );
      expect(storedIds()).toEqual(['user-1', 'user-2', 'user-3', 'user-4']);
    });
  });

  describe('toggleTemplateEnabled', () => {
    it.each([
      ['enabled', true, false],
      ['disabled', false, true],
    ])('flips a %s template', async (_label, enabled, expected) => {
      givenData(createData({ templates: [userTemplate({ enabled })] }));

      await expect(service.toggleTemplateEnabled('user-1')).resolves.toMatchObject({ enabled: expected });
      expect(storedData().templates[0].enabled).toBe(expected);
    });

    it('rejects an unknown id', async () => {
      await expect(service.toggleTemplateEnabled('nope')).rejects.toThrow('Could not find Template');
    });
  });

  describe('updateTemplate', () => {
    it('updates every editable field of a user-defined template', async () => {
      givenData(createData({ templates: [userTemplate()] }));

      const updated = await service.updateTemplate('user-1', {
        content: '{title}',
        description: 'desc',
        enabled: false,
        shortcut: 'Z',
        title: 'Renamed',
      });

      expect(updated).toMatchObject({ content: '{title}', enabled: false, shortcut: 'Z', title: 'Renamed' });
      expect(storedData().templates[0]).toMatchObject({ description: 'desc', title: 'Renamed' });
    });

    it('only applies the user-editable fields to a predefined template', async () => {
      givenData(createData({ templates: [predefinedTemplate()] }));

      await service.updateTemplate(PREDEFINED_ID, { enabled: false, shortcut: 'Z' });

      expect(storedData().templates[0]).toEqual({
        enabled: false,
        id: PREDEFINED_ID,
        predefined: true,
        shortcut: 'Z',
      });
    });

    it('rejects a partial update of a user-defined template rather than blanking fields', async () => {
      givenData(createData({ templates: [userTemplate()] }));

      await expect(service.updateTemplate('user-1', { enabled: false, shortcut: null })).rejects.toThrow(
        'Could not update Template',
      );
      expect(storedData().templates[0]).toMatchObject({ content: '{url}', enabled: true, title: 'User 1' });
    });

    it('rejects an unknown id', async () => {
      await expect(
        service.updateTemplate('nope', {
          content: 'a',
          description: null,
          enabled: true,
          shortcut: null,
          title: 'A',
        }),
      ).rejects.toThrow('Could not find Template');
    });
  });

  describe('exportTemplates / parseTemplates', () => {
    it('round-trips user-defined templates', async () => {
      givenData(createData({ templates: [userTemplate({ description: 'desc', shortcut: 'Z' })] }));

      const templates = await service.getTemplates();
      const parsed = service.parseTemplates(service.exportTemplates(templates));

      expect(parsed).toEqual([
        { content: '{url}', description: 'desc', enabled: true, shortcut: 'Z', title: 'User 1' },
      ]);
    });

    it('exports a predefined template using its resolved title and description', async () => {
      givenData(createData({ templates: [predefinedTemplate()] }));

      const templates = await service.getTemplates();
      const [parsed] = service.parseTemplates(service.exportTemplates(templates));

      // the intl mock echoes the message key, proving the localised value was used rather than the key-bearing fields
      expect(parsed.title).toBe('predefined_template_url_title');
      expect(parsed.description).toBe('predefined_template_url_description');
    });

    it('produces base64, not raw JSON', async () => {
      const templates = await service.getTemplates();

      expect(service.exportTemplates(templates)).not.toContain('"templates"');
    });

    it('accepts raw JSON as well as base64', () => {
      const json = JSON.stringify({
        templates: [{ content: 'a', enabled: true, title: 'A' }],
        version: 1,
      });

      expect(service.parseTemplates(json)).toEqual([{ content: 'a', enabled: true, title: 'A' }]);
    });

    it('accepts a bare array of templates', () => {
      const json = JSON.stringify([{ content: 'a', enabled: true, title: 'A' }]);

      expect(service.parseTemplates(json)).toEqual([{ content: 'a', enabled: true, title: 'A' }]);
    });

    it('tolerates surrounding and embedded whitespace in a base64 document', async () => {
      givenData(createData({ templates: [userTemplate()] }));

      const encoded = service.exportTemplates(await service.getTemplates());

      expect(service.parseTemplates(`\n  ${encoded.replace(/(.{8})/, '$1\n')}  \n`)).toHaveLength(1);
    });

    it.each([
      ['not base64', '!!!not base64!!!'],
      ['an empty string', ''],
    ])('rejects a document that is %s', (_label, value) => {
      expect(() => service.parseTemplates(value)).toThrow('not valid base64');
    });

    it('rejects base64 that does not decode to JSON', () => {
      expect(() => service.parseTemplates(btoa('not json'))).toThrow('not valid base64-encoded JSON');
    });

    it('rejects a document whose templates do not match the schema', () => {
      expect(() => service.parseTemplates(JSON.stringify({ templates: [{ title: 'A' }], version: 1 }))).toThrow();
    });

    it('rejects a document with no templates', () => {
      expect(() => service.parseTemplates(JSON.stringify({ templates: [], version: 1 }))).toThrow();
    });

    it('rejects a document from an unknown version', () => {
      expect(() =>
        service.parseTemplates(
          JSON.stringify({ templates: [{ content: 'a', enabled: true, title: 'A' }], version: 2 }),
        ),
      ).toThrow();
    });
  });

  describe('importTemplates', () => {
    it('imports templates as new user-defined templates', async () => {
      const imported = await service.importTemplates([
        { content: 'a', description: 'desc', enabled: false, shortcut: 'Z', title: 'A' },
      ]);

      expect(imported).toHaveLength(1);
      expect(storedData().templates[0]).toMatchObject({
        content: 'a',
        description: 'desc',
        enabled: false,
        predefined: false,
        shortcut: 'Z',
        title: 'A',
      });
    });

    it('normalizes omitted optional fields to null', async () => {
      await service.importTemplates([{ content: 'a', enabled: true, title: 'A' }]);

      expect(storedData().templates[0]).toMatchObject({ description: null, shortcut: null });
    });

    it('adds rather than overwrites, so a clash simply duplicates', async () => {
      givenData(createData({ templates: [userTemplate({ title: 'A' })] }));

      await service.importTemplates([{ content: 'a', enabled: true, title: 'A' }]);

      expect(storedData().templates).toHaveLength(2);
    });
  });

  describe('createTemplateActionInfo', () => {
    it('reports popup mode as-is', () => {
      expect(service.createTemplateActionInfo(createData())).toEqual({ mode: TemplateActionMode.Popup });
    });

    it('falls back to popup mode when the configured template no longer exists', () => {
      const data = createData({
        action: {
          mode: TemplateActionMode.Template,
          popup: { autoCloseEnabled: true, optionLinkEnabled: true },
          templateId: 'nope',
        },
      });

      expect(service.createTemplateActionInfo(data)).toEqual({ mode: TemplateActionMode.Popup });
    });

    it('omits the template while keeping the id when the configured template is disabled', () => {
      const data = createData({
        action: {
          mode: TemplateActionMode.Template,
          popup: { autoCloseEnabled: true, optionLinkEnabled: true },
          templateId: 'user-1',
        },
        templates: [userTemplate({ enabled: false })],
      });

      expect(service.createTemplateActionInfo(data)).toEqual({
        mode: TemplateActionMode.Template,
        template: undefined,
        templateId: 'user-1',
      });
    });
  });

  describe('createTemplatePopupInfo / createTemplateContextMenuInfo', () => {
    const data = createData({
      templates: [userTemplate(), userTemplate({ enabled: false, id: 'user-2' })],
    });

    it('lists only enabled templates in the popup', () => {
      expect(service.createTemplatePopupInfo(data).templates.map((template) => template.id)).toEqual(['user-1']);
    });

    it('lists only enabled templates in the context menu', () => {
      expect(service.createTemplateContextMenuInfo(data).templates.map((template) => template.id)).toEqual(['user-1']);
    });
  });

  describe('createTemplateShortcutInfo', () => {
    it('lists the assigned shortcuts, including those of disabled templates', () => {
      const data = createData({
        templates: [
          userTemplate({ shortcut: 'A' }),
          userTemplate({ enabled: false, id: 'user-2', shortcut: 'B' }),
          userTemplate({ id: 'user-3' }),
        ],
      });

      expect(service.createTemplateShortcutInfo(data).shortcuts).toEqual(['A', 'B']);
    });
  });

  describe('addChangeListener', () => {
    it('notifies the listener with the new data', () => {
      const listener = vi.fn();
      const data = createData();
      service.addChangeListener(listener);

      storage.notifyChanges({ [DataNamespace.Template]: { newValue: data } });

      expect(listener).toHaveBeenCalledWith(data);
    });

    it('ignores a change with no new value, such as a removal', () => {
      const listener = vi.fn();
      service.addChangeListener(listener);

      storage.notifyChanges({ [DataNamespace.Template]: { oldValue: createData() } });

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
