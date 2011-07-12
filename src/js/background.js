/**
 * <p>Main controller for the extension and manages all copy requests.</p>
 * @author <a href="http://github.com/neocotic">Alasdair Mercer</a>
 * @since 0.0.1.0
 * @namespace
 */
var clipboard = {

    /**
     * <p>A list of blacklisted extension IDs who should be prevented from
     * making requests to the extension.</p>
     * @private
     * @type Array
     */
    blacklistedExtensions: [],

    /**
     * <p>The name of the feature being used by the current copy request.</p>
     * <p>This value is reset to an empty string after every copy request.</p>
     * @type String
     */
    feature: '',

    /**
     * <p>The list of copy request features supported by the extension.</p>
     * <p>This list ordered to match that specified by the user.</p>
     * @see clipboard.updateFeatures
     * @type Array
     */
    features: [],

    /**
     * <p>The HTML to populate the popup with.</p>
     * <p>This should be updated whenever changes are made to the features.</p>
     * @see clipboard.updateFeatures
     * @type String
     * @since 0.1.0.0
     */
    popupHTML: '',

    /**
     * <p>String representation of the keyboard modifiers listened to by this
     * extension on Windows/Linux platforms.</p>
     * @type String
     * @since 0.1.0.0
     */
    shortcutModifiers: 'Ctrl+Alt+',

    /**
     * <p>String representation of the keyboard modifiers listened to by this
     * extension on Mac platforms.</p>
     * @type String
     * @since 0.1.0.0
     */
    shortcutMacModifiers: '&#8984;-Shift-',

    /**
     * <p>Indicates whether or not the current copy request was a success.</p>
     * <p>This value is reset to <code>false</code> after every copy request.</p>
     * @type Boolean
     */
    status: false,

    /**
     * <p>Adds the specified string to the system clipboard.</p>
     * <p>This is the core function for copying to the clipboard by the
     * extension. All supported copy requests should, at some point, call this
     * function.</p>
     * @param {String} str The string to be added to the clipboard.
     * @requires document.execCommand
     */
    copy: function (str) {
        var sandbox = $('#sandbox').val(str).select();
        clipboard.status = document.execCommand('copy', false, null);
        sandbox.val('');
        clipboard.showNotification();
    },

    /**
     * <p>Copies generated formatted HTML for an anchor tag to the clipboard.</p>
     * @param {Tab} tab The tab whose information is to be used to generate the
     * anchor tag.
     * @requires jQuery
     */
    copyAnchor: function (tab) {
        var data = {href: tab.url};
        data.text = tab.title || data.href;
        if (tab.title && utils.get('settingTitleAttr')) {
            data.title = helper.addSlashes(data.text);
        }
        data.text = helper.replaceEntities(data.text);
        clipboard.copy(helper.createAnchor(data));
    },

    /**
     * <p>Copies generated formatted BBCode for a <code>url</code> tag to the
     * clipboard.</p>
     * @param {Tab} tab The tab whose information is to be used to generate the
     * <code>url</code> tag.
     */
    copyBBCode: function (tab) {
        var data = {
            text: tab.title,
            url: tab.url
        };
        clipboard.copy(helper.createBBCode(data));
    },

    /**
     * <p>Copies the encoded URL to the clipboard.</p>
     * @param {Tab} tab The tab whose information is to be used to generate the
     * encoded URL.
     */
    copyEncoded: function (tab) {
        clipboard.copy(helper.encode(tab.url));
    },

    /**
     * <p>Copies the shortened version of the URL to the clipboard.</p>
     * @param {Tab} tab The tab whose information is to be used to generate the
     * short URL.
     * @see helper.callUrlShortener
     */
    copyShortUrl: function (tab) {
        helper.callUrlShortener(tab.url);
    },

    /**
     * <p>Copies the URL to the clipboard.</p>
     * @param {Tab} tab The tab whose information is to be used.
     */
    copyUrl: function (tab) {
        clipboard.copy(tab.url);
    },

    /**
     * <p>Injects and executes the <code>shortcuts.js</code> script within each
     * of the tabs provided (where valid).</p>
     * @param {Array} tabs The tabs to execute the script in.
     * @private
     */
    executeScriptsInExistingTabs: function (tabs) {
        for (var i = 0; i < tabs.length; i++) {
            chrome.tabs.executeScript(tabs[i].id, {file: 'js/shortcuts.js'});
        }
    },

    /**
     * <p>Injects and executes the <code>shortcuts.js</code> script within all
     * the tabs (where valid) of each Chrome window.</p>
     * @private
     */
    executeScriptsInExistingWindows: function () {
        chrome.windows.getAll(null, function (windows) {
            for (var i = 0; i < windows.length; i++) {
                chrome.tabs.getAllInWindow(windows[i].id,
                        clipboard.executeScriptsInExistingTabs);
            }
        });
    },

    /**
     * <p>Returns the information of the feature associated with the order
     * provided.</p>
     * @param {Integer} order The order of the feature required.
     * @returns {feature} The feature of the specified order or an empty
     * object if no matching feature could be found.
     * @private
     */
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
        }
        return {};
    },

    /**
     * <p>Returns the information for the active URL Shortener service.</p>
     * @returns {shortener} The active URL Shortener.
     */
    getUrlShortener: function () {
        // Attempts to lookup enabled URL Shortener service
        for (var key in shortener) {
            if (shortener[key].isEnabled()) {
                return shortener[key];
            }
        }
        // Returns google service by default
        return shortener.google;
    },

    /**
     * <p>Initializes the background page.</p>
     * <p>This involves initializing the settings, injecting keyboard shortcut
     * listeners and adding the request listeners.</p>
     */
    init: function () {
        utils.init('settingNotification', true);
        utils.init('settingNotificationTimer', 3000);
        utils.init('settingShortcut', true);
        utils.init('settingTargetAttr', false);
        utils.init('settingTitleAttr', false);
        utils.init('settingIeTabExtract', true);
        utils.init('settingIeTabTitle', true);
        clipboard.initFeatures();
        clipboard.initUrlShorteners();
        clipboard.executeScriptsInExistingWindows();
        chrome.extension.onRequest.addListener(clipboard.onRequest);
        chrome.extension.onRequestExternal.addListener(
            clipboard.onExternalRequest);
    },

    /**
     * <p>Initializes the supported copy request features (including their
     * corresponding settings).</p>
     * @private
     */
    initFeatures: function () {
        utils.init('copyAnchorEnabled', true);
        utils.init('copyAnchorOrder', 2);
        utils.init('copyBBCodeEnabled', false);
        utils.init('copyBBCodeOrder', 4);
        utils.init('copyEncodedEnabled', true);
        utils.init('copyEncodedOrder', 3);
        utils.init('copyShortEnabled', true);
        utils.init('copyShortOrder', 1);
        utils.init('copyUrlEnabled', true);
        utils.init('copyUrlOrder', 0);
        clipboard.updateFeatures();
    },

    /**
     * <p>Initializes the settings related to the supported URL Shortener
     * services.</p>
     * @private
     */
    initUrlShorteners: function () {
        utils.init('bitlyEnabled', false);
        utils.init('bitlyXApiKey', '');
        utils.init('bitlyXLogin', '');
        utils.init('googleEnabled', true);
        utils.init('googleOAuthEnabled', true);
    },

    /**
     * <p>Determines whether or not the sender provided is from a blacklisted
     * extension.</p>
     * @param {MessageSender} sender The sender to be tested.
     * @returns {Boolean} <code>true</code> if the sender is blacklisted;
     * otherwise <code>false</code>.
     * @private
     */
    isBlacklisted: function (sender) {
        for (var i = 0; i < clipboard.blacklistedExtensions.length; i++) {
            if (clipboard.blacklistedExtensions[i] === sender.id) {
                return true;
            }
        }
        return false;
    },

    /**
     * <p>Determines whether or not the tab provided is currently displaying a
     * <em>special</em> page (i.e. a page that is internal to the browser).</p>
     * @param {Tab} tab The tab to be tested.
     * @returns {Boolean} <code>true</code> if displaying a <em>special</em>
     * page; otherwise <code>false</code>.
     */
    isSpecialPage: function (tab) {
        return tab.url.indexOf('chrome') === 0;
    },

    /**
     * <p>Determines whether or not the user's OS matches that provided.</p>
     * @param {String} operatingSystem The operating system to be tested.
     * @returns {Boolean} <code>true</code> if the user's OS matches that
     * specified; otherwise <code>false</code>.
     */
    isThisPlatform: function (operatingSystem) {
        return navigator.userAgent.toLowerCase().indexOf(operatingSystem) !== -1;
    },

    /**
     * <p>Listener for external requests to the extension.</p>
     * <p>This function only serves the request if the originating extension is
     * not blacklisted.</p>
     * @param {Object} request The request sent by the calling script.
     * @param {Object} request.data The data for the copy request feature to be
     * served.
     * @param {KeyEvent} [request.data.e] The DOM <code>KeyEvent</code>
     * responsible for generating the copy request. Only used if type is
     * "shortcut".
     * @param {String} [request.data.feature] The name of the feature on which
     * to execute the copy request.
     * @param {String} [request.data.key] The character of the final key
     * responsible for firing the <code>KeyEvent</code>. Only used if type is
     * "shortcut".
     * @param {String} request.type The type of request being made.
     * @param {MessageSender} [sender] An object containing information about
     * the script context that sent a message or request.
     * @param {function} [sendResponse] Function to call when you have a
     * response. The argument should be any JSON-ifiable object, or undefined
     * if there is no response.
     * @private
     */
    onExternalRequest: function (request, sender, sendResponse) {
        if (!clipboard.isBlacklisted(sender)) {
            clipboard.onRequest(request, sender, sendResponse);
        }
    },

    /**
     * <p>Listener for internal requests to the extension.</p>
     * <p>If the request originated from a keyboard shortcut this function only
     * serves that request if the keyboard shortcuts have been enabled by the
     * user (or by default).</p>
     * @param {Object} request The request sent by the calling script.
     * @param {Object} request.data The data for the copy request feature to be
     * served.
     * @param {KeyEvent} [request.data.e] The DOM <code>KeyEvent</code>
     * responsible for generating the copy request. Only used if type is
     * "shortcut".
     * @param {String} [request.data.feature] The name of the feature on which
     * to execute the copy request.
     * @param {String} [request.data.key] The character of the final key
     * responsible for firing the <code>KeyEvent</code>. Only used if type is
     * "shortcut".
     * @param {String} request.type The type of request being made.
     * @param {MessageSender} [sender] An object containing information about the
     * script context that sent a message or request.
     * @param {function} [sendResponse] Function to call when you have a
     * response. The argument should be any JSON-ifiable object, or undefined if
     * there is no response.
     * @private
     */
    onRequest: function (request, sender, sendResponse) {
        if (request.type !== 'shortcut' || utils.get('settingShortcut')) {
            clipboard.onRequestHelper(request, sender, sendResponse);
        }
    },

    /**
     * <p>Helper function for the internal/external request listeners.</p>
     * <p>This function will serve the copy request.</p>
     * @param {Object} request The request sent by the calling script.
     * @param {Object} request.data The data for the copy request feature to be
     * served.
     * @param {KeyEvent} [request.data.e] The DOM <code>KeyEvent</code>
     * responsible for generating the copy request. Only used if type is
     * "shortcut".
     * @param {String} [request.data.feature] The name of the feature on which
     * to execute the copy request.
     * @param {String} [request.data.key] The character of the final key
     * responsible for firing the <code>KeyEvent</code>. Only used if type is
     * "shortcut".
     * @param {String} request.type The type of request being made.
     * @param {MessageSender} [sender] An object containing information about the
     * script context that sent a message or request.
     * @param {function} [sendResponse] Function to call when you have a
     * response. The argument should be any JSON-ifiable object, or undefined if
     * there is no response.
     * @requires jQuery
     * @private
     */
    onRequestHelper: function (request, sender, sendResponse) {
        chrome.tabs.getSelected(null, function (tab) {
            var handler = (ietab.isActive(tab)) ? ietab : clipboard,
                popup = chrome.extension.getViews({type: 'popup'})[0];
            switch (request.feature) {
                case feature.url.name:
                    clipboard.feature = feature.url.name;
                    handler.copyUrl(tab);
                    if (popup) {
                        popup.close();
                    }
                    break;
                case feature.short.name:
                    if (popup) {
                        $('#loadDiv', popup.document).show();
                        $('#item', popup.document).hide();
                    }
                    clipboard.feature = feature.short.name;
                    handler.copyShortUrl(tab);
                    break;
                case feature.anchor.name:
                    clipboard.feature = feature.anchor.name;
                    handler.copyAnchor(tab);
                    if (popup) {
                        popup.close();
                    }
                    break;
                case feature.bbcode.name:
                    clipboard.feature = feature.bbcode.name;
                    handler.copyBBCode(tab);
                    if (popup) {
                        popup.close();
                    }
                    break;
                case feature.encoded.name:
                    clipboard.feature = feature.encoded.name;
                    handler.copyEncoded(tab);
                    if (popup) {
                        popup.close();
                    }
                    break;
            }
        });
    },

    /**
     * <p>Resents the active feature and status of the current copy request.</p>
     * <p>This function should be called on the completion of a copy request
     * regardless of its outcome.</p>
     */
    reset: function () {
        clipboard.feature = '';
        clipboard.status = false;
    },

    /**
     * <p>Displays a Chrome notification to inform the user on whether or not
     * the copy request was successful.</p>
     * <p>This function ensures that the clipboard is reset and that
     * notifications are only displayed if specified by the user (or by
     * default).</p>
     * @see clipboard.reset
     */
    showNotification: function () {
        if (utils.get('settingNotification')) {
            webkitNotifications
                    .createHTMLNotification(
                        chrome.extension.getURL('pages/notification.html')
                    ).show();
        } else {
            clipboard.reset();
        }
    },

    /**
     * <p>Updates the list of features to reflect the order specified by the
     * user (or by default).</p>
     * <p>It is important that this function is called whenever the order of the
     * features might have changed.</p>
     */
    updateFeatures: function () {
        var count = helper.countProperties(feature);
        clipboard.features = [];
        for (var i = 0; i < count; i++) {
            clipboard.features[i] = clipboard.getFeature(i);
        }
        helper.buildPopup();
    }

};

