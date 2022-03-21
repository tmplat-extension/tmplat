import Joi from 'joi';

import { GetTabContextMessageReply } from 'extension/tab/message/get-tab-context-message.model';
import {
  TabContext,
  TabContextDictionary,
  TabContextDimension,
  TabContextSelection,
  TabContextStorage,
} from 'extension/tab/tab.model';

export const getTabContextMessageSchema = Joi.any().valid(null);

export const getTabContextMessageReplyContextDimensionSchema = Joi.object<TabContextDimension>({
  height: Joi.number().required(),
  width: Joi.number().required(),
});

export const getTabContextMessageReplyContextSelectionSchema = Joi.object<TabContextSelection>({
  images: Joi.array().items(Joi.string()).required(),
  links: Joi.array().items(Joi.string()).required(),
  html: Joi.string().required(),
  text: Joi.string().required(),
});

export const getTabContextMessageReplyContextDictionarySchema = Joi.object<TabContextDictionary>().pattern(
  /./,
  Joi.string(),
);

export const getTabContextMessageReplyContextStorageSchema = Joi.object<TabContextStorage>({
  local: getTabContextMessageReplyContextDictionarySchema.required(),
  session: getTabContextMessageReplyContextDictionarySchema.required(),
});

export const getTabContextMessageReplyContextSchema = Joi.object<TabContext>({
  characterSet: Joi.string().required(),
  html: Joi.string().required(),
  images: Joi.array().items(Joi.string()).required(),
  lastModified: Joi.string().required(),
  links: Joi.array().items(Joi.string()).required(),
  meta: getTabContextMessageReplyContextDictionarySchema.required(),
  referrer: Joi.string().required(),
  screenColorDepth: Joi.number().required(),
  scripts: Joi.array().items(Joi.string()).required(),
  selection: getTabContextMessageReplyContextSelectionSchema.required(),
  size: getTabContextMessageReplyContextDimensionSchema.required(),
  storage: getTabContextMessageReplyContextStorageSchema.required(),
  styleSheets: Joi.array().items(Joi.string()).required(),
});

export const getTabContextMessageReplySchema = Joi.object<GetTabContextMessageReply>({
  context: getTabContextMessageReplyContextSchema.required(),
});
