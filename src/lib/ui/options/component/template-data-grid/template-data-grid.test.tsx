import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { type Template } from 'extension/template/template.model';
import { type TemplateService } from 'extension/template/template.service';
import { renderUi } from 'extension/test/ui';
import { TemplateDataGrid } from 'extension/ui/options/component/template-data-grid/template-data-grid';
import { createPredefinedTemplate, createUserTemplate } from 'extension/ui/options/test-fixtures';

const firstTemplate = createUserTemplate({
  content: 'Hello {title}',
  description: 'Copies the page title',
  id: 'user-1',
  shortcut: 'Z',
  title: 'Title template',
});
const secondTemplate = createUserTemplate({
  content: '{url}',
  description: 'Copies the page url',
  enabled: false,
  id: 'user-2',
  shortcut: null,
  title: 'Url template',
});
const predefinedTemplate = createPredefinedTemplate({ id: 'predefined-1' });

const predefinedTitle = 'Markdown';
const predefinedDescription = 'Copies as Markdown';

/**
 * Renders the grid over stubs, returning a handle on each collaborator.
 *
 * The MUI `DataGrid` renders for real under jsdom (rows, checkboxes and menus are all reachable), so assertions go
 * through accessible roles and text rather than through the component's internal state.
 */
const setup = ({
  loadFails = false,
  query = '',
  templates = [firstTemplate, secondTemplate, predefinedTemplate] as Template[],
} = {}) => {
  const getTemplates = vi.fn<() => Promise<Template[]>>(async () => templates);

  if (loadFails) {
    getTemplates.mockRejectedValueOnce(new Error('boom'));
  }

  const templateService = {
    getTemplateDescription: vi.fn((template: Template) =>
      template.predefined ? predefinedDescription : template.description,
    ) as unknown as TemplateService['getTemplateDescription'],
    exportTemplates: vi.fn(() => '{"templates":[]}'),
    getTemplates,
    getTemplateTitle: vi.fn((template: Template) => (template.predefined ? predefinedTitle : template.title)),
    moveTemplate: vi.fn(async () => undefined),
    moveTemplates: vi.fn(async () => undefined),
    removeTemplates: vi.fn(async () => undefined),
    setTemplatesEnabled: vi.fn(async () => undefined),
  };
  const appearanceService = {
    getTemplateDataGridState: vi.fn(async () => ({ columnVisibilityModel: {}, pageSize: 10 })),
    setTemplateDataGridState: vi.fn(async () => undefined),
  };

  const result = renderUi(<TemplateDataGrid query={query} />, {
    contexts: { appearanceService, templateService },
  });

  return { ...result, appearanceService, getTemplates, templateService, user: userEvent.setup() };
};

/** Waits for the initial load to settle, then returns the titles of the rendered rows in display order. */
const getRowTitles = async (): Promise<string[]> => {
  await waitFor(() => expect(screen.getAllByRole('row').length).toBeGreaterThan(1));

  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.querySelector('[data-field="title"]')!.textContent!.trim());
};

/** Selects a row by its visible title, via the grid's own selection checkbox. */
const selectRow = async (user: ReturnType<typeof userEvent.setup>, title: string): Promise<void> => {
  const row = (await screen.findByText(title)).closest('[role="row"]')!;

  await user.click(within(row as HTMLElement).getByRole('checkbox'));
};

/** Opens the per-row actions menu for the row with the given title. */
const openRowMenu = async (user: ReturnType<typeof userEvent.setup>, title: string): Promise<HTMLElement> => {
  const row = (await screen.findByText(title)).closest('[role="row"]')!;

  await user.click(within(row as HTMLElement).getByRole('button', { name: 'template_grid_row_actions_label' }));

  return screen.getByRole('menu');
};

