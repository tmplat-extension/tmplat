import { type Tab } from 'extension/tab/tab.model';

export type MessageSender = Omit<browser.runtime.MessageSender, 'tab'> & {
  tab?: Tab;
};
