import { decodeBase64 as decodeBase64Fn } from 'extension/common/codec/base64.utils';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTrimmedContentRenderer } from 'extension/template/context/template-context.utils';

export const decodeBase64: TemplateContextEntryDefinition = {
  name: TemplateContextName.DecodeBase64,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: IntlMessageKey.ContextDecodeBase64OperationDescription,
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
    },
  },
  render: createTrimmedContentRenderer((content) => decodeBase64Fn(content)),
};
