import Joi from 'joi';
import { Changelog, ChangelogEntry } from 'extension/common/changelog/changelog.model';
import { getEnumStringValues } from 'extension/common/enum.utils';
import { ExtensionVersion } from 'extension/common/extension-version.enum';

const changesSchema = Joi.array().items(Joi.string().min(1)).min(1);

export const changelogEntrySchema = Joi.object<ChangelogEntry>({
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  features: changesSchema,
  fixes: changesSchema,
  improvements: changesSchema,
  knownIssues: changesSchema,
  version: Joi.string()
    .valid(...getEnumStringValues(ExtensionVersion))
    .required(),
});

export const changelogSchema = Joi.array<Changelog>().items(changelogEntrySchema);
