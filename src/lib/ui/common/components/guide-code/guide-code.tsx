import Box from '@mui/material/Box';
import { ReactNode } from 'react';

/**
 * Renders template syntax using a monospaced, subtly highlighted style.
 */
export function GuideCode({ block, children }: GuideCodeProps) {
  return (
    <Box
      component={block ? 'pre' : 'code'}
      sx={{
        backgroundColor: 'action.hover',
        borderRadius: 1,
        display: block ? 'block' : 'inline',
        fontFamily: 'monospace',
        fontSize: '0.8125rem',
        m: 0,
        // Long templates should scroll rather than force the surrounding layout to grow
        overflowX: block ? 'auto' : undefined,
        px: block ? 1.5 : 0.5,
        py: block ? 1 : 0.25,
        whiteSpace: block ? 'pre-wrap' : 'nowrap',
        wordBreak: block ? 'break-word' : undefined,
      }}
    >
      {children}
    </Box>
  );
}

export type GuideCodeProps = {
  block?: boolean;
  children: ReactNode;
};
