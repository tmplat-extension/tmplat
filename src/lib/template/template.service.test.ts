import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataService } from 'extension/common/data/data.service';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { ValidationService } from 'extension/common/validation/validation.service';
import { TemplateCollectionRepository } from 'extension/template/data/template-collection.repository';
import { TemplateDataRepository } from 'extension/template/data/template-data.repository';
import { type TemplateDefinition, type TemplateSettings } from 'extension/template/data/template-data.schema';
import { getPredefinedTemplates } from 'extension/template/predefined-templates';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';
import { TemplateIdGenerator } from 'extension/template/template-id-generator';
import { TemplateService } from 'extension/template/template.service';
import { FakeDataStorage } from 'extension/test/data-storage.fake';
import { asIntlService, createIntlServiceMock } from 'extension/test/intl.mock';
import { createLoggingServiceMock } from 'extension/test/logger.mock';

const PREDEFINED_ID = 'PREDEFINED.00001';

const userTemplate = (overrides: Partial<TemplateDefinition> = {}): TemplateDefinition =>
  ({
    content: '{url}',
    description: null,
    enabled: true,
    id: 'user-1',
    predefined: false,
    shortcut: null,
    title: 'User 1',
    ...overrides,
  }) as TemplateDefinition;

const predefinedTemplate = (overrides: Partial<TemplateDefinition> = {}): TemplateDefinition =>
  ({
    enabled: true,
    id: PREDEFINED_ID,
    predefined: true,
    shortcut: null,
    ...overrides,
  }) as TemplateDefinition;

/** The settings and the templates together, as this suite seeds them; storage keeps the two apart. */
type TemplateSeed = TemplateSettings & { templates: TemplateDefinition[] };

const createData = (overrides: Partial<TemplateSeed> = {}): TemplateSeed => ({
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
    templateId: null,
  },
  link: { target: true, title: true },
  markdown: { inline: false },
  shortcuts: { autoPasteEnabled: false, enabled: true },
  templates: [],
  ...overrides,
});

