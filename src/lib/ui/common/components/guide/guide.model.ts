import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key';
import { TemplateContextCategoryLink } from 'extension/template/context/template-context-category-link';

/**
 * A single row within the guide, derived from a {@link TemplateContextEntryDefinition} for one specific category.
 *
 * An entry definition can belong to multiple categories (e.g. `dateTime` is both a standard entry and an operation), in
 * which case it contributes a separate {@link GuideEntry} to each of those categories.
 */
export type GuideEntry = {
  readonly added: ExtensionVersion;
  /** Alternative names that resolve to this same entry, most of which are retained only for backwards compatibility. */
  readonly aliases: readonly string[];
  readonly deprecated?: ExtensionVersion;
  readonly descriptionKey: IntlMessageKey;
  readonly links: readonly TemplateContextCategoryLink[];
  readonly name: string;
  /** Indicates the value is a credential, so that the guide can warn against exposing it. */
  readonly sensitive?: boolean;
  /** Human-readable summary of the entry's data type or, for operations, its signature. */
  readonly type: string;
  /** The complete set of values the entry can hold, where it is constrained (e.g. backed by an enum). */
  readonly values?: readonly (boolean | number | string)[];
};

/**
 * A hard-coded, illustrative usage of a category rather than of any individual entry.
 */
export type GuideExample = {
  readonly descriptionKey: IntlMessageKey;
  readonly output: string;
  readonly template: string;
};
