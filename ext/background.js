var ietab = {};

var clipboard = {
    ANCHOR_MODE: 'copy_anchor',
    BBCODE_MODE: 'copy_bbcode',
    BLACKLISTED_EXTENSION_IDS: [],
    ENCODED_MODE: 'copy_encoded',
    GOO_GL_API_KEY: 'AIzaSyD504IwHeL3V2aw6ZGYQRgwWnJ38jNl2MY',
    NUMBER_OF_MODES: 5,
    SHORT_MODE: 'copy_short',
    URL_MODE: 'copy_url',

    features: [],
    mode: '',
    status: false,

    addSlashes: function(str) {
        return str
            .replace('\\', '\\\\')
            .replace('"', '\\"')
            .replace('\'', '\\\'');
    },

    copy: function(str) {
        var sandbox = $('#sandbox');
        sandbox.val(str);
        sandbox.select();
        clipboard.status = document.execCommand('copy', false, null);
        sandbox.val('');
        clipboard.showNotification();
    },

    copyAnchor: function(tab) {
        var title = (tab.title) ? tab.title : tab.url;
        var titleAttr = '';
        if (tab.title && getLocalStorage('settingTitleAttr')) {
            titleAttr = ' title="' + clipboard.addSlashes(title) + '"';
        }
        clipboard.copy('<a href="' + tab.url + '"' + titleAttr + '>' + clipboard.replaceEntities(title) + '</a>');
    },

    copyBBCode: function(tab) {
        if (tab.title) {
            clipboard.copy('[url=' + tab.url + ']' + tab.title + '[/url]');
        } else {
            clipboard.copy('[url]' + tab.url + '[/url]');
        }
    },

    copyEncoded: function(tab) {
        clipboard.copy(clipboard.encode(tab.url));
    },

    copyShortUrl: function(tab) {
        var data = {longUrl: tab.url};
        var req = new XMLHttpRequest();
        req.open('POST', 'https://www.googleapis.com/urlshortener/v1/url?key=' + clipboard.GOO_GL_API_KEY, true);
        req.onreadystatechange = function() {
            if (req.readyState === 4) {
                var resp = JSON.parse(req.responseText);
                if (resp.id) {
                    clipboard.copy(resp.id);
                } else {
                    clipboard.status = false;
                    clipboard.showNotification();
                }
                var popup = chrome.extension.getViews({type: 'popup'})[0];
                popup.close();
            }
        };
        req.setRequestHeader('Content-Type', 'application/json');
        req.send(JSON.stringify(data));
    },

    copyUrl: function(tab) {
        clipboard.copy(tab.url);
    },

    decode: function(url) {
        return decodeURIComponent(url);
    },

    encode: function(url) {
        return encodeURIComponent(url);
    },

    executeScriptsInExistingTabs: function(tabs) {
        for (i = 0; i < tabs.length; i++) {
            chrome.tabs.executeScript(tab[i].id, {file: 'shortcuts.js'});
        }
    },

    executeScriptsInExistingWindows: function() {
        chrome.windows.getAll(null, function(windows) {
            for (i = 0; i < windows.length; i++) {
                chrome.tabs.getAllInWindow(windows[i].id, clipboard.executeScriptsInExistingTabs);
            }
        });
    },

    getFeature: function(order) {
        switch (order) {
            case getLocalStorage('copyAnchorOrder'):
                return {
                    'id': 'copyAnchor',
                    'name': clipboard.ANCHOR_MODE,
                    'enabled': getLocalStorage('copyAnchorEnabled'),
                    'shortcut': 'Ctrl+Alt+A',
                    'macShortcut': '\u2325\u2318A'
                };
            case getLocalStorage('copyBBCodeOrder'):
                return {
                    'id': 'copyBBCode',
                    'name': clipboard.BBCODE_MODE,
                    'enabled': getLocalStorage('copyBBCodeEnabled'),
                    'shortcut': 'Ctrl+Alt+B',
                    'macShortcut': '\u2325\u2318B'
                };
            case getLocalStorage('copyEncodedOrder'):
                return {
                    'id': 'copyEncodedUrl',
                    'name': clipboard.ENCODED_MODE,
                    'enabled': getLocalStorage('copyEncodedEnabled'),
                    'shortcut': 'Ctrl+Alt+E',
                    'macShortcut': '\u2325\u2318E'
                };
            case getLocalStorage('copyShortOrder'):
                return {
                    'id': 'copyShortUrl',
                    'name': clipboard.SHORT_MODE,
                    'enabled': getLocalStorage('copyShortEnabled'),
                    'shortcut': 'Ctrl+Alt+S',
                    'macShortcut': '\u2325\u2318S'
                };
            case getLocalStorage('copyUrlOrder'):
                return {
                    'id': 'copyUrl',
                    'name': clipboard.URL_MODE,
                    'enabled': getLocalStorage('copyUrlEnabled'),
                    'shortcut': 'Ctrl+Alt+U',
                    'macShortcut': '\u2325\u2318U'
                };
            default:
                return {};
        }
    },

    init: function() {
        initLocalStorage('settingNotification', true);
        initLocalStorage('settingNotificationTimer', 3000);
        initLocalStorage('settingShortcut', true);
        initLocalStorage('settingTitleAttr', false);
        initLocalStorage('settingIeTabExtract', true);
        initLocalStorage('settingIeTabTitle', true);
        clipboard.initFeatures();
        clipboard.executeScriptsInExistingWindows();
        chrome.extension.onRequest.addListener(clipboard.onRequest);
        chrome.extension.onRequestExternal.addListener(clipboard.onRequest);
    },

    initFeatures: function() {
        initLocalStorage('copyAnchorEnabled', true);
        initLocalStorage('copyAnchorOrder', 2);
        initLocalStorage('copyBBCodeEnabled', true);
        initLocalStorage('copyBBCodeOrder', 3);
        initLocalStorage('copyEncodedEnabled', true);
        initLocalStorage('copyEncodedOrder', 4);
        initLocalStorage('copyShortEnabled', true);
        initLocalStorage('copyShortOrder', 1);
        initLocalStorage('copyUrlEnabled', true);
        initLocalStorage('copyUrlOrder', 0);
        clipboard.updateFeatures();
    },

    isBlacklisted: function(sender) {
        var reject = false;
        for (i = 0; i < clipboard.BLACKLISTED_EXTENSION_IDS.length; i++) {
            if (clipboard.BLACKLISTED_EXTENSION_IDS[i] === sender.id) {
                reject = true;
                break;
            }
        }
        return reject;
    },

    isThisPlatform: function(operationSystem) {
        return navigator.userAgent.toLowerCase().indexOf(operationSystem) !== -1;
    },

    onRequest: function(request, sender, sendResponse) {
        if (clipboard.isBlacklisted(sender)) {
            return;
        }
        if (getLocalStorage('settingShortcut')) {
            chrome.tabs.getSelected(null, function(tab) {
                var handler = (ietab.isActive(tab)) ? ietab : clipboard;
                switch (request.mode) {
                    case clipboard.URL_MODE:
                        clipboard.mode = clipboard.URL_MODE;
                        handler.copyUrl(tab);
                        break;
                    case clipboard.SHORT_MODE:
                        clipboard.mode = clipboard.SHORT_MODE;
                        handler.copyShortUrl(tab);
                        break;
                    case clipboard.ANCHOR_MODE:
                        clipboard.mode = clipboard.ANCHOR_MODE;
                        handler.copyAnchor(tab);
                        break;
                    case clipboard.BBCODE_MODE:
                        clipboard.mode = clipboard.BBCODE_MODE;
                        handler.copyBBCode(tab);
                        break;
                    case clipboard.ENCODED_MODE:
                        clipboard.mode = clipboard.ENCODED_MODE;
                        handler.copyEncoded(tab);
                        break;
                }
            });
        }
    },

    replaceEntities: function(str) {
        return str
            .replace('"', '&quot;')
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;');
    },

    reset: function() {
        clipboard.mode = '';
        clipboard.status = false;
    },

    service: function(mode) {
        chrome.tabs.getSelected(null, function(tab) {
            var handler = (ietab.isActive(tab)) ? ietab : clipboard;
            var popup = chrome.extension.getViews({type: 'popup'})[0];
            switch (mode) {
                case clipboard.URL_MODE:
                    clipboard.mode = clipboard.URL_MODE;
                    handler.copyUrl(tab);
                    popup.close();
                    break;
                case clipboard.SHORT_MODE:
                    $('#loadDiv', popup.document).show();
                    $('#item', popup.document).hide();
                    clipboard.mode = clipboard.SHORT_MODE;
                    handler.copyShortUrl(tab);
                    break;
                case clipboard.ANCHOR_MODE:
                    clipboard.mode = clipboard.ANCHOR_MODE;
                    handler.copyAnchor(tab);
                    popup.close();
                    break;
                case clipboard.BBCODE_MODE:
                    clipboard.mode = clipboard.BBCODE_MODE;
                    handler.copyBBCode(tab);
                    popup.close();
                    break;
                case clipboard.ENCODED_MODE:
                    clipboard.mode = clipboard.ENCODED_MODE;
                    handler.copyEncoded(tab);
                    popup.close();
                    break;
            }
        });
    },

    showNotification: function() {
        if (getLocalStorage('settingNotification')) {
            webkitNotifications.createHTMLNotification('notification.html').show();
        } else {
            clipboard.reset();
        }
    },

    updateFeatures: function() {
        clipboard.features = new Array(clipboard.NUMBER_OF_MODES);
        for (i = 0; i < clipboard.features.length; i++) {
            clipboard.features[i] = clipboard.getFeature(i);
        }
    }
};

