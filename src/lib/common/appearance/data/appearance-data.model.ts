import { AppearanceMode } from 'extension/common/appearance/appearance-mode.enum';

export type AppearanceData = {
  mode: AppearanceMode;
  templateDataGrid?: TemplateDataGridAppearance;
};

/**
 * Persisted UI state for the templates data grid on the Templates tab of the Options page, so that a user's chosen
 * page size and hidden columns survive a reload. Optional since it's only written once the grid has actually been
 * interacted with - existing installs (and a fresh install, before its default is first written) fall back to
 * {@link DEFAULT_TEMPLATE_DATA_GRID_APPEARANCE} instead.
 */
export type TemplateDataGridAppearance = {
  columnVisibilityModel: Record<string, boolean>;
  pageSize: number;
};

export const DEFAULT_TEMPLATE_DATA_GRID_APPEARANCE: TemplateDataGridAppearance = {
  columnVisibilityModel: {},
  pageSize: 20,
};