/**
 * <p>Represents copy request features supported by the extension.</p>
 * <p>Each feature provides the information required to use it.</p>
 * @author <a href="http://github.com/neocotic">Alasdair Mercer</a>
 * @since 0.0.2.1
 * @namespace
 */
var feature = {

    /**
     * <p>Represents the feature that generates the formatted HTML for an anchor
     * tag that can be inserted in to any HTML to link to the URL.</p>
     * @namespace
     */
    anchor: {
        /**
         * @returns {String}
         * @since 0.1.0.0
         */
        image: function () {
            return 'copy_anchor.png';
        },
        /**
         * @returns {Integer}
         * @since 0.1.0.0
         */
        index: function () {
            return utils.get('copy_anchor_index');
        },
        /** @returns {Boolean} */
        isEnabled: function () {
            return utils.get('copy_anchor_enabled');
        },
        /** @type String */
        name: 'copy_anchor',
        /**
         * @returns {String}
         * @since 0.1.0.0
         */
        shortcut: function () {
            return utils.get('copy_anchor_shortcut');
        },
        /**
         * @returns {String}
         * @since 0.1.0.0
         */
        template: function () {
            return '';
        },
        /**
         * @returns {String}
         * @since 0.1.0.0
         */
        title: function () {
            return chrome.i18n.getMessage('copy_anchor');
        }
    },

    /**
     * <p>Represents the feature that generates the formatted BBCode for a
     * <code>url</code> tag that can be added to most forum posts to link to the
     * URL.</p>
     * @namespace
     */
    bbcode: {
        /**
         * @returns {String}
         * @since 0.1.0.0
         */
        image: function () {
            return 'copy_bbcode.png';
        },
        /**
         * @returns {Integer}
         * @since 0.1.0.0
         */
        index: function () {
            return utils.get('copy_bbcode_index');
        },
        /** @returns {Boolean} */
        isEnabled: function () {
            return utils.get('copy_bbcode_enabled');
        },
        /** @type String */
        name: 'copy_bbcode',
        /**
         * @returns {String}
         * @since 0.1.0.0
         */
        shortcut: function () {
            return utils.get('copy_bbcode_shortcut');
        },
        /**
         * @returns {String}
         * @since 0.1.0.0
         */
        template: function () {
            return '';
        },
        /**
         * @returns {String}
         * @since 0.1.0.0
         */
        title: function () {
            return chrome.i18n.getMessage('copy_bbcode');
        }
    },

    /**
     * <p>Represents the feature that encodes the URL so it can be used in
     * special situations.</p>
     * @namespace
     */
    encoded: {
        /**
         * @returns {String}
         * @since 0.1.0.0
         */
        image: function () {
            return 'copy_encoded.png';
        },
        /**
         * @returns {Integer}
         * @since 0.1.0.0
         */
        index: function () {
            return utils.get('copy_encoded_index');
        },
        /** @returns {Boolean} */
        isEnabled: function () {
            return utils.get('copy_encoded_enabled');
        },
        /** @type String */
        name: 'copy_encoded',
        /**
         * @returns {String}
         * @since 0.1.0.0
         */
        shortcut: function () {
            return utils.get('copy_encoded_shortcut');
        },
        /**
         * @returns {String}
         * @since 0.1.0.0
         */
        template: function () {
            return '';
        },
        /**
         * @returns {String}
         * @since 0.1.0.0
         */
        title: function () {
            return chrome.i18n.getMessage('copy_encoded');
        }
    },

    /**
     * <p>Represents the feature that retrieves a shortened version of the URL
     * which can be used anywhere, but more commonly micro-blogging or social
     * networking sites.</p>
     * @namespace
     */
    short: {
        /**
         * @returns {String}
         * @since 0.1.0.0
         */
        image: function () {
            return 'copy_short.png';
        },
        /**
         * @returns {Integer}
         * @since 0.1.0.0
         */
        index: function () {
            return utils.get('copy_short_index');
        },
        /** @returns {Boolean} */
        isEnabled: function () {
            return utils.get('copy_short_enabled');
        },
        /** @type String */
        name: 'copy_short',
        /**
         * @returns {String}
         * @since 0.1.0.0
         */
        shortcut: function () {
            return utils.get('copy_short_shortcut');
        },
        /**
         * @returns {String}
         * @since 0.1.0.0
         */
        template: function () {
            return '';
        },
        /**
         * @returns {String}
         * @since 0.1.0.0
         */
        title: function () {
            return chrome.i18n.getMessage('copy_short');
        }
    },

    /**
     * <p>Represents the feature that simply uses the original URL which can be
     * used anywhere.</p>
     * @namespace
     */
    url: {
        /**
         * @returns {String}
         * @since 0.1.0.0
         */
        image: function () {
            return 'copy_url.png';
        },
        /**
         * @returns {Integer}
         * @since 0.1.0.0
         */
        index: function () {
            return utils.get('copy_url_index');
        },
        /** @returns {Boolean} */
        isEnabled: function () {
            return utils.get('copy_url_enabled');
        },
        /** @type String */
        name: 'copy_url',
        /**
         * @returns {String}
         * @since 0.1.0.0
         */
        shortcut: function () {
            return utils.get('copy_url_shortcut');
        },
        /**
         * @returns {String}
         * @since 0.1.0.0
         */
        template: function () {
            return '';
        },
        /**
         * @returns {String}
         * @since 0.1.0.0
         */
        title: function () {
            return chrome.i18n.getMessage('copy_url');
        }
    }

};

