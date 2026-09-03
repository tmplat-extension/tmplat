import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type Changelog } from 'extension/common/changelog/changelog.schema';
import { ChangelogFilePath, ChangelogService } from 'extension/common/changelog/changelog.service';
import { type ExtensionInfo } from 'extension/common/extension-info';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { ValidationService } from 'extension/common/validation/validation.service';
import { installFetchMock, jsonResponse, malformedJsonResponse } from 'extension/test/fetch.mock';
import { createLoggingServiceMock } from 'extension/test/logger.mock';

const CHANGELOG_URL = 'chrome-extension://test-extension-id/changelog.json';

const VALID_CHANGELOG: Changelog = [
  { date: '2024-01-01', features: ['First release'], version: '1.0.0' },
  { improvements: ['Faster'], unreleased: true, version: '1.1.0' },
];

describe('ChangelogService', () => {
  let fetchMock: ReturnType<typeof installFetchMock>;
  let service: ChangelogService;

  const createExtensionUrlString = vi.fn((path?: string) => `chrome-extension://test-extension-id/${path ?? ''}`);

  beforeEach(() => {
    fetchMock = installFetchMock();
    const extensionInfo = { createExtensionUrlString } as unknown as ExtensionInfo;
    service = new ChangelogService(
      extensionInfo,
      createLoggingServiceMock() as unknown as LoggingService,
      new ValidationService(createLoggingServiceMock() as never),
    );
  });

  describe('getChangelog', () => {
    it('fetches and validates the bundled changelog file', async () => {
      fetchMock.mockResolvedValue(jsonResponse(VALID_CHANGELOG));

      await expect(service.getChangelog()).resolves.toEqual(VALID_CHANGELOG);
      expect(createExtensionUrlString).toHaveBeenCalledWith(ChangelogFilePath);
      expect(fetchMock).toHaveBeenCalledWith(CHANGELOG_URL);
    });

    it('rejects with CHA500000 when the changelog file cannot be loaded', async () => {
      fetchMock.mockResolvedValue(jsonResponse({}, { status: 404 }));

      await expect(service.getChangelog()).rejects.toMatchObject({ code: 'CHA500000' });
    });

    it('rejects with CHA422000 when the changelog fails schema validation', async () => {
      fetchMock.mockResolvedValue(jsonResponse([{ version: 'not-a-version' }]));

      await expect(service.getChangelog()).rejects.toMatchObject({ code: 'CHA422000' });
    });

    it('rejects with CHA422000 when the changelog body is not valid JSON', async () => {
      fetchMock.mockResolvedValue(malformedJsonResponse());

      await expect(service.getChangelog()).rejects.toThrow();
    });

    it('caches the changelog, fetching only once across repeated calls', async () => {
      fetchMock.mockResolvedValue(jsonResponse(VALID_CHANGELOG));

      await service.getChangelog();
      await service.getChangelog();

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('returns a fresh copy each time, so a caller mutating the result cannot corrupt the cache', async () => {
      fetchMock.mockResolvedValue(jsonResponse(VALID_CHANGELOG));

      const first = await service.getChangelog();
      first.length = 0;

      await expect(service.getChangelog()).resolves.toEqual(VALID_CHANGELOG);
    });
  });
});
