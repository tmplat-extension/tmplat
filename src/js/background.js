// TODO: Complete documentation and code review

/**
 * <p>Main controller for the extension and manages all copy requests.</p>
 * @author <a href="http://github.com/neocotic">Alasdair Mercer</a>
 * @since 0.0.1.0
 */
var clipboard = {

    blacklistedExtensions: [],

    features: [],

    mode: '',

    status: false,

    copy: function (str) {
        var sandbox = $('#sandbox').val(str).select();
        clipboard.status = document.execCommand('copy', false, null);
        sandbox.val('');
        clipboard.showNotification();
    },

    copyAnchor: function (tab) {
        var data = {href: tab.url};
        data.text = tab.title || data.href;
        if (tab.title && utils.get('settingTitleAttr')) {
            data.title = helper.addSlashes(data.text);
        }
        // TODO: Implement option to set targets as '_blank'
        data.text = helper.replaceEntities(data.text);
        clipboard.copy(helper.createAnchor(data));
    },

    copyBBCode: function (tab) {
        var data = {
            title: tab.title,
            url: tab.url
        };
        clipboard.copy(helper.createBBCode(data));
    },

    copyEncoded: function (tab) {
        clipboard.copy(helper.encode(tab.url));
    },

    copyShortUrl: function (tab) {
        helper.callUrlShortener(tab.url);
    },

    copyUrl: function (tab) {
        clipboard.copy(tab.url);
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
                return feature.anchor;
            case utils.get('copyBBCodeOrder'):
                return feature.bbcode;
            case utils.get('copyEncodedOrder'):
                return feature.encoded;
            case utils.get('copyShortOrder'):
                return feature.short;
            case utils.get('copyUrlOrder'):
                return feature.url;
            default:
                return {};
        }
    },

    getUrlShortener: function () {
        /*
         * TODO: Implement lookup functionality to return shortener selected by
         * the user in the options.
         */
        return shortener.google;
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
        for (var i = 0; i < clipboard.blacklistedExtensions.length; i++) {
            if (clipboard.blacklistedExtensions[i] === sender.id) {
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
        // TODO: Add OR expression to allow external requests
        if (utils.get('settingShortcut')) {
            chrome.tabs.getSelected(null, function (tab) {
                var handler = (ietab.isActive(tab)) ? ietab : clipboard;
                // TODO: Update feature to send 'feature' instead of 'mode'
                switch (request.feature) {
                    case feature.url.name:
                        clipboard.mode = feature.url.name;
                        handler.copyUrl(tab);
                        break;
                    case feature.short.name:
                        clipboard.mode = feature.short.name;
                        handler.copyShortUrl(tab);
                        break;
                    case feature.anchor.name:
                        clipboard.mode = feature.anchor.name;
                        handler.copyAnchor(tab);
                        break;
                    case feature.bbcode.name:
                        clipboard.mode = feature.bbcode.name;
                        handler.copyBBCode(tab);
                        break;
                    case feature.encoded.name:
                        clipboard.mode = feature.encoded.name;
                        handler.copyEncoded(tab);
                        break;
                }
            });
        }
    },

    reset: function () {
        clipboard.mode = '';
        clipboard.status = false;
    },

    service: function (feature) {
        chrome.tabs.getSelected(null, function (tab) {
            var handler = (ietab.isActive(tab)) ? ietab : clipboard;
            var popup = chrome.extension.getViews({type: 'popup'})[0];
            switch (feature) {
                case feature.url.name:
                    clipboard.mode = feature.url.name;
                    handler.copyUrl(tab);
                    popup.close();
                    break;
                case feature.short.name:
                    $('#loadDiv', popup.document).show();
                    $('#item', popup.document).hide();
                    clipboard.mode = feature.short.name;
                    handler.copyShortUrl(tab);
                    break;
                case feature.anchor.name:
                    clipboard.mode = feature.anchor.name;
                    handler.copyAnchor(tab);
                    popup.close();
                    break;
                case feature.bbcode.name:
                    clipboard.mode = feature.bbcode.name;
                    handler.copyBBCode(tab);
                    popup.close();
                    break;
                case feature.encoded.name:
                    clipboard.mode = feature.encoded.name;
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
        var count = helper.countProperties(feature);
        clipboard.features = [];
        for (var i = 0; i < count; i++) {
            clipboard.features[i] = clipboard.getFeature(i);
        }
    }

};

var feature = {

    anchor: {
        getMacShortcut: function () {
            return '\u2325\u2318A';
        },
        getShortcut: function () {
            return 'Ctrl+Alt+A';
        },
        id: 'copyAnchor',
        isEnabled: function () {
            return utils.get('copyAnchorEnabled');
        },
        name: 'copy_anchor'
    },

    bbcode: {
        getMacShortcut: function () {
            return '\u2325\u2318B';
        },
        getShortcut: function () {
            return 'Ctrl+Alt+B';
        },
        id: 'copyBBCode',
        isEnabled: function () {
            return utils.get('copyBBCodeEnabled');
        },
        name: 'copy_bbcode'
    },

    encoded: {
        getMacShortcut: function () {
            return '\u2325\u2318E';
        },
        getShortcut: function () {
            return 'Ctrl+Alt+E';
        },
        id: 'copyEncodedUrl',
        isEnabled: function () {
            return utils.get('copyEncodedEnabled');
        },
        name: 'copy_encoded'
    },

    short: {
        getMacShortcut: function () {
            return '\u2325\u2318S';
        },
        getShortcut: function () {
            return 'Ctrl+Alt+S';
        },
        id: 'copyShortUrl',
        isEnabled: function () {
            return utils.get('copyShortEnabled');
        },
        name: 'copy_short'
    },

    url: {
        getMacShortcut: function () {
            return '\u2325\u2318U';
        },
        getShortcut: function () {
            return 'Ctrl+Alt+U';
        },
        id: 'copyUrl',
        isEnabled: function () {
            return utils.get('copyUrlEnabled');
        },
        name: 'copy_url'
    }

};

var helper = {

    addSlashes: function (str) {
        return str
            .replace('\\', '\\\\')
            .replace('"', '\\"')
            .replace('\'', '\\\'');
    },

    callUrlShortener: function (url) {
        var req = new XMLHttpRequest();
        var shortener = clipboard.getUrlShortener();
        req.open(shortener.method, shortener.url, true);
        req.onreadystatechange = function () {
            if (req.readyState === 4) {
                var output = shortener.output(req.responseText);
                if (output) {
                    clipboard.copy(output);
                } else {
                    clipboard.status = false;
                    clipboard.showNotification();
                }
                var popup = chrome.extension.getViews({type: 'popup'})[0];
                popup.close();
            }
        };
        req.setRequestHeader('Content-Type', shortener.contentType);
        req.send(shortener.input(url));
    },

    countProperties: function (obj) {
        var count = 0;
        for (var p in obj) {
            if (obj.hasOwnProperty(p)) {
                count++;
            }
        }
        return count;
    },

    createAnchor: function (data) {
        return $('<div/>').append($('<a/>', data)).html();
    },

    createBBCode: function (data) {
        if (data.title) {
            return '[url=' + data.url + ']' + data.title + '[/url]';
        } else {
            return '[url]' + data.url + '[/url]';
        }
    },

    decode: function (url) {
        return decodeURIComponent(url);
    },

    encode: function (url) {
        return encodeURIComponent(url);
    },

    replaceEntities: function (str) {
        return str
            .replace('"', '&quot;')
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;');
    }

};

/**
 * <p>Provides an interface to by used by {@link clipboard} for copy requests on
 * tabs where the IE Tab is currently active.</p>
 * @author <a href="http://github.com/neocotic">Alasdair Mercer</a>
 * @since 0.0.2.0
 */
var ietab = {

    /**
     * <p>The segment of the URI which precedes the embedded URL.</p>
     * @private
     * @type String
     */
    containerSegment: 'iecontainer.html#url=',

    /**
     * <p>The identifier of the IE Tab extension.</p>
     * @type String
     */
    extensionId: 'hehijbfgiekmjfkfjpbkbammjbdenadd',

    /**
     * <p>The String prepended to the title by IE Tab.</p>
     * @private
     * @type String
     */
    titlePrefix: 'IE: ',

    copyAnchor: function (tab) {
        var data = {href: tab.url};
        if (utils.get('settingIeTabExtract')) {
            data.href = helper.decode(ietab.extractUrl(data.href));
        }
        data.text = tab.title || data.href;
        if (tab.title) {
            if (utils.get('settingIeTabTitle')) {
                data.text = ietab.extractTitle(data.text);
            }
            if (utils.get('settingTitleAttr')) {
                data.title = helper.addSlashes(data.text);
            }
        }
        // TODO: Implement option to set targets as '_blank'
        data.text = helper.replaceEntities(data.text);
        clipboard.copy(helper.createAnchor(data));
    },

    copyBBCode: function (tab) {
        var data = {
            title: tab.title,
            url: tab.url
        };
        if (utils.get('settingIeTabExtract')) {
            data.url = helper.decode(ietab.extractUrl(data.url));
        }
        if (data.title && utils.get('settingIeTabTitle')) {
            data.title = ietab.extractTitle(data.title);
        }
        clipboard.copy(helper.createBBCode(data));
    },

    copyEncoded: function (tab) {
        var url = tab.url;
        if (utils.get('settingIeTabExtract')) {
            url = ietab.extractUrl(url);
        } else {
            /*
             * TODO: Test this works as expected considering it will already
             * contains an encoded URI segment.
             */
            url = helper.encode(url);
        }
        clipboard.copy(url);
    },

    copyShortUrl: function (tab) {
        var url = tab.url;
        if (utils.get('settingIeTabExtract')) {
            url = helper.decode(ietab.extractUrl(url));
        }
        helper.callUrlShortener(url);
    },

    copyUrl: function (tab) {
        var url = tab.url;
        if (utils.get('settingIeTabExtract')) {
            url = helper.decode(ietab.extractUrl(url));
        }
        clipboard.copy(url);
    },

    extractTitle: function (str) {
        var idx = str.indexOf(ietab.titlePrefix);
        if (idx !== -1) {
            return str.substring(idx + ietab.titlePrefix.length);
        }
        return str;
    },

    extractUrl: function (str) {
        var idx = str.indexOf(ietab.containerSegment);
        if (idx !== -1) {
            return str.substring(idx + ietab.containerSegment.length);
        }
        return str;
    },

    isActive: function (tab) {
        return tab.url.indexOf('chrome') === 0 &&
                tab.url.indexOf(ietab.extensionId) !== -1;
    }

};

var shortener = {

    google: {
        contentType: 'application/json',
        input: function (url) {
            return JSON.stringify({'longUrl': url});
        },
        method: 'POST',
        output: function (resp) {
            return JSON.parse(resp).id;
        },
        url: 'https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyD504IwHeL3V2aw6ZGYQRgwWnJ38jNl2MY'
    }

};