/**
 * <p>Provides helper functions used by the background page.</p>
 * @author <a href="http://github.com/neocotic">Alasdair Mercer</a>
 * @since 0.0.2.1
 * @namespace
 */
var helper = {

    /**
     * <p>Prepends slashes to any escape characters in the string provided.</p>
     * @param {String} str The string to be parsed.
     * @returns {String} The parsed string.
     */
    addSlashes: function (str) {
        return str
            .replace('\\', '\\\\')
            .replace('"', '\\"')
            .replace('\'', '\\\'');
    },

    /**
     * <p>Creates a <code>&lt;li/&gt;</code> representing the feature provided.
     * This is to be inserted in to the <code>&lt;ul/&gt;</code> in the popup
     * page but is created here to optimize display times for the popup.</p>
     * @param {feature} feature The information of the feature to be used.
     * @returns {jQuery} The generated <code>&lt;li/&gt;</code> jQuery object.
     * @since 0.1.0.0
     * @requires jQuery
     * @private
     */
    buildFeature: function (feature) {
        var item = $('<li/>', {
            id: feature.id + 'Item',
            name: feature.name,
            onclick: 'popup.sendRequest(this);'
        });
        var image = '../images/' + (feature.image() || 'copy_url.png');
        var menu = $('<div/>', {
            'class': 'menu',
            id: feature.id,
            style: 'background-image: url(\'' + image + '\');'
        });
        menu.append($('<span/>', {
            'class': 'text',
            id: feature.id + 'Text'
        }));
        if (utils.get('settingShortcut')) {
            var modifiers = clipboard.shortcutModifiers;
            if (clipboard.isThisPlatform('mac')) {
                modifiers = clipboard.shortcutMacModifiers;
            }
            menu.append($('<span/>', {
                'class': 'shortcut',
                id: feature.id + 'Shortcut',
                text: modifiers + feature.shortcut()
            }));
        }
        return item.append(menu);
    },

    /**
     * <p>Builds the HTML to populate the popup with to optimize popup loading
     * times.</p>
     * @since 0.1.0.0
     * @requires jQuery
     */
    buildPopup: function () {
        var loadDiv = $('<div id="loadDiv"/>');
        loadDiv.append($('<img src="../images/loading.gif"/>'), $('<div/>', {
            text: chrome.i18n.getMessage('shortening')
        }));
        var item = $('<div id="item"/>');
        var itemList = $('<ul/>');
        itemList.append($('<li id="ieTabItem"/>').append(
            $('<div/>', {
                'class': 'menu',
                style: 'background-image: url(\'../images/explorer.png\')'
            }).append(
                $('<span/>', {
                    'class': 'text',
                    text: chrome.i18n.getMessage('ie_tab')
                })
            )
        ));
        // Generates the HTML for each feature
        for (var key in feature) {
            if (feature[key].isEnabled()) {
                itemList.append(helper.buildFeature(feature[key]));
            }
        }
        item.append(itemList);
        /*
         * Calculates the widest text <code>&lt;div/&gt;</code> in the popup and
         * assigns that width to all others.
         */
        var textItems = itemList.find('li .text'),
            width = 0;
        textItems.each(function () {
            var scrollWidth = this.scrollWidth;
            if (scrollWidth > width) {
                width = scrollWidth;
            }
        });
        textItems.css('width', width + 'px');
        clipboard.popupHTML = $('<div/>').append(loadDiv, item).html();
    },

    /**
     * <p>Calls the active URL Shortener service with the URL provided in order
     * to obtain a corresponding short URL.</p>
     * <p>This function also handles the result of the call by either copying
     * the returned URL to the clipboard or showing a failure message (if
     * notifications are enabled by the user) as well as ensuring the popup page
     * is closed.</p>
     * @param {String} url The URL to be shortened and added to the clipboard.
     * @see shortener
     */
    callUrlShortener: function (url) {
        helper.callUrlShortenerHelper(url, function (url, service) {
            var params = service.getParameters(url) || {};
            var req = new XMLHttpRequest();
            req.open(service.method, service.url + '?' + $.param(params), true);
            req.setRequestHeader('Content-Type', service.contentType);
            if (service.oauth && service.isOAuthEnabled()) {
                req.setRequestHeader('Authorization',
                        service.oauth.getAuthorizationHeader(service.url,
                        service.method, params));
            }
            req.onreadystatechange = function () {
                if (req.readyState === 4) {
                    var output = service.output(req.responseText);
                    if (output) {
                        clipboard.copy(output);
                    } else {
                        clipboard.status = false;
                        clipboard.showNotification();
                    }
                    var popup = chrome.extension.getViews({type: 'popup'})[0];
                    if (popup) {
                        popup.close();
                    }
                }
            };
            req.send(service.input(url));
        });
    },

    /**
     * <p>Helper method which determines when the callback function provided is
     * called depending on whether or not the active URL Shortener supports
     * OAuth.</p>
     * @param {String} url The URL to be shortened and added to the clipboard.
     * @param {Function} callback The function that is called either
     * immediately or once autherized if OAuth is supported.
     * @see helper.callUrlShortener
     * @private
     */
    callUrlShortenerHelper: function (url, callback) {
        var service = clipboard.getUrlShortener();
        if (service.oauth && service.isOAuthEnabled()) {
            service.oauth.authorize(function () {
                callback(url, service);
            });
        } else {
            callback(url, service);
        }
    },

    /**
     * <p>Counts the number of properties that are associated with the object
     * provided.</p>
     * <p>This function only counts properties that actually belong to the
     * object and does not count properties added via prototype.</p>
     * @param {Object} obj The object to be used.
     * @return {Integer} The number of properties belonging to the object
     * provided.
     */
    countProperties: function (obj) {
        var count = 0;
        for (var p in obj) {
            if (obj.hasOwnProperty(p)) {
                count++;
            }
        }
        return count;
    },

    /**
     * <p>Attempts to create formatted HTML for an anchor tag using the data
     * provided.</p>
     * @param {Object} data The information to be used to create the anchor.
     * @param {String} data.href The URL to be associated with the anchor.
     * @param {String} data.text The text contents of the anchor.
     * @param {String} [data.title] The title of the anchor.
     * @returns {String} The formatted HTML for the generated anchor tag.
     * @requires jQuery
     */
    createAnchor: function (data) {
        if (!data.target && utils.get('settingTargetAttr')) {
            data.target = '_blank';
        }
        return $('<div/>').append($('<a/>', data)).html();
    },

    /**
     * <p>Attempts to create formatted BBCode for a <code>url</code> tag using
     * the data provided.</p>
     * @param {Object} data The information to be used to create the BBCode.
     * @param {String} [data.text] The text contents of the BBCode.
     * @param {String} data.url The URL to be associated with the BBCode.
     * @returns {String} The formatted BBCode for the generated <code>url</code>
     * tag.
     */
    createBBCode: function (data) {
        if (data.text) {
            return '[url=' + data.url + ']' + data.text + '[/url]';
        } else {
            return '[url]' + data.url + '[/url]';
        }
    },

    /**
     * <p>Decodes the URL provided.</p>
     * <p>This function fully decodes the URL provided and does not ignore
     * beginning.</p>
     * @param {String} url The URL to be decoded.
     * @returns {String} The decoded URL.
     * @see decodeURIComponent
     */
    decode: function (url) {
        return decodeURIComponent(url);
    },

    /**
     * <p>Encodes the URL provided.</p>
     * <p>This function fully encodes the URL provided and does not ignore
     * beginning.</p>
     * @param {String} url The URL to be encoded.
     * @returns {String} The encoded URL.
     * @see encodeURIComponent
     */
    encode: function (url) {
        return encodeURIComponent(url);
    },

    /**
     * <p>Replaces any escape characters with their entity counterparts in the
     * string provided.</p>
     * @param {String} str The string to be parsed.
     * @returns {String} The parsed string.
     */
    replaceEntities: function (str) {
        return str
            .replace('&', '&amp;')
            .replace('"', '&quot;')
            .replace('<', '&lt;')
            .replace('>', '&gt;');
    }

};

