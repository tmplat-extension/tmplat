import MenuList from '@mui/material/MenuList';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { getBrowserApiMock } from 'extension/test/browser-api.mock';
import { renderUi } from 'extension/test/ui';
import { TemplateListOptionsItem } from 'extension/ui/popup/component/template-list-options-item/template-list-options-item';

describe('TemplateListOptionsItem', () => {
  it('opens the extension options page when selected', async () => {
    renderUi(
      <MenuList>
        <TemplateListOptionsItem tabIndex={3} />
      </MenuList>,
    );

    await userEvent.click(screen.getByRole('menuitem', { name: 'options' }));

    expect(getBrowserApiMock().runtime.openOptionsPage).toHaveBeenCalledTimes(1);
  });

  it('shows a localized error when the options page cannot be opened', async () => {
    getBrowserApiMock().runtime.openOptionsPage.mockRejectedValueOnce(new Error('Cannot open options'));
    const logger = {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      isLevelEnabled: vi.fn(() => true),
      trace: vi.fn(),
      warn: vi.fn(),
    };
    renderUi(
      <MenuList>
        <TemplateListOptionsItem />
      </MenuList>,
      { contexts: { logging: { getLogger: () => logger } } },
    );

    await userEvent.click(screen.getByRole('menuitem', { name: 'options' }));

    expect(await screen.findByText('popup_open_options_error')).toBeInTheDocument();
    expect(logger.error).toHaveBeenCalledWith('Failed to open options page:', expect.any(Error));
  });

  it('clears the error when dismissed', async () => {
    getBrowserApiMock().runtime.openOptionsPage.mockRejectedValueOnce(new Error('Cannot open options'));
    renderUi(
      <MenuList>
        <TemplateListOptionsItem />
      </MenuList>,
    );

    await userEvent.click(screen.getByRole('menuitem', { name: 'options' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByText('popup_open_options_error')).not.toBeInTheDocument());
  });
});
