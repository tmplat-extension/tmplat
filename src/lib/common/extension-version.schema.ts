import { z } from 'zod';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { isExtensionVersion } from 'extension/common/extension-version.utils';

export const ExtensionVersionSchema = z
  .custom<ExtensionVersion>(isExtensionVersion, { message: 'Invalid extension version' })
  .meta({ id: 'ExtensionVersion' });
