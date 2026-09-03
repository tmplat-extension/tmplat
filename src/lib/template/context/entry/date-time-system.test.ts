import { describe, expect, it } from 'vitest';
import { createTestTemplateContextManager } from 'extension/test/template-context-manager.factory';

/**
 * Tests for date/time, locale, system and identifier entries.
 */
describe('date/time and system context entries', () => {
  describe('dateTime', () => {
    it('formats the current date/time with an explicit Luxon format', async () => {
      const { render } = createTestTemplateContextManager();
      const expectedYear = String(new Date().getFullYear());

      await expect(render('{#dateTime}yyyy{/dateTime}')).resolves.toBe(expectedYear);
    });

    it('falls back to an ISO string when given no format', async () => {
      const { render } = createTestTemplateContextManager();

      await expect(render('{#dateTime}{/dateTime}')).resolves.toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('lastModified', () => {
    it('formats the page last-modified date with an explicit format', async () => {
      const { render } = createTestTemplateContextManager({
        tabContext: { lastModified: '2024-06-15T12:00:00.000Z' },
      });

      await expect(render('{#lastModified}yyyy{/lastModified}')).resolves.toBe('2024');
    });

    it('falls back to an ISO string when given no format', async () => {
      const { render } = createTestTemplateContextManager({
        tabContext: { lastModified: '2024-06-15T12:00:00.000Z' },
      });

      await expect(render('{#lastModified}{/lastModified}')).resolves.toMatch(/^2024-06-15T/);
    });
  });

  describe('locale', () => {
    it('resolves {locale} from the intl service', async () => {
      const { render } = createTestTemplateContextManager({ locale: 'fr-FR' });

      await expect(render('{locale}')).resolves.toBe('fr-FR');
    });
  });

  describe('os', () => {
    it('resolves {os} to the platform', async () => {
      const { render } = createTestTemplateContextManager();

      await expect(render('{os}')).resolves.toBe(navigator.platform);
    });
  });

  describe('uuid', () => {
    it('resolves {uuid} to a random UUID', async () => {
      const { render } = createTestTemplateContextManager();

      await expect(render('{uuid}')).resolves.toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('resolves a fresh {uuid} on each render', async () => {
      const { render } = createTestTemplateContextManager();

      const [first, second] = await Promise.all([render('{uuid}'), render('{uuid}')]);
      expect(first).not.toBe(second);
    });
  });

  describe('version', () => {
    it('resolves {version} from the extension info', async () => {
      const { render } = createTestTemplateContextManager({ version: '3.1.4' });

      await expect(render('{version}')).resolves.toBe('3.1.4');
    });
  });

  describe('browser info', () => {
    it.each(['browserName', 'browserMajorVersion', 'browserFullVersion'])(
      'resolves {%s} to an empty string when no user-agent brand data is available',
      async (name) => {
        const { render } = createTestTemplateContextManager();

        await expect(render(`{${name}}`)).resolves.toBe('');
      },
    );
  });
});
