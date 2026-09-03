import { createContext, useContext } from 'react';
import { ChangelogService } from 'extension/common/changelog/changelog.service';

export const ChangelogContext = createContext<ChangelogService>({} as ChangelogService);

export function useChangelog(): ChangelogService {
  return useContext(ChangelogContext);
}