describe('TemplateDataGrid', () => {
  describe('loading', () => {
    it('renders a row per template', async () => {
      setup();

      expect(await getRowTitles()).toEqual(['Title template', 'Url template', predefinedTitle]);
    });

    it('renders the description, content and modified shortcut of a template', async () => {
      setup({ templates: [firstTemplate] });

      const row = (await screen.findByText('Title template')).closest('[role="row"]')!;

      expect(within(row as HTMLElement).getByText('Copies the page title')).toBeInTheDocument();
      expect(within(row as HTMLElement).getByText('Hello {title}')).toBeInTheDocument();
      // The shortcut is shown with its platform modifier prefix, not bare
      expect(within(row as HTMLElement).getByText(/Z$/)).toBeInTheDocument();
    });

    it('resolves a predefined template through the template service rather than reading it off the model', async () => {
      const { templateService } = setup({ templates: [predefinedTemplate] });

      expect(await screen.findByText(predefinedTitle)).toBeInTheDocument();
      expect(screen.getByText(predefinedDescription)).toBeInTheDocument();
      expect(templateService.getTemplateTitle).toHaveBeenCalledWith(predefinedTemplate);
    });

    it('shows an error with a retry action when loading fails', async () => {
      const { getTemplates, user } = setup({ loadFails: true });

      const alert = await screen.findByRole('alert');

      expect(alert).toHaveTextContent('app_error_unknown_message');

      getTemplates.mockResolvedValue([firstTemplate]);

      await user.click(within(alert).getByRole('button', { name: 'template_grid_retry_button' }));

      expect(await screen.findByText('Title template')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    // Regression guard. MUI renders its built-in close button only when `action == null` (Alert.js:240), so
    // `action={loadFailed && <Button .../>}` supplied `false` for an action error - not `== null` - which
    // suppressed the close button and left `onClose` unreachable in both branches.
    it('can dismiss an action error', async () => {
      const { templateService, user } = setup();

      templateService.setTemplatesEnabled.mockRejectedValue(new Error('boom'));

      await selectRow(user, 'Title template');
      await user.click(await screen.findByRole('button', { name: /template_grid_toggle_button/ }));
      await user.click(screen.getByRole('menuitem', { name: 'template_grid_disable_option' }));

      const alert = await screen.findByRole('alert');

      await user.click(within(alert).getByRole('button', { name: 'Close' }));

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    // A load error replaces the close button with retry, which is deliberate - retrying is the only useful
    // action, and a successful reload clears the error anyway (asserted above).
    it('offers retry rather than dismiss for a load error', async () => {
      setup({ loadFails: true });

      const alert = await screen.findByRole('alert');

      expect(within(alert).getByRole('button', { name: 'template_grid_retry_button' })).toBeInTheDocument();
      expect(within(alert).queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    });
  });

  describe('query', () => {
    it.each([
      ['a title', 'title template', ['Title template']],
      ['a description', 'page url', ['Url template']],
      ['content', '{url}', ['Url template', predefinedTitle]],
      ['a shortcut', 'z', ['Title template']],
    ])('filters on %s', async (_description, query, expected) => {
      setup({ query });

      expect(await getRowTitles()).toEqual(expected);
    });

    it('returns every template for a blank or whitespace-only query', async () => {
      setup({ query: '   ' });

      expect(await getRowTitles()).toHaveLength(3);
    });

    it('matches a template with no description or shortcut without throwing', async () => {
      setup({ query: 'url template', templates: [secondTemplate] });

      expect(await getRowTitles()).toEqual(['Url template']);
    });

    it('renders no rows when nothing matches', async () => {
      setup({ query: 'no-such-template' });

      await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(1));
    });
  });

  describe('selection', () => {
    it('reveals the bulk action bar with a count once a row is selected', async () => {
      const { user } = setup();

      expect(screen.queryByText('template_grid_selected_label')).not.toBeInTheDocument();

      await selectRow(user, 'Title template');

      expect(await screen.findByText('template_grid_selected_label')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /template_grid_select_all_button/ })).toBeInTheDocument();
    });

    it('selects every row via the select all action', async () => {
      const { user } = setup();

      await selectRow(user, 'Title template');
      await user.click(screen.getByRole('button', { name: /template_grid_select_all_button/ }));

      await waitFor(() => expect(screen.getAllByRole('checkbox', { checked: true })).toHaveLength(4));
    });

    it('clears the selection', async () => {
      const { user } = setup();

      await selectRow(user, 'Title template');
      await user.click(await screen.findByRole('button', { name: 'template_grid_clear_all_tooltip' }));

      await waitFor(() => expect(screen.queryByText('template_grid_selected_label')).not.toBeInTheDocument());
    });

    // The grid reports a "select all" as the rows that are *excluded*, so the component has to invert it
    it('counts an inverted (exclude) selection correctly', async () => {
      const { user } = setup();

      await user.click(within(screen.getAllByRole('row')[0]!).getByRole('checkbox'));

      expect(await screen.findByText('3')).toBeInTheDocument();
    });
  });

  describe('bulk actions', () => {
    it('enables and disables the selected templates', async () => {
      const { templateService, user } = setup();

      await selectRow(user, 'Title template');
      await user.click(await screen.findByRole('button', { name: /template_grid_toggle_button/ }));
      await user.click(screen.getByRole('menuitem', { name: 'template_grid_disable_option' }));

      expect(templateService.setTemplatesEnabled).toHaveBeenCalledExactlyOnceWith(['user-1'], false);
      expect(templateService.getTemplates).toHaveBeenCalledTimes(2);
    });

    // "Enable" is pointless when every selected template is already enabled, and vice versa
    it('offers only the applicable toggle for the selection', async () => {
      const { user } = setup();

      await selectRow(user, 'Title template');
      await user.click(await screen.findByRole('button', { name: /template_grid_toggle_button/ }));

      expect(screen.getByRole('menuitem', { name: 'template_grid_enable_option' })).toHaveAttribute('aria-disabled');
      expect(screen.getByRole('menuitem', { name: 'template_grid_disable_option' })).not.toHaveAttribute(
        'aria-disabled',
      );
    });

    it('moves the selected templates to the top and bottom', async () => {
      const { templateService, user } = setup();

      await selectRow(user, 'Title template');
      await user.click(await screen.findByRole('button', { name: /template_grid_move_button/ }));
      await user.click(screen.getByRole('menuitem', { name: 'template_grid_bulk_move_top_option' }));

      expect(templateService.moveTemplates).toHaveBeenCalledExactlyOnceWith(['user-1'], 'top');

      await user.click(screen.getByRole('button', { name: /template_grid_move_button/ }));
      await user.click(screen.getByRole('menuitem', { name: 'template_grid_bulk_move_bottom_option' }));

      expect(templateService.moveTemplates).toHaveBeenLastCalledWith(['user-1'], 'bottom');
    });

    it('deletes the selected templates once confirmed, and clears the selection', async () => {
      const { templateService, user } = setup();

      await selectRow(user, 'Title template');
      await selectRow(user, 'Url template');
      await user.click(await screen.findByRole('button', { name: /template_grid_delete_button/ }));

      const dialog = await screen.findByRole('dialog');

      expect(within(dialog).getByText('template_grid_delete_confirm_content_plural')).toBeInTheDocument();

      await user.click(within(dialog).getByRole('button', { name: 'template_grid_delete_button' }));

      expect(templateService.removeTemplates).toHaveBeenCalledExactlyOnceWith(['user-1', 'user-2']);
      await waitFor(() => expect(screen.queryByText('template_grid_selected_label')).not.toBeInTheDocument());
    });

    it('uses the singular confirmation for a single template', async () => {
      const { user } = setup();

      await selectRow(user, 'Title template');
      await user.click(await screen.findByRole('button', { name: /template_grid_delete_button/ }));

      expect(
        within(await screen.findByRole('dialog')).getByText('template_grid_delete_confirm_content_singular'),
      ).toBeInTheDocument();
    });

    it('does not delete when the confirmation is cancelled', async () => {
      const { templateService, user } = setup();

      await selectRow(user, 'Title template');
      await user.click(await screen.findByRole('button', { name: /template_grid_delete_button/ }));

      const dialog = await screen.findByRole('dialog');

      await user.click(within(dialog).getByRole('button', { name: 'app_confirm_cancel_button' }));

      expect(templateService.removeTemplates).not.toHaveBeenCalled();
    });

    // Predefined templates are bundled with the extension, so they can only be disabled, never removed
    it('refuses to delete a selection containing a predefined template', async () => {
      const { user } = setup();

      await selectRow(user, predefinedTitle);

      expect(await screen.findByRole('button', { name: /template_grid_delete_button/ })).toBeDisabled();
    });

    it('opens the export dialog for the selected templates', async () => {
      const { user } = setup();

      await selectRow(user, 'Title template');
      await user.click(await screen.findByRole('button', { name: /template_grid_export_button/ }));

      expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('surfaces a failed bulk action as an error without a retry action', async () => {
      const { templateService, user } = setup();

      templateService.setTemplatesEnabled.mockRejectedValue(new Error('boom'));

      await selectRow(user, 'Title template');
      await user.click(await screen.findByRole('button', { name: /template_grid_toggle_button/ }));
      await user.click(screen.getByRole('menuitem', { name: 'template_grid_disable_option' }));

      const alert = await screen.findByRole('alert');

      expect(alert).toHaveTextContent('app_error_unknown_message');
      expect(within(alert).queryByRole('button', { name: 'template_grid_retry_button' })).not.toBeInTheDocument();
    });
  });

  describe('row actions', () => {
    it('offers disable for an enabled template and enable for a disabled one', async () => {
      const { user } = setup();

      expect(
        within(await openRowMenu(user, 'Title template')).getByText('template_grid_disable_option'),
      ).toBeInTheDocument();

      await user.keyboard('{Escape}');

      expect(
        within(await openRowMenu(user, 'Url template')).getByText('template_grid_enable_option'),
      ).toBeInTheDocument();
    });

    it('toggles a single template', async () => {
      const { templateService, user } = setup();

      const menu = await openRowMenu(user, 'Url template');

      await user.click(within(menu).getByRole('menuitem', { name: 'template_grid_enable_option' }));

      expect(templateService.setTemplatesEnabled).toHaveBeenCalledExactlyOnceWith(['user-2'], true);
    });

    it.each([
      ['template_grid_move_to_top_option', 0],
      ['template_grid_bulk_move_up_option', 0],
    ])('disables %s for the first template', async (name) => {
      const { user } = setup();

      expect(within(await openRowMenu(user, 'Title template')).getByRole('menuitem', { name })).toHaveAttribute(
        'aria-disabled',
      );
    });

    it.each(['template_grid_move_to_bottom_option', 'template_grid_bulk_move_down_option'])(
      'disables %s for the last template',
      async (name) => {
        const { user } = setup();

        expect(within(await openRowMenu(user, predefinedTitle)).getByRole('menuitem', { name })).toHaveAttribute(
          'aria-disabled',
        );
      },
    );

    it.each([
      ['template_grid_move_to_top_option', 0],
      ['template_grid_bulk_move_up_option', 0],
      ['template_grid_bulk_move_down_option', 2],
      ['template_grid_move_to_bottom_option', 2],
    ])('moves a template via %s', async (name, expectedIndex) => {
      const { templateService, user } = setup();

      const menu = await openRowMenu(user, 'Url template');

      await user.click(within(menu).getByRole('menuitem', { name }));

      expect(templateService.moveTemplate).toHaveBeenCalledExactlyOnceWith('user-2', expectedIndex);
    });

    it('refuses to delete a predefined template', async () => {
      const { user } = setup();

      expect(
        within(await openRowMenu(user, predefinedTitle)).getByRole('menuitem', {
          name: 'template_grid_delete_button',
        }),
      ).toHaveAttribute('aria-disabled');
    });

    it('confirms before deleting a single template from the row menu', async () => {
      const { templateService, user } = setup();

      const menu = await openRowMenu(user, 'Title template');

      await user.click(within(menu).getByRole('menuitem', { name: 'template_grid_delete_button' }));

      const dialog = await screen.findByRole('dialog');

      await user.click(within(dialog).getByRole('button', { name: 'template_grid_delete_button' }));

      expect(templateService.removeTemplates).toHaveBeenCalledExactlyOnceWith(['user-1']);
    });

    it('opens the editor for a template', async () => {
      const { user } = setup();

      const menu = await openRowMenu(user, 'Title template');

      await user.click(within(menu).getByRole('menuitem', { name: 'template_grid_edit_option' }));

      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Title template')).toBeInTheDocument();
    });

    // Cloning must not prefill the id, or saving would overwrite the original
    it('opens the editor prefilled from a template when cloning', async () => {
      const { user } = setup();

      const menu = await openRowMenu(user, 'Title template');

      await user.click(within(menu).getByRole('menuitem', { name: 'template_grid_clone_option' }));

      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Hello {title}')).toBeInTheDocument();
    });
  });

  describe('toolbar', () => {
    it('opens an empty editor from the add button', async () => {
      const { user } = setup();

      await user.click(await screen.findByRole('button', { name: /template_grid_add_button/ }));

      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Title template')).not.toBeInTheDocument();
    });

    it('opens the import dialog', async () => {
      const { user } = setup();

      await user.click(await screen.findByRole('button', { name: /template_grid_import_button/ }));

      expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('opens the editor on a row double click', async () => {
      const { user } = setup();

      await user.dblClick(await screen.findByText('Title template'));

      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Title template')).toBeInTheDocument();
    });

    // The row menu trigger lives inside a row, so its click must not also select the row or open the editor
    it('does not select the row or open the editor when the row menu is opened', async () => {
      const { user } = setup();

      await openRowMenu(user, 'Title template');

      expect(screen.queryByText('template_grid_selected_label')).not.toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('appearance state', () => {
    it('restores the persisted page size and hidden columns on mount', async () => {
      const { appearanceService } = setup();

      appearanceService.getTemplateDataGridState.mockResolvedValue({
        columnVisibilityModel: { content: false },
        pageSize: 20,
      });

      await waitFor(() => expect(appearanceService.getTemplateDataGridState).toHaveBeenCalledOnce());
    });

    it('persists the grid state when the page changes', async () => {
      const many = Array.from({ length: 12 }, (_, i) =>
        createUserTemplate({ id: `many-${i}`, title: `Many ${i}` }),
      ) as Template[];
      const { appearanceService, user } = setup({ templates: many });

      await getRowTitles();
      await user.click(screen.getByRole('button', { name: /next page/i }));

      await waitFor(() =>
        expect(appearanceService.setTemplateDataGridState).toHaveBeenCalledWith({
          columnVisibilityModel: {},
          pageSize: 10,
        }),
      );
    });

    it('surfaces a failure to persist the grid state as an error', async () => {
      const many = Array.from({ length: 12 }, (_, i) =>
        createUserTemplate({ id: `many-${i}`, title: `Many ${i}` }),
      ) as Template[];
      const { appearanceService, user } = setup({ templates: many });

      appearanceService.setTemplateDataGridState.mockRejectedValue(new Error('boom'));

      await getRowTitles();
      await user.click(screen.getByRole('button', { name: /next page/i }));

      expect(await screen.findByRole('alert')).toBeInTheDocument();
    });

    // The column menu icon is only revealed on hover, so it is `visibility: hidden` in jsdom - hence the
    // `hidden`/`pointerEventsCheck` escape hatches rather than a plain click.
    it('persists the column visibility model when a column is hidden', async () => {
      const { appearanceService } = setup();
      const user = userEvent.setup({ pointerEventsCheck: 0 });

      await getRowTitles();

      const header = screen
        .getAllByRole('columnheader', { hidden: true })
        .find((columnHeader) => columnHeader.dataset.field === 'content');

      await user.click(header!.querySelector('button[aria-haspopup="menu"]')!);
      await user.click(await screen.findByRole('menuitem', { name: /hide/i }));

      await waitFor(() =>
        expect(appearanceService.setTemplateDataGridState).toHaveBeenCalledWith({
          columnVisibilityModel: expect.objectContaining({ content: false }),
          pageSize: 10,
        }),
      );
    });

    it('hides a column that the persisted state marks as hidden', async () => {
      const templateService = {
        getTemplateDescription: vi.fn(() => null),
        getTemplates: vi.fn(async () => [firstTemplate]),
        getTemplateTitle: vi.fn(() => 'Title template'),
      };

      renderUi(<TemplateDataGrid />, {
        contexts: {
          appearanceService: {
            getTemplateDataGridState: vi.fn(async () => ({
              columnVisibilityModel: { content: false },
              pageSize: 10,
            })),
            setTemplateDataGridState: vi.fn(async () => undefined),
          },
          templateService: templateService as never,
        },
      });

      expect(await screen.findByText('Title template')).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByText('Hello {title}')).not.toBeInTheDocument());
    });

    // Non-critical: the grid must still render on its defaults rather than failing to mount
    it('still renders when the persisted state cannot be read', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const templateService = {
        exportTemplates: vi.fn(() => ''),
        getTemplateDescription: vi.fn(() => null),
        getTemplates: vi.fn(async () => [firstTemplate]),
        getTemplateTitle: vi.fn(() => 'Title template'),
      };

      renderUi(<TemplateDataGrid />, {
        contexts: {
          appearanceService: {
            getTemplateDataGridState: vi.fn(async () => {
              throw new Error('boom');
            }),
            setTemplateDataGridState: vi.fn(async () => undefined),
          },
          templateService: templateService as never,
        },
      });

      expect(await screen.findByText('Title template')).toBeInTheDocument();
      await waitFor(() =>
        expect(warn).toHaveBeenCalledWith('Failed to restore template data grid appearance state:', expect.any(Error)),
      );
    });
  });
});
