import { type z } from 'zod';
import { type FieldError } from 'extension/common/error/field-error.schema';

export const convertZodErrorToFieldErrors = <Output>(err: z.ZodError<Output>, parentPath?: string[]): FieldError[] =>
  err.issues.map((issue) => convertZodIssueToFieldError(issue, parentPath));

export const convertZodIssueToFieldError = (issue: z.core.$ZodIssue, parentPath?: string[]): FieldError => ({
  message: issue.message,
  path: [...(parentPath || []), ...issue.path.map((path) => path.toString())],
  type: issue.code || 'custom',
});
