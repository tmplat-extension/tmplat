/* oxlint-disable react/jsx-no-constructed-context-values -- Each provider value is a per-test service stub. */
import { screen, waitFor, within } from '@testing-library/react';
import { DateTime } from 'luxon';
import { describe, expect, it, vi } from 'vitest';
import { ChangelogContext } from 'extension/common/changelog/changelog.context';
import { type Changelog as ChangelogModel } from 'extension/common/changelog/changelog.schema';
import { type ChangelogService } from 'extension/common/changelog/changelog.service';
import { type IntlMessageKey } from 'extension/common/intl/intl-message-key';
import { type Substitution } from 'extension/common/intl/intl.model';
import { type IntlService } from 'extension/common/intl/intl.service';
import { renderUi } from 'extension/test/ui';
import { Changelog } from 'extension/ui/common/components/changelog/changelog';

const releasedDate = '2024-01-02';
// Pinned to a locale rather than the runtime default, so the assertion proves the date follows the *extension's*
// locale rather than passing by coincidence on an en-US machine.
const releasedDateLabel = DateTime.fromISO(releasedDate, { locale: 'en-US' }).toLocaleString(DateTime.DATE_FULL);

const changelog: ChangelogModel = [
  {
    date: releasedDate,
    deprecations: ['Deprecated **originalUrl**'],
    features: ['Added **template** import'],
    fixes: ['Fixed [docs](https://tmplat.com) link'],
    improvements: ['Improved search'],
    knownIssues: ['Known issue remains'],
    removals: ['Removed Bitly'],
    version: '1.2.9',
  },
  {
    features: ['Upcoming feature'],
    unreleased: true,
    version: '2.0.0',
  },
];

const createIntl = (locale = 'en-US'): IntlService =>
  ({
    getLocale: vi.fn(async () => locale),
    getLocales: vi.fn(async () => [locale] as [string, ...string[]]),
    getMessage: vi.fn((key: IntlMessageKey, ...substitutions: Substitution[]) =>
      substitutions.length ? `${key}:${substitutions.join('|')}` : key,
    ),
  }) as Partial<IntlService> as IntlService;

const setup = ({
  entries = changelog,
  loadFails = false,
  locale,
}: { entries?: ChangelogModel; loadFails?: boolean; locale?: string } = {}) => {
  const getChangelog = vi.fn<() => Promise<ChangelogModel>>(async () => entries);
  if (loadFails) {
    getChangelog.mockRejectedValueOnce(new Error('boom'));
  }

  const changelogService = { getChangelog } as Partial<ChangelogService> as ChangelogService;
  const intl = createIntl(locale);

  renderUi(
    <ChangelogContext.Provider value={changelogService}>
      <Changelog />
    </ChangelogContext.Provider>,
    { contexts: { intl } },
  );

  return { getChangelog, intl };
};

describe('Changelog', () => {
  it('shows a loading state while the changelog service is pending', () => {
    const getChangelog = vi.fn<() => Promise<ChangelogModel>>(() => new Promise(() => undefined));
    const changelogService = { getChangelog } as Partial<ChangelogService> as ChangelogService;

    renderUi(
      <ChangelogContext.Provider value={changelogService}>
        <Changelog />
      </ChangelogContext.Provider>,
      { contexts: { intl: createIntl() } },
    );

    expect(screen.getByText('changelog_loading')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(getChangelog).toHaveBeenCalledTimes(1);
  });

  it('loads the changelog exactly once and renders entries newest first', async () => {
    const { getChangelog } = setup();

    expect(
      await screen.findByRole('heading', { level: 2, name: 'changelog_version_heading:2.0.0' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'changelog_version_heading:1.2.9' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      'changelog_version_heading:2.0.0',
      'changelog_version_heading:1.2.9',
    ]);
    expect(getChangelog).toHaveBeenCalledTimes(1);
  });

  it('renders release dates, unreleased labels, categories and markdown change text', async () => {
    setup();

    const releasedEntry = (
      await screen.findByRole('heading', {
        level: 2,
        name: 'changelog_version_heading:1.2.9',
      })
    ).closest('article, .MuiPaper-root') as HTMLElement;
    const releasedScope = within(releasedEntry);

    expect(screen.getByText('changelog_unreleased')).toBeInTheDocument();
    expect(releasedScope.getByText(releasedDateLabel)).toBeInTheDocument();
    // Asserted as an ordered list rather than per-category presence, because the order is itself the contract:
    // deprecations and removals are ranked above fixes precisely so a breaking change cannot be scrolled past
    expect(releasedScope.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
      'changelog_category_features',
      'changelog_category_improvements',
      'changelog_category_deprecations',
      'changelog_category_removals',
      'changelog_category_fixes',
      'changelog_category_known_issues',
    ]);
    expect(releasedScope.getByText('template')).toBeInTheDocument();
    expect(releasedScope.getByRole('link', { name: 'docs' })).toHaveAttribute('href', 'https://tmplat.com');
  });

  /*
   * Luxon formats with the runtime's locale unless told otherwise, which silently disagreed with the surrounding
   * localized messages - a user running Chrome in French on an English machine saw a French page with an English
   * date. A non-English locale is used here because an en-US assertion passes either way.
   */
  it('formats the release date using the extension locale rather than the runtime default', async () => {
    setup({ locale: 'fr' });

    expect(
      await screen.findByText(DateTime.fromISO(releasedDate, { locale: 'fr' }).toLocaleString(DateTime.DATE_FULL)),
    ).toBeInTheDocument();
  });

  it('shows the empty message for a successfully loaded empty changelog', async () => {
    setup({ entries: [] });

    expect(await screen.findByText('changelog_empty')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows an error when loading fails', async () => {
    const { getChangelog } = setup({ loadFails: true });

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('changelog_error');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(getChangelog).toHaveBeenCalledTimes(1);
  });

  it('does not update the page after unmounting before the service resolves', async () => {
    let resolve!: (entries: ChangelogModel) => void;
    const getChangelog = vi.fn<() => Promise<ChangelogModel>>(() => new Promise((done) => (resolve = done)));
    const changelogService = { getChangelog } as Partial<ChangelogService> as ChangelogService;
    const result = renderUi(
      <ChangelogContext.Provider value={changelogService}>
        <Changelog />
      </ChangelogContext.Provider>,
      { contexts: { intl: createIntl() } },
    );

    result.unmount();
    resolve(changelog);

    await waitFor(() => expect(screen.queryByText('changelog_version_heading:2.0.0')).not.toBeInTheDocument());
  });
});
