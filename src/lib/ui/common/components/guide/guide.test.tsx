import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { type IntlMessageKey } from 'extension/common/intl/intl-message-key';
import { type Substitution } from 'extension/common/intl/intl.model';
import { type IntlService } from 'extension/common/intl/intl.service';
import { createIntlServiceMock } from 'extension/test/intl.mock';
import { renderUi } from 'extension/test/ui';
import { Guide } from 'extension/ui/common/components/guide/guide';
import {
  getCollectionGuideEntries,
  getOperationGuideEntries,
  getPropertyGuideEntries,
  getStandardGuideEntries,
} from 'extension/ui/common/components/guide/guide.utils';

const setup = (props: { onClose?: () => void; onOpenInNewTab?: () => void } = {}) => {
  const intl = createIntlServiceMock();

  renderUi(<Guide {...props} />, { contexts: { intl } });

  return { intl, user: userEvent.setup() };
};

const lastButton = (name: string | RegExp): HTMLElement => screen.getAllByRole('button', { name }).at(-1)!;

const main = (): HTMLElement => screen.getByRole('main');

const getRows = (): HTMLElement[] => within(main()).getAllByRole('row');

const expectActiveCategory = (title: string, expectedRows: number) => {
  expect(within(main()).getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
  expect(getRows()).toHaveLength(expectedRows + 1);
};

describe('Guide', () => {
  it('renders the introduction and navigation for every guide page', () => {
    setup();

    expect(screen.getByText('guide_title')).toBeInTheDocument();
    expect(within(main()).getByRole('heading', { level: 2, name: 'guide_introduction_title' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'guide_search_label' })).toHaveAttribute(
      'placeholder',
      'guide_search_placeholder',
    );

    for (const name of [
      'guide_page_introduction',
      'guide_page_standard',
      'guide_page_lists_objects',
      'guide_page_operations',
      'guide_page_options',
    ]) {
      expect(lastButton(new RegExp(name))).toBeInTheDocument();
    }
  });

  it('shows the close and open-in-new-tab actions only when their callbacks are supplied', async () => {
    const onClose = vi.fn();
    const onOpenInNewTab = vi.fn();
    const { user } = setup({ onClose, onOpenInNewTab });

    await user.click(lastButton('guide_close_button_label'));
    await user.click(lastButton('guide_open_in_new_tab_label'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onOpenInNewTab).toHaveBeenCalledTimes(1);
  });

  it('omits dialog-only actions in standalone usage', () => {
    setup();

    expect(screen.queryByRole('button', { name: 'guide_close_button_label' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'guide_open_in_new_tab_label' })).not.toBeInTheDocument();
  });

  it('renders every dynamically generated guide category with its expected entry count', async () => {
    const { user, intl } = setup();
    const service = intl as unknown as IntlService;

    const categories = [
      ['guide_page_standard', getStandardGuideEntries(service).length],
      ['guide_page_lists_objects', getCollectionGuideEntries(service).length],
      ['guide_page_operations', getOperationGuideEntries(service).length],
      ['guide_page_options', getPropertyGuideEntries(service).length],
    ] as const;

    for (const [title, expectedRows] of categories) {
      // oxlint-disable-next-line eslint/no-await-in-loop -- The same Guide instance is navigated page-by-page.
      await user.click(lastButton(new RegExp(title)));

      expectActiveCategory(title, expectedRows);
    }
  });

  it('filters the active category by entry name or alias', async () => {
    const { user, intl } = setup();
    const service = intl as unknown as IntlService;
    const expectedStandardMatches = getStandardGuideEntries(service).filter(
      (entry) => entry.name.toLowerCase().includes('title') || entry.aliases.some((alias) => alias.includes('title')),
    );

    await user.click(lastButton(/guide_page_standard/));
    await user.type(screen.getByRole('textbox', { name: 'guide_search_label' }), 'title');

    expectActiveCategory('guide_page_standard', expectedStandardMatches.length);
    for (const entry of expectedStandardMatches) {
      expect(within(main()).getByText(entry.name)).toBeInTheDocument();
    }
  });

  it('shows the empty-state message when a query removes every entry from the active category', async () => {
    const { user } = setup();

    await user.click(lastButton(/guide_page_operations/));
    await user.type(screen.getByRole('textbox', { name: 'guide_search_label' }), 'no-such-guide-entry');

    expect(within(main()).getByText('guide_entry_table_no_entries_message')).toBeInTheDocument();
    expect(within(main()).queryByRole('row')).not.toBeInTheDocument();
  });

  it('toggles the mobile navigation from the menu button', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'guide_open_menu_button_label' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.getByText('guide_title')).toBeInTheDocument();
  });

  it('localizes every rendered category description instead of rendering empty prose', async () => {
    const { user, intl } = setup();

    await user.click(lastButton(/guide_page_options/));

    expect(within(main()).getByText('guide_options_description')).toBeInTheDocument();
    expect(intl.getMessage).toHaveBeenCalledWith('guide_options_description');
    expect(intl.getMessage).not.toHaveBeenCalledWith('' as IntlMessageKey, ...([] as Substitution[]));
  });
});
