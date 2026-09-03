import { isString } from 'es-toolkit';
import { type Substitutions } from 'extension/common/intl/intl.model';

const formatSubstitutions = (substitutions: Substitutions): string[] =>
  substitutions.map((substitution) => {
    switch (typeof substitution) {
      case 'string':
        return substitution;
      case 'boolean':
        return substitution ? 'true' : 'false';
      case 'bigint':
      case 'number':
        return substitution.toString();
      default:
        throw new Error(`Unsupported substitution type: '${typeof substitution}'`);
    }
  });

export const localizeMessage = (
  key: string,
  substitutions: Substitutions,
  defaultMessage: string | ((key: string) => string) = `!${key}!`,
): string => {
  const message = browser.i18n.getMessage(key, formatSubstitutions(substitutions));
  if (message) {
    return message;
  }

  return isString(defaultMessage) ? defaultMessage : defaultMessage(key);
};
