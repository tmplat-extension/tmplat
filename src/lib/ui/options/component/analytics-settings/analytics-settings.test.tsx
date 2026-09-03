import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderUi } from 'extension/test/ui';
import { AnalyticsSettings } from 'extension/ui/options/component/analytics-settings/analytics-settings';

describe('AnalyticsSettings', () => {
  it('renders the section and switch from localized message keys', () => {
    renderUi(<AnalyticsSettings onChange={vi.fn()} settings={{ enabled: true }} />);

    expect(screen.getByText('settings_analytics_title')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'settings_analytics_enabled_label' })).toBeChecked();
  });

  it('reports the whole settings object with only `enabled` changed', async () => {
    const onChange = vi.fn();
    renderUi(<AnalyticsSettings onChange={onChange} settings={{ enabled: false }} />);

    await userEvent.click(screen.getByRole('switch', { name: 'settings_analytics_enabled_label' }));

    expect(onChange).toHaveBeenCalledWith({ enabled: true });
  });
});
