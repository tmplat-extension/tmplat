import { TabContext } from 'extension/tab/tab.model';

export type GetTabContextMessageReply = {
  readonly context: TabContext;
};
