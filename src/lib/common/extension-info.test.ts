import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExtensionEnvironment } from 'extension/common/extension-environment.enum';
import { ExtensionInfo } from 'extension/common/extension-info';
import { getBrowserApiMock } from 'extension/test/browser-api.mock';

describe('ExtensionInfo', () => {
  let extensionInfo: ExtensionInfo;

  beforeEach(() => {
    extensionInfo = new ExtensionInfo();
  });

  describe('convertStringToExtensionEnvironment', () => {
    it.each(Object.values(ExtensionEnvironment))('accepts the recognised environment %j', (environment) => {
      expect(extensionInfo.convertStringToExtensionEnvironment(environment)).toBe(environment);
    });

    it.each([null, undefined])('throws when the environment is %j', (environment) => {
      expect(() => extensionInfo.convertStringToExtensionEnvironment(environment)).toThrow(
        'Extension environment is not available',
      );
    });

    it.each(['', 'PRODUCTION', 'staging'])('throws when the environment %j is unrecognised', (environment) => {
      expect(() => extensionInfo.convertStringToExtensionEnvironment(environment)).toThrow(
        `Extension environment is unrecognised: '${environment}'`,
      );
    });
  });

  describe('convertStringToExtensionVersion', () => {
    it.each(['1.2.8', '1.2.9', '2.0.0'])('accepts the released version %j', (version) => {
      expect(extensionInfo.convertStringToExtensionVersion(version)).toBe(version);
    });

    // `isExtensionVersion` is deliberately structural (see its doc comment) — the released versions are generated
    // into the `ExtensionVersion` union from `docs/changelog.json`, but nothing enumerates them at runtime. So this
    // is a *shape* check, not a membership check, and any `major.minor.patch` string is accepted and typed as a
    // released version. `0.0.0` matters in particular: `src/manifest.json` intentionally carries it until the build
    // injects the real version.
    it.each(['0.0.0', '1.3.0', '99.99.99'])(
      'accepts the unreleased but well-formed version %j (structural check only)',
      (version) => {
        expect(extensionInfo.convertStringToExtensionVersion(version)).toBe(version);
      },
    );

    it.each([null, undefined])('throws when the version is %j', (version) => {
      expect(() => extensionInfo.convertStringToExtensionVersion(version)).toThrow(
        'Extension version is not available',
      );
    });

    it.each(['', '1.2', '1.2.3.4', 'v2.0.0', 'not-a-version'])(
      'throws when the version %j is unrecognised',
      (version) => {
        expect(() => extensionInfo.convertStringToExtensionVersion(version)).toThrow(
          `Extension version is unrecognised: '${version}'`,
        );
      },
    );
  });

  describe('createExtensionUrl', () => {
    it('resolves an empty path against the extension origin by default', () => {
      expect(extensionInfo.createExtensionUrl().toString()).toBe('chrome-extension://test-extension-id/');
    });

    it('resolves a relative path against the extension origin', () => {
      const url = extensionInfo.createExtensionUrl('migrate.html');

      expect(url.protocol).toBe('chrome-extension:');
      expect(url.hostname).toBe('test-extension-id');
      expect(url.pathname).toBe('/migrate.html');
    });

    it('appends the given params', () => {
      const url = extensionInfo.createExtensionUrl('migrate.html', { source: 'update', version: '1.2.9' });

      expect(url.searchParams.get('version')).toBe('1.2.9');
      expect(url.searchParams.get('source')).toBe('update');
    });

    // A blank value would otherwise produce a dangling `?version=`, which reads as "present but empty" to anything
    // parsing the query string back out
    it('omits params with a blank value', () => {
      const url = extensionInfo.createExtensionUrl('migrate.html', { blank: '', version: '1.2.9' });

      expect(url.searchParams.has('blank')).toBe(false);
      expect(url.toString()).toBe('chrome-extension://test-extension-id/migrate.html?version=1.2.9');
    });

    it('escapes param values rather than interpolating them', () => {
      const url = extensionInfo.createExtensionUrl('migrate.html', { note: 'a b&c=d' });

      expect(url.searchParams.get('note')).toBe('a b&c=d');
      expect(url.toString()).toContain('note=a+b%26c%3Dd');
    });
  });

  describe('createExtensionUrlString', () => {
    it('returns the same value as createExtensionUrl, stringified', () => {
      const params = { version: '1.2.9' };

      expect(extensionInfo.createExtensionUrlString('migrate.html', params)).toBe(
        extensionInfo.createExtensionUrl('migrate.html', params).toString(),
      );
    });

    it('defaults to the extension origin when given no arguments', () => {
      expect(extensionInfo.createExtensionUrlString()).toBe('chrome-extension://test-extension-id/');
    });
  });

  describe('getEnvironment', () => {
    it('falls back to production when EXT_ENV is not set', () => {
      vi.stubEnv('EXT_ENV', undefined);

      expect(extensionInfo.getEnvironment()).toBe(ExtensionEnvironment.Production);
      expect(extensionInfo.isProduction).toBe(true);
    });

    it('reads the environment from EXT_ENV', () => {
      vi.stubEnv('EXT_ENV', ExtensionEnvironment.Development);

      expect(extensionInfo.getEnvironment()).toBe(ExtensionEnvironment.Development);
      expect(extensionInfo.isProduction).toBe(false);
    });

    it('throws when EXT_ENV is unrecognised', () => {
      vi.stubEnv('EXT_ENV', 'staging');

      expect(() => extensionInfo.getEnvironment()).toThrow("Extension environment is unrecognised: 'staging'");
    });

    it('caches the environment after the first read', () => {
      vi.stubEnv('EXT_ENV', ExtensionEnvironment.Development);

      expect(extensionInfo.getEnvironment()).toBe(ExtensionEnvironment.Development);

      vi.stubEnv('EXT_ENV', ExtensionEnvironment.Production);

      expect(extensionInfo.getEnvironment()).toBe(ExtensionEnvironment.Development);
    });
  });

  describe('getVersion', () => {
    it('returns the manifest version', () => {
      expect(extensionInfo.getVersion()).toBe('2.0.0');
    });

    it('throws when the manifest version is malformed', () => {
      getBrowserApiMock().runtime.getVersion.mockReturnValue('v9');

      expect(() => extensionInfo.getVersion()).toThrow("Extension version is unrecognised: 'v9'");
    });

    it('caches the version, so the browser API is only read once', () => {
      const { runtime } = getBrowserApiMock();

      extensionInfo.getVersion();
      extensionInfo.getVersion();

      expect(runtime.getVersion).toHaveBeenCalledTimes(1);
    });

    it.each([false, undefined] as const)('omits the commit when includeCommit is %j', (includeCommit) => {
      vi.stubEnv('EXT_COMMIT', 'abc1234');

      expect(extensionInfo.getVersion(includeCommit)).toBe('2.0.0');
    });

    it('appends the commit when asked and EXT_COMMIT is set', () => {
      vi.stubEnv('EXT_COMMIT', 'abc1234');

      expect(extensionInfo.getVersion(true)).toBe('2.0.0#abc1234');
    });

    it('omits the commit when asked but EXT_COMMIT is not set', () => {
      vi.stubEnv('EXT_COMMIT', undefined);

      expect(extensionInfo.getVersion(true)).toBe('2.0.0');
    });
  });

  describe('id', () => {
    it('returns the runtime id', () => {
      expect(extensionInfo.id).toBe('test-extension-id');
    });
  });
});
