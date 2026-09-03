import { type Mock, vi } from 'vitest';
import { type IntlMessageKey } from 'extension/common/intl/intl-message-key';
import { type Substitution } from 'extension/common/intl/intl.model';
import { type IntlService } from 'extension/common/intl/intl.service';

/**
 * Creates a fake {@link IntlService} that echoes the message key it was asked for, so assertions can check *which*
 * message was localized without depending on the contents of `src/_locales`.
 */
export const createIntlServiceMock = (): IntlServiceMock => ({
  getMessage: vi.fn((key: IntlMessageKey) => key),
});

export type IntlServiceMock = {
  getMessage: Mock<(key: IntlMessageKey, ...substitutions: Substitution[]) => string>;
};

/** Casts an {@link IntlServiceMock} to the real type, for passing into a constructor. */
export const asIntlService = (mock: IntlServiceMock): IntlService => mock as unknown as IntlService;