describe('TemplateService', () => {
  let service: TemplateService;
  let storage: FakeDataStorage;
  let collectionStorage: FakeDataStorage;

  // Backed by real repositories over the in-memory storage fake rather than hand-rolled stubs, so that schema
  // validation and the read-modify-write semantics of `mutate` are genuinely exercised.
  const givenData = ({ templates, ...settings }: TemplateSeed) => {
    storage = new FakeDataStorage({ [DataNamespace.Template]: settings });
    collectionStorage = new FakeDataStorage({
      [`${DataNamespace.Template}:index`]: templates.map((template) => template.id),
      ...Object.fromEntries(templates.map((template) => [`${DataNamespace.Template}:item:${template.id}`, template])),
    });

    const logging = createLoggingServiceMock() as unknown as LoggingService;
    const validationService = new ValidationService(createLoggingServiceMock() as never);
    const dataService = { local: collectionStorage, sync: storage } as unknown as DataService;
    const collectionRepository = new TemplateCollectionRepository(dataService, logging, validationService);

    service = new TemplateService(
      asIntlService(createIntlServiceMock()),
      logging,
      new TemplateDataRepository(dataService, logging, validationService, collectionRepository),
      collectionRepository,
      new TemplateIdGenerator(),
      validationService,
    );
  };

  const storedData = (): TemplateSettings => storage.snapshot()[DataNamespace.Template] as TemplateSettings;

  /** Rebuilds the ordered template list from the collection's per-item keys and its order index. */
  const storedTemplates = (): TemplateDefinition[] => {
    const snapshot = collectionStorage.snapshot();
    const order = (snapshot[`${DataNamespace.Template}:index`] as string[] | undefined) ?? [];

    return order
      .map((id) => snapshot[`${DataNamespace.Template}:item:${id}`] as TemplateDefinition | undefined)
      .filter((template): template is TemplateDefinition => template != null);
  };

  const storedIds = (): string[] => storedTemplates().map((template) => template.id);

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

      await expect(service.removeTemplates([PREDEFINED_ID])).rejects.toMatchObject({ code: 'TPL405000' });
      expect(storedIds()).toEqual([PREDEFINED_ID]);
    });

    it('removes nothing when any id is unknown', async () => {
      givenData(createData({ templates: [userTemplate()] }));

      await expect(service.removeTemplates(['user-1', 'nope'])).rejects.toMatchObject({ code: 'TPL404000' });
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

      expect(storedTemplates().map((template) => template.enabled)).toEqual([false, false]);
    });

    it('changes nothing when any id is unknown', async () => {
      givenData(createData({ templates: [userTemplate()] }));

      await expect(service.setTemplatesEnabled(['user-1', 'nope'], false)).rejects.toMatchObject({
        code: 'TPL404000',
      });
      expect(storedTemplates()[0].enabled).toBe(true);
    });

    it('is a no-op for an empty list', async () => {
      givenData(createData({ templates: [userTemplate()] }));

      await service.setTemplatesEnabled([], false);

      expect(storedTemplates()[0].enabled).toBe(true);
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
      await expect(service.moveTemplate('nope', 0)).rejects.toMatchObject({ code: 'TPL404000' });
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
      await expect(service.moveTemplates(['user-1', 'nope'], 'top')).rejects.toMatchObject({ code: 'TPL404010' });
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
      expect(storedTemplates()[0].enabled).toBe(expected);
    });

    it('rejects an unknown id', async () => {
      await expect(service.toggleTemplateEnabled('nope')).rejects.toMatchObject({ code: 'TPL404000' });
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
      expect(storedTemplates()[0]).toMatchObject({ description: 'desc', title: 'Renamed' });
    });

    it('only applies the user-editable fields to a predefined template', async () => {
      givenData(createData({ templates: [predefinedTemplate()] }));

      await service.updateTemplate(PREDEFINED_ID, { enabled: false, shortcut: 'Z' });

      expect(storedTemplates()[0]).toEqual({
        enabled: false,
        id: PREDEFINED_ID,
        predefined: true,
        shortcut: 'Z',
      });
    });

    it('rejects a partial update of a user-defined template rather than blanking fields', async () => {
      givenData(createData({ templates: [userTemplate()] }));

      await expect(service.updateTemplate('user-1', { enabled: false, shortcut: null })).rejects.toMatchObject({
        code: 'TPL400000',
      });
      expect(storedTemplates()[0]).toMatchObject({ content: '{url}', enabled: true, title: 'User 1' });
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
      ).rejects.toMatchObject({ code: 'TPL404000' });
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

    it('rejects a document that is not base64', () => {
      expect(() => service.parseTemplates('!!!not base64!!!')).toThrow(expect.objectContaining({ code: 'TPL422000' }));
    });

    // An empty document decodes cleanly to an empty string, so it fails as invalid JSON rather than invalid base64
    it('rejects a document that is an empty string', () => {
      expect(() => service.parseTemplates('')).toThrow(expect.objectContaining({ code: 'TPL422010' }));
    });

    it('rejects base64 that does not decode to JSON', () => {
      expect(() => service.parseTemplates(btoa('not json'))).toThrow(expect.objectContaining({ code: 'TPL422010' }));
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

    describe('legacy 1.2.x export files', () => {
      // A 1.x export was the raw `templates` array from storage, whose entries background.coffee normalises
      // with `shortcut ?= ''` and `content ?= ''`. Because `templates` is parsed as a single array, a modern
      // `nonempty`-style constraint on either field would reject the WHOLE file rather than one entry.
      const legacyExport = [
        {
          content: '{url}',
          enabled: true,
          image: '',
          index: 0,
          key: 'PREDEFINED.00001',
          readOnly: true,
          shortcut: 'U',
          title: 'URL',
          usage: 4,
        },
        {
          content: '[{title}]({url})',
          enabled: true,
          image: '',
          index: 1,
          key: 'CUSTOM.00001',
          readOnly: false,
          shortcut: '',
          title: 'My Link',
          usage: 0,
        },
        {
          content: '',
          enabled: false,
          image: '',
          index: 2,
          key: 'CUSTOM.00002',
          readOnly: false,
          shortcut: '',
          title: 'Empty',
          usage: 0,
        },
      ];

      it('accepts a legacy export, coercing its empty-string sentinels and stripping dropped fields', () => {
        expect(service.parseTemplates(JSON.stringify(legacyExport))).toEqual([
          { content: '{url}', enabled: true, shortcut: 'U', title: 'URL' },
          { content: '[{title}]({url})', enabled: true, shortcut: null, title: 'My Link' },
          { content: ' ', enabled: false, shortcut: null, title: 'Empty' },
        ]);
      });

      it.each([
        ['a blank shortcut', ''],
        ['an explicitly null shortcut', null],
      ])('coerces %s to null rather than rejecting the document', (_label, shortcut) => {
        expect(service.parseTemplates(JSON.stringify([{ content: 'a', enabled: true, shortcut, title: 'A' }]))).toEqual(
          [{ content: 'a', enabled: true, shortcut: null, title: 'A' }],
        );
      });

      it('substitutes blank content, which 1.x allowed but the template model does not', () => {
        const [parsed] = service.parseTemplates(JSON.stringify([{ content: '', enabled: true, title: 'A' }]));

        expect(parsed?.content).toBe(' ');
      });

      it.each([
        ['lower case', 'u', 'U'],
        ['surrounded by whitespace', ' u ', 'U'],
      ])('normalizes a shortcut that is %s rather than rejecting the document', (_label, shortcut, expected) => {
        const [parsed] = service.parseTemplates(
          JSON.stringify([{ content: 'a', enabled: true, shortcut, title: 'A' }]),
        );

        expect(parsed?.shortcut).toBe(expected);
      });

      // 1.x validated with an unanchored `/[A-Z0-9]/i`, so its import path persisted these verbatim. Degrading
      // them to "no shortcut" matches the data migrator exactly, rather than failing the whole document.
      it.each([
        ['more than one character', 'AB'],
        ['not alphanumeric', '!'],
        ['only whitespace', ' '],
      ])('drops a shortcut that is %s rather than rejecting the document', (_label, shortcut) => {
        const [parsed] = service.parseTemplates(
          JSON.stringify([{ content: 'a', enabled: true, shortcut, title: 'A' }]),
        );

        expect(parsed?.shortcut).toBeNull();
      });
    });
  });

  describe('importTemplates', () => {
    it('imports templates as new user-defined templates', async () => {
      const imported = await service.importTemplates([
        { content: 'a', description: 'desc', enabled: false, shortcut: 'Z', title: 'A' },
      ]);

      expect(imported).toHaveLength(1);
      expect(storedTemplates()[0]).toMatchObject({
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

      expect(storedTemplates()[0]).toMatchObject({ description: null, shortcut: null });
    });

    it('adds rather than overwrites, so a clash simply duplicates', async () => {
      givenData(createData({ templates: [userTemplate({ title: 'A' })] }));

      await service.importTemplates([{ content: 'a', enabled: true, title: 'A' }]);

      expect(storedTemplates()).toHaveLength(2);
    });
  });

  describe('getTemplateActionInfo', () => {
    it('reports popup mode as-is', async () => {
      givenData(createData());

      await expect(service.getTemplateActionInfo()).resolves.toEqual({ mode: TemplateActionMode.Popup });
    });

    it('falls back to popup mode when no template is configured', async () => {
      givenData(
        createData({
          action: {
            mode: TemplateActionMode.Template,
            popup: { autoCloseEnabled: true, optionLinkEnabled: true },
            templateId: null,
          },
        }),
      );

      await expect(service.getTemplateActionInfo()).resolves.toEqual({ mode: TemplateActionMode.Popup });
    });

    /*
     * `TemplateDataRepository.update` re-points a reference whose template has gone and the options page seeds one
     * whenever a `Template` mode is selected, so a dangling reference means the settings are broken rather than merely
     * unset. Falling back to the popup would hide that while looking like the user's own configuration.
     */
    it('fails when the configured template no longer exists', async () => {
      givenData(
        createData({
          action: {
            mode: TemplateActionMode.Template,
            popup: { autoCloseEnabled: true, optionLinkEnabled: true },
            templateId: 'nope',
          },
        }),
      );

      await expect(service.getTemplateActionInfo()).rejects.toMatchObject({ code: 'TPL404000' });
    });

    /*
     * The template used to be dropped here when disabled, which left `ActionService` unable to tell "disabled" apart
     * from "missing" and reporting the wrong reason for a click that did nothing. Resolving it either way lets the
     * caller decide, and keeps `template` non-optional - it can only be absent in `Popup` mode.
     */
    it('resolves the template even when it is disabled', async () => {
      const template = userTemplate({ enabled: false });
      givenData(
        createData({
          action: {
            mode: TemplateActionMode.Template,
            popup: { autoCloseEnabled: true, optionLinkEnabled: true },
            templateId: 'user-1',
          },
          templates: [template],
        }),
      );

      await expect(service.getTemplateActionInfo()).resolves.toEqual({
        mode: TemplateActionMode.Template,
        template: expect.objectContaining({ enabled: false, id: 'user-1' }),
        templateId: 'user-1',
      });
    });
  });

  describe('getTemplatePopupInfo / getTemplateContextMenuInfo', () => {
    beforeEach(() => {
      givenData(createData({ templates: [userTemplate(), userTemplate({ enabled: false, id: 'user-2' })] }));
    });

    it('lists only enabled templates in the popup', async () => {
      const { templates } = await service.getTemplatePopupInfo();

      expect(templates.map((template) => template.id)).toEqual(['user-1']);
    });

    it('lists only enabled templates in the context menu', async () => {
      const { templates } = await service.getTemplateContextMenuInfo();

      expect(templates.map((template) => template.id)).toEqual(['user-1']);
    });

    it('falls back to menu mode when no template is configured', async () => {
      givenData(
        createData({
          contextMenu: {
            autoPasteEnabled: false,
            enabled: true,
            mode: TemplateContextMenuMode.Template,
            optionLinkEnabled: true,
            templateId: null,
          },
          templates: [],
        }),
      );

      await expect(service.getTemplateContextMenuInfo()).resolves.toMatchObject({
        mode: TemplateContextMenuMode.Menu,
      });
    });

    // The context menu id used to be borrowed from the toolbar button, so the two have to be demonstrably independent
    it('uses its own templateId rather than the action one', async () => {
      givenData(
        createData({
          action: {
            mode: TemplateActionMode.Template,
            popup: { autoCloseEnabled: true, optionLinkEnabled: true },
            templateId: 'user-1',
          },
          contextMenu: {
            autoPasteEnabled: false,
            enabled: true,
            mode: TemplateContextMenuMode.Template,
            optionLinkEnabled: true,
            templateId: 'user-2',
          },
          templates: [userTemplate(), userTemplate({ enabled: false, id: 'user-2' })],
        }),
      );

      await expect(service.getTemplateContextMenuInfo()).resolves.toMatchObject({
        mode: TemplateContextMenuMode.Template,
        templateId: 'user-2',
      });
    });

    it('fails when the configured template no longer exists', async () => {
      givenData(
        createData({
          contextMenu: {
            autoPasteEnabled: false,
            enabled: true,
            mode: TemplateContextMenuMode.Template,
            optionLinkEnabled: true,
            templateId: 'nope',
          },
        }),
      );

      await expect(service.getTemplateContextMenuInfo()).rejects.toMatchObject({ code: 'TPL404000' });
    });
  });

  describe('getTemplateShortcutInfo', () => {
    /*
     * The list exists purely so a content script can decide whether to swallow a keypress, so a disabled template
     * must not contribute one - otherwise a shortcut would be the one way to run something the user switched off.
     */
    it('lists the assigned shortcuts of enabled templates only', async () => {
      givenData(
        createData({
          templates: [
            userTemplate({ shortcut: 'A' }),
            userTemplate({ enabled: false, id: 'user-2', shortcut: 'B' }),
            userTemplate({ id: 'user-3' }),
          ],
        }),
      );

      await expect(service.getTemplateShortcutInfo()).resolves.toMatchObject({ shortcuts: ['A'] });
    });
  });

  /*
   * The listener is passed nothing and is expected to re-read. Settings and templates are separate storage areas now,
   * so a change to one carries no consistent view of the other, and a composed snapshot would be stale.
   */
  describe('addChangeListener', () => {
    it('notifies the listener when the settings change', () => {
      const listener = vi.fn();
      service.addChangeListener(listener);

      storage.notifyChanges({ [DataNamespace.Template]: { newValue: createData() } });

      expect(listener).toHaveBeenCalledWith();
    });

    it('notifies the listener when a template changes', () => {
      const listener = vi.fn();
      service.addChangeListener(listener);

      collectionStorage.notifyChanges({
        [`${DataNamespace.Template}:item:user-1`]: { newValue: userTemplate() },
      });

      expect(listener).toHaveBeenCalledWith();
    });

    it('notifies the listener when a template is removed', () => {
      const listener = vi.fn();
      service.addChangeListener(listener);

      collectionStorage.notifyChanges({
        [`${DataNamespace.Template}:item:user-1`]: { oldValue: userTemplate() },
      });

      expect(listener).toHaveBeenCalledWith();
    });

    it('ignores a change to an unrelated key', () => {
      const listener = vi.fn();
      service.addChangeListener(listener);

      collectionStorage.notifyChanges({ url_shortener: { newValue: {} } });

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
