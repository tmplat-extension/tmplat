import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { TemplateContextCategoryLink } from 'extension/template/context/template-context-category-link';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextManager } from 'extension/template/context/template-context-manager';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';

export type TemplateContext = Readonly<Record<TemplateContextName, TemplateContextEntry>>;

export type TemplateContextEntry =
  | TemplateContextEntryValue
  | Promise<TemplateContextEntryValue>
  | (() => TemplateContextEntryNestedRenderer | TemplateContextEntryValue | Promise<TemplateContextEntryValue>);

export type TemplateContextEntryDefinition = {
  readonly added: ExtensionVersion;
  readonly aliasOf?: TemplateContextName;
  readonly aliases?: readonly TemplateContextName[];
  readonly categories: TemplateContextEntryDefinitionCategories;
  readonly deprecated?: ExtensionVersion;
  readonly features?: TemplateContextFeature[];
  readonly name: TemplateContextName;
  readonly render: TemplateContextEntryRenderer;
};

export type TemplateContextEntryDefinitionAlias = Omit<
  TemplateContextEntryDefinition,
  'aliasOf' | 'aliases' | 'categories' | 'features' | 'render'
> & {
  readonly aliasOf: TemplateContextName;
};

export type TemplateContextEntryDefinitionCategories = {
  readonly [TemplateContextCategory.Standard]?: TemplateContextEntryDefinitionStandardCategory;
} & (
  | {
      readonly [TemplateContextCategory.Collection]?: TemplateContextEntryDefinitionCollectionCategory;
      readonly [TemplateContextCategory.Operation]?: undefined;
    }
  | {
      readonly [TemplateContextCategory.Collection]?: undefined;
      readonly [TemplateContextCategory.Operation]?: TemplateContextEntryDefinitionOperationCategory;
    }
);

export type TemplateContextEntryDefinitionCategory = {
  // TODO: Should this be optional for fully deprecated entries or should they also be displayed?
  readonly descriptionKey: IntlMessageKey;
  readonly links?: readonly TemplateContextCategoryLink[];
};

export type TemplateContextEntryDefinitionCollectionCategory = TemplateContextEntryDefinitionCategory &
  (
    | {
        readonly dataType: TemplateContextDataType.Array;
        readonly itemDataType: Exclude<
          TemplateContextDataType,
          TemplateContextDataType.Array | TemplateContextDataType.Object
        >;
      }
    | ({
        readonly dataType: TemplateContextDataType.Object;
      } & (
        | {
            readonly properties: Readonly<Record<string, TemplateContextEntryDefinitionCollectionProperty>>;
          }
        | {
            readonly valueDataType: Exclude<
              TemplateContextDataType,
              TemplateContextDataType.Array | TemplateContextDataType.Object
            >;
          }
      ))
  );

// TODO: Support sub-properties etc
export type TemplateContextEntryDefinitionCollectionProperty = {
  readonly dataType: TemplateContextDataType;
  readonly descriptionKey: IntlMessageKey;
};

export type TemplateContextEntryDefinitionOperationCategory = TemplateContextEntryDefinitionCategory & {
  readonly inputDataType: Exclude<
    TemplateContextDataType,
    TemplateContextDataType.Array | TemplateContextDataType.Object
  > | null;
  readonly outputDataType: Exclude<
    TemplateContextDataType,
    TemplateContextDataType.Array | TemplateContextDataType.Object
  > | null;
};

export type TemplateContextEntryDefinitionStandardCategory = TemplateContextEntryDefinitionCategory & {
  readonly dataType: Exclude<TemplateContextDataType, TemplateContextDataType.Array | TemplateContextDataType.Object>;
  /** @deprecated Deprecated since 2.0.0, use `Options` collection entry instead. */
  readonly isDeprecatedOption?: boolean;
};

export type TemplateContextEntryNestedRenderer = (
  text: string,
  render: (template: string) => Promise<string>,
) => TemplateContextEntryValue | Promise<TemplateContextEntryValue>;

export type TemplateContextEntryRenderer = (manager: TemplateContextManager) => TemplateContextEntry;

export type TemplateContextEntryValue =
  | boolean
  | number
  | string
  | null
  | undefined
  | TemplateContextEntryArray
  | TemplateContextEntryReadonlyArray
  | TemplateContextEntryRecord;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TemplateContextEntryArray extends Array<TemplateContextEntryValue> {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TemplateContextEntryReadonlyArray extends Readonly<Array<TemplateContextEntryValue>> {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TemplateContextEntryRecord extends Record<string, TemplateContextEntryValue> {}
