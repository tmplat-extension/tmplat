import { IntlService } from 'extension/common/intl/intl.service';

/**
 * Extracts a message suitable for display from an arbitrary thrown value.
 */
export function getErrorMessage(error: unknown, intl: IntlService): string {
  return error instanceof Error && error.message ? error.message : intl.getMessage('options_error_unexpected_message');
}
