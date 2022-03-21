import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { Container } from 'extension/common/di';
import { EventListener, EventListenerToken } from 'extension/common/event/event-listener';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { LogDataRepository, LogDataRepositoryToken } from 'extension/common/log/data/log-data.repository';
import { LogService, LogServiceToken } from 'extension/common/log/log.service';
import { MessageIdGenerator, MessageIdGeneratorToken } from 'extension/common/message/message-id-generator';
import { MessageListener, MessageListenerToken } from 'extension/common/message/message-listener';
import { MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import {
  ContextMenuTargetHolder,
  ContextMenuTargetHolderToken,
} from 'extension/common/state/context-menu-target-holder';
import { AnyContent } from 'extension/content/any-content/any-content';
import { Content, ContentToken } from 'extension/content/content';
import { ContextMenuEventListener } from 'extension/tab/event/context-menu-event-listener';
import { ShortcutEventListener } from 'extension/tab/event/shortcut-event-listener';
import { GetTabContentMessageListener } from 'extension/tab/message/get-tab-content-message-listener';
import { GetTabContextMessageListener } from 'extension/tab/message/get-tab-context-message-listener';
import { TabService, TabServiceToken } from 'extension/tab/tab.service';
import { TemplateDataRepository, TemplateDataRepositoryToken } from 'extension/template/data/template-data.repository';
import { CopyMessageListener } from 'extension/template/message/copy-message-listener';
import { TemplateService, TemplateServiceToken } from 'extension/template/template.service';

const container = new Container({ skipBaseClassChecks: true });
container.bind<Content>(ContentToken).to(AnyContent);
container.bind<ContextMenuTargetHolder>(ContextMenuTargetHolderToken).to(ContextMenuTargetHolder);
container.bind<DataService>(DataServiceToken).to(DataService);
container.bind<EventListener>(EventListenerToken).to(ContextMenuEventListener);
container.bind<EventListener>(EventListenerToken).to(ShortcutEventListener);
container.bind<ExtensionInfo>(ExtensionInfoToken).to(ExtensionInfo);
container.bind<IntlService>(IntlServiceToken).to(IntlService);
container.bind<LogDataRepository>(LogDataRepositoryToken).to(LogDataRepository);
container.bind<LogService>(LogServiceToken).to(LogService);
container.bind<MessageIdGenerator>(MessageIdGeneratorToken).to(MessageIdGenerator);
container.bind<MessageListener>(MessageListenerToken).to(CopyMessageListener);
container.bind<MessageListener>(MessageListenerToken).to(GetTabContentMessageListener);
container.bind<MessageListener>(MessageListenerToken).to(GetTabContextMessageListener);
container.bind<MessageService>(MessageServiceToken).to(MessageService);
container.bind<TabService>(TabServiceToken).to(TabService);
container.bind<TemplateDataRepository>(TemplateDataRepositoryToken).to(TemplateDataRepository);
container.bind<TemplateService>(TemplateServiceToken).to(TemplateService);

export { container };
