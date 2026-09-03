import { createContext, useContext } from 'react';
import { type MessageService } from 'extension/common/message/message.service';

export const MessagesContext = createContext<MessageService>({} as MessageService);

export const useMessages = (): MessageService => useContext(MessagesContext);