/**
 * <p>Provides an interface to by used by {@link clipboard} for copy requests on
 * tabs where the IE Tab is currently active.</p>
 * @author <a href="http://github.com/neocotic">Alasdair Mercer</a>
 * @since 0.0.2.0
 * @namespace
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

    /**
     * <p>Copies generated formatted HTML for an anchor tag to the clipboard.</p>
     * @param {Tab} tab The tab whose information is to be used to generate the
     * anchor tag.
     * @requires jQuery
     */
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
        data.text = helper.replaceEntities(data.text);
        clipboard.copy(helper.createAnchor(data));
    },

    /**
     * <p>Copies generated formatted BBCode for a <code>url</code> tag to the
     * clipboard.</p>
     * @param {Tab} tab The tab whose information is to be used to generate the
     * <code>url</code> tag.
     */
    copyBBCode: function (tab) {
        var data = {
            text: tab.title,
            url: tab.url
        };
        if (utils.get('settingIeTabExtract')) {
            data.url = helper.decode(ietab.extractUrl(data.url));
        }
        if (data.text && utils.get('settingIeTabTitle')) {
            data.text = ietab.extractTitle(data.text);
        }
        clipboard.copy(helper.createBBCode(data));
    },

    /**
     * <p>Copies the encoded URL to the clipboard.</p>
     * @param {Tab} tab The tab whose information is to be used to generated the
     * encoded URL.
     */
    copyEncoded: function (tab) {
        var url = tab.url;
        if (utils.get('settingIeTabExtract')) {
            url = ietab.extractUrl(url);
        } else {
            var embeddedUrl = ietab.extractUrl(url);
            var index = url.indexOf(embeddedUrl);
            url = helper.encode(url.substring(0, index)) + embeddedUrl;
        }
        clipboard.copy(url);
    },

    /**
     * <p>Copies the shortened version of the URL to the clipboard.</p>
     * @param {Tab} tab The tab whose information is to be used to generate the
     * short URL.
     * @see helper.callUrlShortener
     */
    copyShortUrl: function (tab) {
        var url = tab.url;
        if (utils.get('settingIeTabExtract')) {
            url = helper.decode(ietab.extractUrl(url));
        }
        helper.callUrlShortener(url);
    },

    /**
     * <p>Copies the URL to the clipboard.</p>
     * @param {Tab} tab The tab whose information is to be used.
     */
    copyUrl: function (tab) {
        var url = tab.url;
        if (utils.get('settingIeTabExtract')) {
            url = helper.decode(ietab.extractUrl(url));
        }
        clipboard.copy(url);
    },

    /**
     * <p>Attempts to extract the title embedded within that used by the IE Tab
     * extension.</p>
     * <p>If no title prefix was detected the string provided is returned.</p>
     * @param {String} str The string from which to extract the embedded title.
     * @returns {String} The title extracted from the string or the string if no
     * prefix was detected.
     * @private
     */
    extractTitle: function (str) {
        var idx = str.indexOf(ietab.titlePrefix);
        if (idx !== -1) {
            return str.substring(idx + ietab.titlePrefix.length);
        }
        return str;
    },

    /**
     * <p>Attempts to extract the URL embedded within that used by the IE Tab
     * extension.</p>
     * <p>The embedded URL is returned as-is and is not decoded prior to being
     * returned. If no embedded URL was found the string provided is returned.
     * </p>
     * @param {String} str The string from which to extract the embedded URL.
     * @returns {String} The URL extracted from the string or the string if no
     * embedded URL was found.
     * @private
     */
    extractUrl: function (str) {
        var idx = str.indexOf(ietab.containerSegment);
        if (idx !== -1) {
            return str.substring(idx + ietab.containerSegment.length);
        }
        return str;
    },

    /**
     * <p>Determines whether or not the IE Tab extension is currently active on
     * the tab provided.</p>
     * @param {Tab} tab The tab to be tested.
     * @returns {Boolean} <code>true</code> if the IE Tab extension is active;
     * otherwise <code>false</code>.
     */
    isActive: function (tab) {
        return clipboard.isSpecialPage(tab) &&
                tab.url.indexOf(ietab.extensionId) !== -1;
    }

};

