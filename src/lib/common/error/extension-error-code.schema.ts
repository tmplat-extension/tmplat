import { z } from 'zod';
import { type ExtensionErrorCode } from 'extension/common/error/extension-error-code';

export const ExtensionErrorCodeSchema = z
  .string()
  .regex(/^[A-Z]{3}[1-9][0-9]{5}$/)
  .transform((value) => value as ExtensionErrorCode)
  .meta({ id: 'ExtensionErrorCode' });
