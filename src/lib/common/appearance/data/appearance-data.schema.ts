import { z } from 'zod';
import { AppearanceMode } from 'extension/common/appearance/appearance-mode.enum';

export const DEFAULT_TEMPLATE_DATA_GRID_APPEARANCE: AppearanceDataGrid = {
  columnVisibilityModel: {},
  pageSize: 20,
};

export const AppearanceDataGridSchema = z
  .object({
    columnVisibilityModel: z.record(z.string(), z.boolean()),
    pageSize: z.number().int().min(1),
  })
  .meta({ id: 'AppearanceDataGrid' });

export type AppearanceDataGrid = z.infer<typeof AppearanceDataGridSchema>;

export const AppearanceDataSchema = z
  .object({
    mode: z.enum(AppearanceMode),
    templateDataGrid: AppearanceDataGridSchema.optional(),
  })
  .meta({ id: 'AppearanceData' });

export type AppearanceData = z.infer<typeof AppearanceDataSchema>;
