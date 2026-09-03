import 'extension/common/system/browser-api.polyfill';

import { container } from 'extension/offscreen/main/main-offscreen.config';
import { Offscreen, OffscreenToken } from 'extension/offscreen/offscreen';

const offscreen = container.get<Offscreen>(OffscreenToken);
offscreen.run();
