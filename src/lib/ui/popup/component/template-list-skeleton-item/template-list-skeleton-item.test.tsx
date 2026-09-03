import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderUi } from 'extension/test/ui';
import { TemplateListSkeletonItem } from 'extension/ui/popup/component/template-list-skeleton-item/template-list-skeleton-item';

describe('TemplateListSkeletonItem', () => {
  it('renders a heading-shaped skeleton row', () => {
    renderUi(<TemplateListSkeletonItem />);

    const row = screen.getByRole('heading', { level: 5 });

    expect(row.querySelector('span')).toBeInTheDocument();
  });
});
