import { createContext, useContext } from 'react';
import { type ChangelogService } from 'extension/common/changelog/changelog.service';

export const ChangelogContext = createContext<ChangelogService>({} as ChangelogService);

export const useChangelog = (): ChangelogService => useContext(ChangelogContext);
