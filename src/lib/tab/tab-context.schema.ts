import { z } from 'zod';

export const TabContextLinkTargetSchema = z
  .object({
    html: z.string(),
    text: z.string(),
  })
  .meta({ id: 'TabContextLinkTargetSchema' });

export type TabContextLinkTarget = z.infer<typeof TabContextLinkTargetSchema>;

export const TabContextDimensionSchema = z
  .object({
    height: z.number(),
    width: z.number(),
  })
  .meta({ id: 'TabContextDimension' });

export type TabContextDimension = z.infer<typeof TabContextDimensionSchema>;

export const TabContextSelectionSchema = z
  .object({
    html: z.string(),
    images: z.array(z.string()),
    links: z.array(z.string()),
    text: z.string(),
  })
  .meta({ id: 'TabContextSelection' });

export type TabContextSelection = z.infer<typeof TabContextSelectionSchema>;

export const TabContextStorageSchema = z
  .object({
    local: z.record(z.string(), z.string().optional()),
    session: z.record(z.string(), z.string().optional()),
  })
  .meta({ id: 'TabContextStorage' });

export type TabContextStorage = z.infer<typeof TabContextStorageSchema>;

export const TabContextSchema = z
  .object({
    characterSet: z.string(),
    cookiesEnabled: z.boolean(),
    html: z.string(),
    images: z.array(z.string()),
    javaEnabled: z.boolean(),
    lastModified: z.string(),
    linkTarget: TabContextLinkTargetSchema.optional(),
    links: z.array(z.string()),
    meta: z.record(z.string(), z.string().optional()),
    plugins: z.array(z.string()),
    referrer: z.string(),
    screenColorDepth: z.number(),
    screenSize: TabContextDimensionSchema,
    scripts: z.array(z.string()),
    selection: TabContextSelectionSchema,
    size: TabContextDimensionSchema,
    storage: TabContextStorageSchema,
    styleSheets: z.array(z.string()),
    text: z.string(),
  })
  .meta({ id: 'TabContext' });

export type TabContext = z.infer<typeof TabContextSchema>;
