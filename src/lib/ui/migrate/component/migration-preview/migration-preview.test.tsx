import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataMigrationManagerRequiredMigrations } from 'extension/common/data/migration/data-migration-manager';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { legacyMigrationVersion, nonMigrationVersion } from 'extension/test/migration.fake';
import { renderUi } from 'extension/test/ui';
import { MigrationPreview } from 'extension/ui/migrate/component/migration-preview/migration-preview';

const requiredMigrations: DataMigrationManagerRequiredMigrations = {
  migrations: [
    {
      namespaces: [
        {
          namespace: DataNamespace.Template,
          namespaceTitle: 'Templates',
          steps: ['Read legacy templates', 'Shared cleanup step'],
        },
        {
          namespace: DataNamespace.UrlShortener,
          namespaceTitle: 'URL shorteners',
          steps: ['Move YOURLS settings', 'Shared cleanup step'],
        },
      ],
      version: legacyMigrationVersion,
    },
    {
      namespaces: [
        {
          namespace: DataNamespace.Notification,
          namespaceTitle: 'Notifications',
          steps: ['Migrate notification settings'],
        },
      ],
      version: '2.0.0' as ExtensionVersion,
    },
  ],
  version: nonMigrationVersion,
};

const createDataMigrationManagerStub = () => ({
  exportLegacyData: vi.fn(async () => ({ local: { legacy: true }, session: { transient: false } })),
  getRequiredMigrations: vi.fn(),
  migrate: vi.fn(),
  removeLegacyData: vi.fn(),
  retryMigration: vi.fn(),
});

const renderMigrationPreview = () => {
  const dataMigrationManager = createDataMigrationManagerStub();
  const onStart = vi.fn();

  renderUi(<MigrationPreview onStart={onStart} requiredMigrations={requiredMigrations} />, {
    contexts: { dataMigrationManager },
  });

  return { dataMigrationManager, onStart };
};

describe('MigrationPreview', () => {
  it('renders every migration version heading, namespace title and step description without key collisions', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    renderMigrationPreview();

    expect(screen.getAllByRole('heading', { level: 2, name: 'migrate_preview_version_heading' })).toHaveLength(2);
    expect(screen.getByRole('heading', { level: 3, name: 'Templates' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'URL shorteners' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByText('Read legacy templates')).toBeInTheDocument();
    expect(screen.getAllByText('Shared cleanup step')).toHaveLength(2);
    expect(screen.getByText('Move YOURLS settings')).toBeInTheDocument();
    expect(screen.getByText('Migrate notification settings')).toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('calls only onStart when the start button is clicked', async () => {
    const { dataMigrationManager, onStart } = renderMigrationPreview();

    expect(dataMigrationManager.exportLegacyData).not.toHaveBeenCalled();
    expect(dataMigrationManager.getRequiredMigrations).not.toHaveBeenCalled();
    expect(dataMigrationManager.migrate).not.toHaveBeenCalled();
    expect(dataMigrationManager.removeLegacyData).not.toHaveBeenCalled();
    expect(dataMigrationManager.retryMigration).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'migrate_preview_start_button' }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(dataMigrationManager.exportLegacyData).not.toHaveBeenCalled();
    expect(dataMigrationManager.getRequiredMigrations).not.toHaveBeenCalled();
    expect(dataMigrationManager.migrate).not.toHaveBeenCalled();
    expect(dataMigrationManager.removeLegacyData).not.toHaveBeenCalled();
    expect(dataMigrationManager.retryMigration).not.toHaveBeenCalled();
  });

  it('exports the legacy data as a revoked object URL download', async () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:legacy-data');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const { dataMigrationManager } = renderMigrationPreview();

    await userEvent.click(screen.getByRole('button', { name: 'migrate_preview_export_button' }));

    await waitFor(() => expect(dataMigrationManager.exportLegacyData).toHaveBeenCalledTimes(1));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    await expect((createObjectURL.mock.calls[0]![0] as Blob).text()).resolves.toBe(
      JSON.stringify({ local: { legacy: true }, session: { transient: false } }, undefined, 2),
    );
    expect(click).toHaveBeenCalledTimes(1);
    expect(click.mock.contexts[0]).toMatchObject({
      download: 'tmplat-legacy-data.json',
      href: 'blob:legacy-data',
    });
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:legacy-data');
  });

  it('shows and dismisses an error alert when exporting legacy data fails', async () => {
    const dataMigrationManager = {
      ...createDataMigrationManagerStub(),
      exportLegacyData: vi.fn(async () => Promise.reject(new Error('Export failed'))),
    };

    renderUi(<MigrationPreview onStart={vi.fn()} requiredMigrations={requiredMigrations} />, {
      contexts: { dataMigrationManager },
    });

    await userEvent.click(screen.getByRole('button', { name: 'migrate_preview_export_button' }));

    expect(await screen.findByText('migrate_error_fallback')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByText('migrate_error_fallback')).not.toBeInTheDocument();
  });
});
