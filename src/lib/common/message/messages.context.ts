import { createContext, useContext } from 'react';

import { MessageService } from 'extension/common/message/message.service';

export const MessagesContext = createContext<MessageService>({} as MessageService);

export function useMessages(): MessageService {
  return useContext(MessagesContext);
}