ietab = {
    CONTAINER_PATH: 'iecontainer.html#url=',
    EXTENSION_ID: 'hehijbfgiekmjfkfjpbkbammjbdenadd',
    TITLE_PREFIX: 'IE: ',

    copyAnchor: function(tab) {
        var title = (tab.title) ? tab.title : tab.url;
        var titleAttr = '';
        var url = tab.url;
        if (getLocalStorage('settingIeTabExtract')) {
            url = clipboard.decode(ietab.extractUrl(url));
        }
        if (tab.title) {
            if (getLocalStorage('settingIeTabTitle')) {
                title = ietab.extractTitle(title);
            }
            if (getLocalStorage('settingTitleAttr')) {
                titleAttr = ' title="' + clipboard.addSlashes(title) + '"';
            }
        }
        clipboard.copy('<a href="' + url + '"' + titleAttr + '>' + clipboard.replaceEntities(title) + '</a>');
    },

    copyBBCode: function(tab) {
        var title = tab.title;
        var url = tab.url;
        if (getLocalStorage('settingIeTabExtract')) {
            url = clipboard.decode(ietab.extractUrl(url));
        }
        if (title && getLocalStorage('settingIeTabTitle')) {
            title = ietab.extractTitle(title);
        }
        if (title) {
            clipboard.copy('[url=' + url + ']' + title + '[/url]');
        } else {
            clipboard.copy('[url]' + url + '[/url]');
        }
    },

    copyEncoded: function(tab) {
        if (getLocalStorage('settingIeTabExtract')) {
            clipboard.copy(ietab.extractUrl(tab.url));
        } else {
            clipboard.copy(clipboard.encode(tab.url));
        }
    },

    copyShortUrl: function(tab) {
        var data = {longUrl: tab.url};
        if (getLocalStorage('settingIeTabExtract')) {
            data.longUrl = clipboard.decode(ietab.extractUrl(tab.url));
        }
        var req = new XMLHttpRequest();
        req.open('POST', 'https://www.googleapis.com/urlshortener/v1/url?key=' + clipboard.GOO_GL_API_KEY, true);
        req.onreadystatechange = function() {
            if (req.readyState === 4) {
                var resp = JSON.parse(req.responseText);
                if (resp.id) {
                    clipboard.copy(resp.id);
                } else {
                    clipboard.status = false;
                    clipboard.showNotification();
                }
                var popup = chrome.extension.getViews({type: 'popup'})[0];
                popup.close();
            }
        };
        req.setRequestHeader('Content-Type', 'application/json');
        req.send(JSON.stringify(data));
    },

    copyUrl: function(tab) {
        if (getLocalStorage('settingIeTabExtract')) {
            clipboard.copy(clipboard.decode(ietab.extractUrl(tab.url)));
        } else {
            clipboard.copy(tab.url);
        }
    },

    extractTitle: function(title) {
        var idx = title.indexOf(ietab.TITLE_PREFIX);
        if (idx !== -1) {
            return title.substring(idx + ietab.TITLE_PREFIX.length);
        }
        return title;
    },

    extractUrl: function(url) {
        var idx = url.indexOf(ietab.CONTAINER_PATH);
        if (idx !== -1) {
            return url.substring(idx + ietab.CONTAINER_PATH.length);
        }
        return url;
    },

    isActive: function(tab) {
        return tab.url.indexOf('chrome') === 0 && tab.url.indexOf(ietab.EXTENSION_ID) !== -1;
    }
};

clipboard.init();