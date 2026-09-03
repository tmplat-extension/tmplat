import { describe, expect, it, vi } from 'vitest';
import { type Tab, type TabCriteriaFilter } from 'extension/tab/tab.model';
import { filterTab, isTab } from 'extension/tab/tab.utils';
import { createTab } from 'extension/test/tab.fake';

describe('tab.utils', () => {
  describe('isTab', () => {
    it('accepts a tab with a numeric id and a string url', () => {
      expect(isTab(createTab())).toBe(true);
    });

    it.each([
      ['undefined', undefined],
      ['a missing id', { url: 'https://www.example.com/' }],
      ['a non-numeric id', { id: 'nope', url: 'https://www.example.com/' }],
      ['a missing url', { id: 1 }],
      ['a non-string url', { id: 1, url: 123 }],
    ])('rejects %s', (_label, value) => {
      expect(isTab(value as unknown as browser.tabs.Tab)).toBe(false);
    });

    it('accepts an empty-string url, since only the type is checked', () => {
      expect(isTab({ id: 1, url: '' } as browser.tabs.Tab)).toBe(true);
    });
  });

  describe('filterTab', () => {
    it('returns true when the value is a tab and no filter is supplied', () => {
      expect(filterTab(createTab())).toBe(true);
    });

    it('returns false when the value is not a tab, without invoking the filter', () => {
      const filter = vi.fn<TabCriteriaFilter>(() => true);

      expect(filterTab(undefined, filter)).toBe(false);
      expect(filter).not.toHaveBeenCalled();
    });

    it('delegates to the filter for a valid tab and returns its result', () => {
      const tab = createTab({ url: 'https://blocked.test/' });
      const filter = vi.fn<TabCriteriaFilter>((value: Tab) => !value.url.includes('blocked'));

      expect(filterTab(tab, filter)).toBe(false);
      expect(filter).toHaveBeenCalledWith(tab);
    });

    it('narrows the value to a Tab when it passes', () => {
      const value: browser.tabs.Tab | undefined = createTab();

      if (filterTab(value)) {
        expect(value.id).toBe(1);
        expect(value.url).toBe('https://www.example.com/');
      } else {
        expect.unreachable('expected value to be a Tab');
      }
    });
  });
});
