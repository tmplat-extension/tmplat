import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderUi } from 'extension/test/ui';
import { GeneralSettings } from 'extension/ui/options/component/general-settings/general-settings';
import { createSettings } from 'extension/ui/options/test-fixtures';

const renderGeneralSettings = () => {
  const onChange = vi.fn();
  // Returning a fresh array per call mirrors production, where `getTemplates()` resolves a newly built array. A stub
  // returning one stable reference would let React's `setState` bail-out hide a re-render loop.
  const templateService = { getTemplates: vi.fn(async () => []) };

  renderUi(<GeneralSettings onChange={onChange} settings={createSettings().general} />, {
    contexts: { templateService },
  });

  return { onChange, templateService };
};

describe('GeneralSettings', () => {
  it('renders the toolbar button section once templates have loaded', async () => {
    renderGeneralSettings();

    expect(await screen.findByText('settings_general_toolbar_button_title')).toBeInTheDocument();
  });

  // Regression: this effect depends on `getErrorMessage` and sets state. While `useErrorMessage` returned a new
  // closure per render, the effect re-ran on every render and re-triggered itself indefinitely. Same root cause as
  // the `SettingsDialog` loop.
  it('loads templates exactly once', async () => {
    const { templateService } = renderGeneralSettings();

    await screen.findByText('settings_general_toolbar_button_title');
    await waitFor(() => expect(templateService.getTemplates).toHaveBeenCalled());

    expect(templateService.getTemplates).toHaveBeenCalledTimes(1);
  });
});
