// TODO: Reduce duplication wherever possible

/**
 * <p>Main controller for the extension and manages all copy requests.</p>
 * @author <a href="http://github.com/neocotic">Alasdair Mercer</a>
 * @since 0.0.2.0
 */
// TODO: Complete documentation and code review
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

    addSlashes: function (str) {
        return str
            .replace('\\', '\\\\')
            .replace('"', '\\"')
            .replace('\'', '\\\'');
    },

    copy: function (str) {
        var sandbox = $('#sandbox');
        sandbox.val(str);
        sandbox.select();
        clipboard.status = document.execCommand('copy', false, null);
        sandbox.val('');
        clipboard.showNotification();
    },

    copyAnchor: function (tab) {
        /*
         * TODO: Consider using jQuery to build anchor element
         * (e.g. jQuery.html()).
         */
        var title = (tab.title) ? tab.title : tab.url;
        var titleAttr = '';
        if (tab.title && utils.get('settingTitleAttr')) {
            titleAttr = ' title="' + clipboard.addSlashes(title) + '"';
        }
        clipboard.copy('<a href="' + tab.url + '"' + titleAttr + '>' +
                clipboard.replaceEntities(title) + '</a>');
    },

    copyBBCode: function (tab) {
        if (tab.title) {
            clipboard.copy('[url=' + tab.url + ']' + tab.title + '[/url]');
        } else {
            clipboard.copy('[url]' + tab.url + '[/url]');
        }
    },

    copyEncoded: function(tab) {
        clipboard.copy(clipboard.encode(tab.url));
    },

    copyShortUrl: function (tab) {
        var data = {longUrl: tab.url};
        var req = new XMLHttpRequest();
        req.open('POST', 'https://www.googleapis.com/urlshortener/v1/url?key=' +
                clipboard.GOO_GL_API_KEY, true);
        req.onreadystatechange = function () {
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

    copyUrl: function (tab) {
        clipboard.copy(tab.url);
    },

    decode: function (url) {
        return decodeURIComponent(url);
    },

    encode: function (url) {
        return encodeURIComponent(url);
    },

    executeScriptsInExistingTabs: function (tabs) {
        for (var i = 0; i < tabs.length; i++) {
            chrome.tabs.executeScript(tab[i].id, {file: '../js/shortcuts.js'});
        }
    },

    executeScriptsInExistingWindows: function () {
        chrome.windows.getAll(null, function (windows) {
            for (var i = 0; i < windows.length; i++) {
                chrome.tabs.getAllInWindow(windows[i].id,
                        clipboard.executeScriptsInExistingTabs);
            }
        });
    },

    getFeature: function (order) {
        switch (order) {
            case utils.get('copyAnchorOrder'):
                return {
                    'id': 'copyAnchor',
                    'name': clipboard.ANCHOR_MODE,
                    'enabled': utils.get('copyAnchorEnabled'),
                    'shortcut': 'Ctrl+Alt+A',
                    'macShortcut': '\u2325\u2318A'
                };
            case utils.get('copyBBCodeOrder'):
                return {
                    'id': 'copyBBCode',
                    'name': clipboard.BBCODE_MODE,
                    'enabled': utils.get('copyBBCodeEnabled'),
                    'shortcut': 'Ctrl+Alt+B',
                    'macShortcut': '\u2325\u2318B'
                };
            case utils.get('copyEncodedOrder'):
                return {
                    'id': 'copyEncodedUrl',
                    'name': clipboard.ENCODED_MODE,
                    'enabled': utils.get('copyEncodedEnabled'),
                    'shortcut': 'Ctrl+Alt+E',
                    'macShortcut': '\u2325\u2318E'
                };
            case utils.get('copyShortOrder'):
                return {
                    'id': 'copyShortUrl',
                    'name': clipboard.SHORT_MODE,
                    'enabled': utils.get('copyShortEnabled'),
                    'shortcut': 'Ctrl+Alt+S',
                    'macShortcut': '\u2325\u2318S'
                };
            case utils.get('copyUrlOrder'):
                return {
                    'id': 'copyUrl',
                    'name': clipboard.URL_MODE,
                    'enabled': utils.get('copyUrlEnabled'),
                    'shortcut': 'Ctrl+Alt+U',
                    'macShortcut': '\u2325\u2318U'
                };
            default:
                return {};
        }
    },

    init: function () {
        utils.init('settingNotification', true);
        utils.init('settingNotificationTimer', 3000);
        utils.init('settingShortcut', true);
        utils.init('settingTitleAttr', false);
        utils.init('settingIeTabExtract', true);
        utils.init('settingIeTabTitle', true);
        clipboard.initFeatures();
        clipboard.executeScriptsInExistingWindows();
        chrome.extension.onRequest.addListener(clipboard.onRequest);
        chrome.extension.onRequestExternal.addListener(clipboard.onRequest);
    },

    initFeatures: function () {
        utils.init('copyAnchorEnabled', true);
        utils.init('copyAnchorOrder', 2);
        utils.init('copyBBCodeEnabled', true);
        utils.init('copyBBCodeOrder', 3);
        utils.init('copyEncodedEnabled', true);
        utils.init('copyEncodedOrder', 4);
        utils.init('copyShortEnabled', true);
        utils.init('copyShortOrder', 1);
        utils.init('copyUrlEnabled', true);
        utils.init('copyUrlOrder', 0);
        clipboard.updateFeatures();
    },

    isBlacklisted: function (sender) {
        var reject = false;
        for (var i = 0; i < clipboard.BLACKLISTED_EXTENSION_IDS.length; i++) {
            if (clipboard.BLACKLISTED_EXTENSION_IDS[i] === sender.id) {
                reject = true;
                break;
            }
        }
        return reject;
    },

    isThisPlatform: function (operationSystem) {
        return navigator.userAgent.toLowerCase().indexOf(operationSystem) !== -1;
    },

    onRequest: function (request, sender, sendResponse) {
        if (clipboard.isBlacklisted(sender)) {
            return;
        }
        if (utils.get('settingShortcut')) {
            chrome.tabs.getSelected(null, function (tab) {
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

    replaceEntities: function (str) {
        return str
            .replace('"', '&quot;')
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;');
    },

    reset: function () {
        clipboard.mode = '';
        clipboard.status = false;
    },

    service: function (mode) {
        chrome.tabs.getSelected(null, function (tab) {
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

    showNotification: function () {
        if (utils.get('settingNotification')) {
            webkitNotifications
                    .createHTMLNotification('../pages/notification.html')
                    .show();
        } else {
            clipboard.reset();
        }
    },

    updateFeatures: function () {
        clipboard.features = [];
        for (var i = 0; i < clipboard.NUMBER_OF_MODE; i++) {
            clipboard.features[i] = clipboard.getFeature(i);
        }
    }

};

/**
 * <p>Provides an interface to by used by {@link clipboard} for copy requests on
 * tabs where the IE Tab is currently active.</p>
 * @author <a href="http://github.com/neocotic">Alasdair Mercer</a>
 * @since 0.0.2.0
 */
// TODO: Complete documentation and code review
var ietab = {

    /**
     * <p>The segment of the URI which precedes the embedded URL.</p>
     * @private
     * @static
     * @type String
     */
    CONTAINER_SEGMENT: 'iecontainer.html#url=',

    /**
     * <p>The identifier of the IE Tab extension.</p>
     * @static
     * @type String
     */
    EXTENSION_ID: 'hehijbfgiekmjfkfjpbkbammjbdenadd',

    /**
     * <p>The String prepended to the title by IE Tab.</p>
     * @private
     * @static
     * @type String
     */
    TITLE_PREFIX: 'IE: ',

    copyAnchor: function (tab) {
        /*
         * TODO: Consider using jQuery to build anchor element
         * (e.g. jQuery.html()).
         */
        var title = (tab.title) ? tab.title : tab.url;
        var titleAttr = '';
        var url = tab.url;
        if (utils.get('settingIeTabExtract')) {
            url = clipboard.decode(ietab.extractUrl(url));
        }
        if (tab.title) {
            if (utils.get('settingIeTabTitle')) {
                title = ietab.extractTitle(title);
            }
            if (utils.get('settingTitleAttr')) {
                titleAttr = ' title="' + clipboard.addSlashes(title) + '"';
            }
        }
        clipboard.copy('<a href="' + url + '"' + titleAttr + '>' +
                clipboard.replaceEntities(title) + '</a>');
    },

    copyBBCode: function (tab) {
        var title = tab.title;
        var url = tab.url;
        if (utils.get('settingIeTabExtract')) {
            url = clipboard.decode(ietab.extractUrl(url));
        }
        if (title && utils.get('settingIeTabTitle')) {
            title = ietab.extractTitle(title);
        }
        if (title) {
            clipboard.copy('[url=' + url + ']' + title + '[/url]');
        } else {
            clipboard.copy('[url]' + url + '[/url]');
        }
    },

    copyEncoded: function (tab) {
        if (utils.get('settingIeTabExtract')) {
            clipboard.copy(ietab.extractUrl(tab.url));
        } else {
            clipboard.copy(clipboard.encode(tab.url));
        }
    },

    copyShortUrl: function (tab) {
        var data = {longUrl: tab.url};
        if (utils.get('settingIeTabExtract')) {
            data.longUrl = clipboard.decode(ietab.extractUrl(tab.url));
        }
        var req = new XMLHttpRequest();
        req.open('POST', 'https://www.googleapis.com/urlshortener/v1/url?key=' +
                clipboard.GOO_GL_API_KEY, true);
        req.onreadystatechange = function () {
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

    copyUrl: function (tab) {
        if (utils.get('settingIeTabExtract')) {
            clipboard.copy(clipboard.decode(ietab.extractUrl(tab.url)));
        } else {
            clipboard.copy(tab.url);
        }
    },

    extractTitle: function (title) {
        var idx = title.indexOf(ietab.TITLE_PREFIX);
        if (idx !== -1) {
            return title.substring(idx + ietab.TITLE_PREFIX.length);
        }
        return title;
    },

    extractUrl: function (url) {
        var idx = url.indexOf(ietab.CONTAINER_SEGMENT);
        if (idx !== -1) {
            return url.substring(idx + ietab.CONTAINER_SEGMENT.length);
        }
        return url;
    },

    isActive: function (tab) {
        return tab.url.indexOf('chrome') === 0 &&
                tab.url.indexOf(ietab.EXTENSION_ID) !== -1;
    }

};