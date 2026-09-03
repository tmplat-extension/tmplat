import 'extension/common/system/browser-api.polyfill';

import { container } from 'extension/content/any-content/any-content.config';
import { Content, ContentToken } from 'extension/content/content';

const content = container.get<Content>(ContentToken);
content.inject();
