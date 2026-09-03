import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { Container } from 'extension/common/di';
import { EventListenerToken } from 'extension/common/event/event-listener';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import {
  LoggingDataRepository,
  LoggingDataRepositoryToken,
} from 'extension/common/logging/data/logging-data.repository';
import { configureLoggingService } from 'extension/common/logging/logging.bootstrap';
import { LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { MessageConfigToken } from 'extension/common/message/message-config';
import { MessageIdGenerator, MessageIdGeneratorToken } from 'extension/common/message/message-id-generator';
import { MessageListenerToken } from 'extension/common/message/message-listener';
import { MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import {
  ContextMenuTargetHolder,
  ContextMenuTargetHolderToken,
} from 'extension/common/state/context-menu-target-holder';
import { ValidationService, ValidationServiceToken } from 'extension/common/validation/validation.service';
import { AnyContent } from 'extension/content/any-content/any-content';
import { ContentToken } from 'extension/content/content';
import { ContextMenuEventListener } from 'extension/tab/event/context-menu-event-listener';
import { ShortcutEventListener } from 'extension/tab/event/shortcut-event-listener';
import { TabContentMessageConfig } from 'extension/tab/message/tab-content-message-config';
import { TabContentMessageListener } from 'extension/tab/message/tab-content-message-listener';
import { TabContextMessageConfig } from 'extension/tab/message/tab-context-message-config';
import { TabContextMessageListener } from 'extension/tab/message/tab-context-message-listener';
import { TemplateDataRepository, TemplateDataRepositoryToken } from 'extension/template/data/template-data.repository';
import { ExecuteTemplateMessageConfig } from 'extension/template/message/execute-template-message-config';
import { TemplateService, TemplateServiceToken } from 'extension/template/template.service';

const container = new Container({
  defaultScope: 'Singleton',
  jitless: true,
});
container.bind(ContentToken).to(AnyContent);
container.bind(ContextMenuTargetHolderToken).to(ContextMenuTargetHolder);
container.bind(DataServiceToken).to(DataService);
container.bind(EventListenerToken).to(ContextMenuEventListener);
container.bind(EventListenerToken).to(ShortcutEventListener);
container.bind(ExtensionInfoToken).to(ExtensionInfo);
container.bind(IntlServiceToken).to(IntlService);
container.bind(LoggingDataRepositoryToken).to(LoggingDataRepository);
container.bind(LoggingServiceToken).to(LoggingService);
container.bind(MessageConfigToken).toConstantValue(ExecuteTemplateMessageConfig);
container.bind(MessageConfigToken).toConstantValue(TabContentMessageConfig);
container.bind(MessageConfigToken).toConstantValue(TabContextMessageConfig);
container.bind(MessageIdGeneratorToken).to(MessageIdGenerator);
container.bind(MessageListenerToken).to(TabContentMessageListener);
container.bind(MessageListenerToken).to(TabContextMessageListener);
container.bind(MessageServiceToken).to(MessageService);
container.bind(TemplateDataRepositoryToken).to(TemplateDataRepository);
container.bind(TemplateServiceToken).to(TemplateService);
container.bind(ValidationServiceToken).to(ValidationService);

// Must happen once all bindings are registered, as `LoggingService` cannot inject the repository itself.
configureLoggingService(container);

export { container };
