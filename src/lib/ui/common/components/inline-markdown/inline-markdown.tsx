import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Markdown, { Components } from 'react-markdown';

const components: Components = {
  a: ({ node: _node, ...props }) => <Link {...props} rel="noopener noreferrer" target="_blank" />,
  code: ({ node: _node, ...props }) => (
    <Box
      component="code"
      sx={{
        bgcolor: 'action.hover',
        borderRadius: 1,
        fontFamily: 'monospace',
        fontSize: '0.875em',
        px: 0.5,
        py: 0.125,
      }}
      {...props}
    />
  ),
  // The content is a single fragment of prose, so the block-level wrapper that would otherwise be added around it
  // is unwanted (and invalid within the inline contexts this is rendered in)
  p: ({ children }) => <>{children}</>,
};

/**
 * Renders a single-line fragment of Markdown using MUI components, without any surrounding block-level element, so
 * that it can be dropped into inline contexts (e.g. list item text).
 *
 * Markdown is rendered into React elements rather than HTML, so no sanitization is required and it remains
 * compatible with the extension's content security policy.
 */
export function InlineMarkdown({ children }: InlineMarkdownProps) {
  return <Markdown components={components}>{children}</Markdown>;
}

export type InlineMarkdownProps = {
  readonly children: string;
};
