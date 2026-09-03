import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderUi } from 'extension/test/ui';
import { App } from 'extension/ui/popup/app/app';
import { createTemplatePopupInfo } from 'extension/ui/popup/test-fixtures';

const createAppearanceServiceStub = () => ({
  addResolvedModeChangeListener: vi.fn(() => vi.fn()),
  getResolvedMode: vi.fn(async () => 'light' as const),
});

const renderApp = (
  templateService = {
    getTemplatePopupInfo: vi.fn(async () => structuredClone(createTemplatePopupInfo({ templates: [] }))),
    getTemplateTitle: vi.fn((template: { title?: string; id: string }) => template.title ?? template.id),
  },
) => {
  const appearanceService = createAppearanceServiceStub();

  renderUi(<App />, { contexts: { appearanceService, templateService } });

  return { appearanceService, templateService };
};

describe('App', () => {
  it('renders the popup template list inside the themed app shell', async () => {
    const { appearanceService, templateService } = renderApp();

    expect(await screen.findByText('menu_empty')).toBeInTheDocument();
    expect(appearanceService.getResolvedMode).toHaveBeenCalledTimes(1);
    expect(appearanceService.addResolvedModeChangeListener).toHaveBeenCalledTimes(1);
    expect(templateService.getTemplatePopupInfo).toHaveBeenCalledTimes(1);
  });

  it('surfaces template-list load failures', async () => {
    const templateService = {
      getTemplatePopupInfo: vi.fn(async () => Promise.reject(new Error('Cannot load templates'))),
      getTemplateTitle: vi.fn(),
    };
    renderApp(templateService);

    expect(await screen.findByText('popup_error')).toBeInTheDocument();
    expect(templateService.getTemplatePopupInfo).toHaveBeenCalledTimes(1);
  });
});