/**
 * <p>Represents URL Shortener services supported by the extension.</p>
 * <p>Each shortener provides the information required to use its service and
 * the logic to prepare the data to be sent and parse the data received.</p>
 * @author <a href="http://github.com/neocotic">Alasdair Mercer</a>
 * @since 0.0.2.1
 * @namespace
 */
var shortener = {

    /**
     * <p>Represents the bit.ly service.</p>
     * @namespace
     */
    bitly: {
        /** @type String */
        contentType: 'application/x-www-form-urlencoded',
        /**
         * @param {String} url
         * @returns {Object}
         */
        getParameters: function (url) {
            var params = {
                'login': 'urlcopy',
                'apiKey': 'R_05858399e8a60369e1d1562817b77b39',
                'longUrl': url,
                'format': 'json'
            };
            if (utils.get('bitlyXApiKey') && utils.get('bitlyXLogin')) {
                params.x_apiKey = utils.get('bitlyXApiKey');
                params.x_login = utils.get('bitlyXLogin');
            }
            return params;
        },
        /**
         * @param {String} url
         * @returns {String}
         */
        input: function (url) {
            return null;
        },
        /** @returns {Boolean} */
        isEnabled: function () {
            return utils.get('bitlyEnabled');
        },
        /** @type String */
        method: 'GET',
        /** @type String */
        name: 'bit.ly',
        /**
         * @param {String} resp
         * @returns {String}
         */
        output: function (resp) {
            return JSON.parse(resp).data.url;
        },
        /** @type String */
        url: 'http://api.bitly.com/v3/shorten'
    },

    /**
     * <p>Represents the Google URL Shortener service.</p>
     * @namespace
     */
    google: {
        /** @type String */
        contentType: 'application/json',
        /**
         * @param {String} url
         * @returns {Object}
         */
        getParameters: function (url) {
            var params = {
                'key': 'AIzaSyD504IwHeL3V2aw6ZGYQRgwWnJ38jNl2MY'
            };
            return params;
        },
        /**
         * @param {String} url
         * @returns {String}
         */
        input: function (url) {
            return JSON.stringify({'longUrl': url});
        },
        /** @returns {Boolean} */
        isEnabled: function () {
            return utils.get('googleEnabled');
        },
        /** @returns {Boolean} */
        isOAuthEnabled: function () {
            return utils.get('googleOAuthEnabled');
        },
        /** @type String */
        method: 'POST',
        /** @type String */
        name: 'goo.gl',
        /** @type Object */
        oauth: ChromeExOAuth.initBackgroundPage({
            'request_url': 'https://www.google.com/accounts/OAuthGetRequestToken',
            'authorize_url': 'https://www.google.com/accounts/OAuthAuthorizeToken',
            'access_url': 'https://www.google.com/accounts/OAuthGetAccessToken',
            'consumer_key': 'anonymous',
            'consumer_secret': 'anonymous',
            'scope': 'https://www.googleapis.com/auth/urlshortener',
            'app_name': 'URL-Copy'
        }),
        /**
         * @param {String} resp
         * @returns {String}
         */
        output: function (resp) {
            return JSON.parse(resp).id;
        },
        /** @type String */
        url: 'https://www.googleapis.com/urlshortener/v1/url'
    }

};