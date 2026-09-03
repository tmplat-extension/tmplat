import { describe, expect, it, vi } from 'vitest';
import { resolveErrorDetail } from 'extension/common/error/error-detail';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type IntlService } from 'extension/common/intl/intl.service';
import { getBrowserApiMock } from 'extension/test/browser-api.mock';

const createIntl = () =>
  ({
    getMessage: vi.fn((key: string, ...substitutions: unknown[]) => [key, ...substitutions].join('|')),
  }) as unknown as IntlService;

describe('resolveErrorDetail', () => {
  it('uses the code, message and stack of an extension error in preference to the fallback', () => {
    const { i18n } = getBrowserApiMock();
    i18n.getMessage.mockReturnValue('My Template output was empty');
    const intl = createIntl();
    const error = ExtensionError.from('TEE400000', 'My Template');

    expect(resolveErrorDetail(error, intl, { code: 'ERR422000', messageKey: 'popup_error' })).toEqual({
      code: 'TEE400000',
      message: 'My Template output was empty',
      stack: error.stack,
    });
    expect(intl.getMessage).not.toHaveBeenCalled();
  });

  it('localizes the fallback message with its substitutions for an opaque error', () => {
    const intl = createIntl();
    const error = new Error('ECONNRESET');

    expect(
      resolveErrorDetail(error, intl, {
        code: 'SHO500000',
        messageKey: 'template_execution_fail_general_description',
        substitutions: ['My Template'],
      }),
    ).toEqual({
      code: 'SHO500000',
      message: 'template_execution_fail_general_description|My Template',
      stack: error.stack,
    });
  });

  it('defaults to the generic code and message when no fallback is given', () => {
    const intl = createIntl();

    expect(resolveErrorDetail('nope', intl)).toEqual({
      code: 'ERR500000',
      message: 'xerr_err500000',
      stack: undefined,
    });
  });

  it('has no stack for a value that is not an error', () => {
    expect(resolveErrorDetail({ message: 'Boom' }, createIntl()).stack).toBeUndefined();
  });
});
