import { AppearanceMode } from 'extension/common/appearance/appearance-mode.enum';
import {
  DEFAULT_TEMPLATE_DATA_GRID_APPEARANCE,
  TemplateDataGridAppearance,
} from 'extension/common/appearance/data/appearance-data.model';
import {
  AppearanceDataRepository,
  AppearanceDataRepositoryToken,
} from 'extension/common/appearance/data/appearance-data.repository';
import { inject, injectable } from 'extension/common/di';

export const AppearanceServiceToken = Symbol('AppearanceService');

const systemPrefersDarkQuery = '(prefers-color-scheme: dark)';

/**
 * Resolves the user's chosen {@link AppearanceMode} to the concrete `light`/`dark` palette that should actually be
 * rendered, falling back to the browser/OS preference whenever `system` is selected, and notifies listeners
 * whenever either the stored preference or the system preference changes so that every surface (options, popup,
 * migration) can react immediately without requiring a reload.
 */
@injectable()
export class AppearanceService {
  constructor(@inject(AppearanceDataRepositoryToken) private readonly repository: AppearanceDataRepository) {}

  addResolvedModeChangeListener(listener: (resolvedMode: AppearanceResolvedMode) => void): () => void {
    const notify = () => {
      this.getResolvedMode().then(listener);
    };

    const systemQuery = matchMedia(systemPrefersDarkQuery);
    this.repository.addChangeListener(notify);
    systemQuery.addEventListener('change', notify);

    return () => {
      systemQuery.removeEventListener('change', notify);
    };
  }

  /**
   * Keeps `target`'s `color-scheme` CSS property in sync with the resolved appearance mode, applying immediately
   * and on every subsequent change. This affects browser-rendered UI (e.g. form controls, scrollbars) even on pages
   * that have no dedicated theming of their own (e.g. the migration UI).
   */
  applyToDocument(target: HTMLElement = document.documentElement): () => void {
    const apply = (resolvedMode: AppearanceResolvedMode) => {
      target.style.colorScheme = resolvedMode;
    };

    this.getResolvedMode().then(apply);

    return this.addResolvedModeChangeListener(apply);
  }

  async getMode(): Promise<AppearanceMode> {
    const { mode } = await this.repository.get();
    return mode;
  }

  async getResolvedMode(): Promise<AppearanceResolvedMode> {
    return AppearanceService.resolveMode(await this.getMode());
  }

  async setMode(mode: AppearanceMode): Promise<void> {
    await this.repository.mutate((data) => ({ ...data, mode }));
  }

  async getTemplateDataGridState(): Promise<TemplateDataGridAppearance> {
    const { templateDataGrid } = await this.repository.get();
    return templateDataGrid ?? DEFAULT_TEMPLATE_DATA_GRID_APPEARANCE;
  }

  async setTemplateDataGridState(templateDataGrid: TemplateDataGridAppearance): Promise<void> {
    await this.repository.mutate((data) => ({ ...data, templateDataGrid }));
  }

  private static resolveMode(mode: AppearanceMode): AppearanceResolvedMode {
    switch (mode) {
      case AppearanceMode.Dark:
        return 'dark';
      case AppearanceMode.Light:
        return 'light';
      case AppearanceMode.System:
      default:
        return matchMedia(systemPrefersDarkQuery).matches ? 'dark' : 'light';
    }
  }
}

/**
 * The concrete palette that should be rendered once `AppearanceMode.System` has been resolved against the current
 * browser/OS preference.
 */
export type AppearanceResolvedMode = 'dark' | 'light';
