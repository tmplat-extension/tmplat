/**
 * <p>Main controller for the extension and manages all copy requests.</p>
 * @author <a href="http://github.com/neocotic">Alasdair Mercer</a>
 * @since 0.1.0.0 - Previously named <code>clipboard</code>.
 * @namespace
 */
var urlcopy = {

    /**
     * <p>A list of blacklisted extension IDs who should be prevented from
     * making requests to the extension.</p>
     * @private
     * @type Array
     */
    blacklistedExtensions: [],

    /**
     * <p>The default features to be used by this extension.</p>
     * @since 0.1.0.0
     * @private
     * @type Array
     */
    defaultFeatures: [{
        image: 'copy_anchor.png',
        index: 2,
        enabled: true,
        name: '_anchor',
        readOnly: true,
        shortcut: 'A',
        template: '<a href="{{source}}"{#doAnchorTitle} title="{{title}}"{/doAnchorTitle}>{{title}}</a>',
        title: chrome.i18n.getMessage('copy_anchor')
    }, {
        image: 'copy_bbcode.png',
        index: 4,
        enabled: false,
        name: '_bbcode',
        readOnly: true,
        shortcut: 'B',
        template: '[url={source}]{title}[/url]',
        title: chrome.i18n.getMessage('copy_bbcode')
    }, {
        image: 'copy_encoded.png',
        index: 3,
        enabled: true,
        name: '_encoded',
        readOnly: true,
        shortcut: 'E',
        template: '{encoded}',
        title: chrome.i18n.getMessage('copy_encoded')
    }, {
        image: 'copy_short.png',
        index: 1,
        enabled: true,
        name: '_short',
        readOnly: true,
        shortcut: 'S',
        template: '{short}',
        title: chrome.i18n.getMessage('copy_short')
    }, {
        image: 'copy_url.png',
        index: 0,
        enabled: true,
        name: '_url',
        readOnly: true,
        shortcut: 'U',
        template: '{source}',
        title: chrome.i18n.getMessage('copy_url')
    }],

    /**
     * <p>The list of copy request features supported by the extension.</p>
     * <p>This list ordered to match that specified by the user.</p>
     * @see urlcopy.updateFeatures
     * @type Array
     */
    features: [],

    /**
     * <p>Provides potential of displaying a message to the user other than the
     * defaults that depend on the value of {@link urlcopy.status}.</p>
     * <p>This value is reset to an empty String after every copy request.</p>
     * @since 0.1.0.0
     * @type String
     */
    message: '',

    /**
     * <p>The HTML to populate the popup with.</p>
     * <p>This should be updated whenever changes are made to the features.</p>
     * @see urlcopy.updateFeatures
     * @since 0.1.0.0
     * @type String
     */
    popupHTML: '',

    /**
     * <p>String representation of the keyboard modifiers listened to by this
     * extension on Windows/Linux platforms.</p>
     * @since 0.1.0.0
     * @type String
     */
    shortcutModifiers: 'Ctrl+Alt+',

    /**
     * <p>String representation of the keyboard modifiers listened to by this
     * extension on Mac platforms.</p>
     * @since 0.1.0.0
     * @type String
     */
    shortcutMacModifiers: '&#8984;-Shift-',

    /**
     * <p>The URL shortener services supported by this extension.</p>
     * @since 0.1.0.0
     * @private
     * @type Array
     */
    shorteners: [{
        contentType: 'application/x-www-form-urlencoded',
        getParameters: function (url) {
            var params = {
                apiKey: 'R_05858399e8a60369e1d1562817b77b39',
                format: 'json',
                login: 'urlcopy',
                longUrl: url
            };
            if (utils.get('bitly_xapi_key') && utils.get('bitly_xlogin')) {
                params.x_apiKey = utils.get('bitly_xapi_key');
                params.x_login = utils.get('bitly_xlogin');
            }
            return params;
        },
        input: function (url) {
            return null;
        },
        isEnabled: function () {
            return utils.get('bitly_enabled');
        },
        method: 'GET',
        name: 'bit.ly',
        output: function (resp) {
            return JSON.parse(resp).data.url;
        },
        url: function () {
            return 'http://api.bitly.com/v3/shorten';
        }
    }, {
        contentType: 'application/json',
        getParameters: function (url) {
            return {
                key: 'AIzaSyD504IwHeL3V2aw6ZGYQRgwWnJ38jNl2MY'
            };
        },
        input: function (url) {
            return JSON.stringify({longUrl: url});
        },
        isEnabled: function () {
            return utils.get('googl_enabled');
        },
        isOAuthEnabled: function () {
            return utils.get('googl_oath_enabled');
        },
        method: 'POST',
        name: 'goo.gl',
        oauth: ChromeExOAuth.initBackgroundPage({
            access_url: 'https://www.google.com/accounts/OAuthGetAccessToken',
            app_name: 'URL-Copy',
            authorize_url: 'https://www.google.com/accounts/OAuthAuthorizeToken',
            consumer_key: 'anonymous',
            consumer_secret: 'anonymous',
            request_url: 'https://www.google.com/accounts/OAuthGetRequestToken',
            scope: 'https://www.googleapis.com/auth/urlshortener'
        }),
        output: function (resp) {
            return JSON.parse(resp).id;
        },
        url: function () {
            return 'https://www.googleapis.com/urlshortener/v1/url';
        }
    }, {
        contentType: 'application/json',
        getParameters: function (url) {
            var params = {
                action: 'shorturl',
                format: 'json',
                url: url
            };
            if (utils.get('yourls_username') && utils.get('yourls_password')) {
                params.password = utils.get('yourls_password');
                params.username = utils.get('yourls_username');
            } else if (utils.get('yourls_signature')) {
                params.signature = utils.get('yourls_signature');
            }
            return params;
        },
        input: function (url) {
            return null;
        },
        isEnabled: function () {
            return utils.get('yourls_enabled');
        },
        method: 'POST',
        name: 'YOURLS',
        output: function (resp) {
            return JSON.parse(resp).shorturl;
        },
        url: function () {
            return utils.get('yourls_url');
        }
    }],

    /**
     * <p>Indicates whether or not the current copy request was a success.</p>
     * <p>This value is reset to <code>false</code> after every copy
     * request.</p>
     * @type Boolean
     */
    status: false,

    /**
     * <p>Adds the specified feature name to those stored in localStorage.</p>
     * <p>The feature name is only added if it doesn't already exist.</p>
     * @param {String} name The feature name to be stored.
     * @returns {Boolean} <code>true</code> if the name was stored; otherwise
     * <code>false</code>.
     * @since 0.1.0.0
     * @private
     */
    addFeatureName: function (name) {
        var features = utils.get('features');
        if (features.indexOf(name) === -1) {
            features.push(name);
            utils.set('features', features);
            return true;
        }
        return false;
    },

    /**
     * <p>Creates a <code>&lt;li/&gt;</code> representing the feature provided.
     * This is to be inserted in to the <code>&lt;ul/&gt;</code> in the popup
     * page but is created here to optimize display times for the popup.</p>
     * @param {Object} feature The information of the feature to be used.
     * @returns {jQuery} The generated <code>&lt;li/&gt;</code> jQuery object.
     * @since 0.1.0.0
     * @requires jQuery
     * @private
     */
    buildFeature: function (feature) {
        var image = '../images/' + (feature.image || 'copy_url.png'),
            item = $('<li/>', {
                name: feature.name,
                onclick: 'popup.sendRequest(this);'
            }),
            menu = $('<div/>', {
                'class': 'menu',
                style: 'background-image: url(\'' + image + '\');'
            });
        menu.append($('<span/>', {
            'class': 'text',
            text: feature.title
        }));
        if (utils.get('shortcuts')) {
            var modifiers = urlcopy.shortcutModifiers;
            if (urlcopy.isThisPlatform('mac')) {
                modifiers = urlcopy.shortcutMacModifiers;
            }
            menu.append($('<span/>', {
                'class': 'shortcut',
                text: modifiers + feature.shortcut
            }));
        }
        return item.append(menu);
    },

    /**
     * <p>Builds the HTML to populate the popup with to optimize popup loading
     * times.</p>
     * @since 0.1.0.0
     * @requires jQuery
     * @private
     */
    buildPopup: function () {
        var item = $('<div id="item"/>'),
            itemList = $('<ul id="itemList"/>'),
            loadDiv = $('<div id="loadDiv"/>');
        loadDiv.append($('<img src="../images/loading.gif"/>'), $('<div/>', {
            text: chrome.i18n.getMessage('shortening')
        }));
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
        for (var i = 0; i < urlcopy.features.length; i++) {
            if (urlcopy.features[i].enabled) {
                itemList.append(urlcopy.buildFeature(urlcopy.features[i]));
            }
        }
        item.append(itemList);
        urlcopy.popupHTML = $('<div/>').append(loadDiv, item).html();
    },

    /**
     * <p>Creates an Object containing data based on information extracted from
     * the specified tab.</p>
     * <p>This function merges this data with additional information relating to
     * the URL of the tab.</p>
     * <p>If a shortened URL is requested when parsing the template later the
     * callback function specified is called to handle this scenario as we don't
     * want to call a URL shortener service unless it is required.</p>
     * @param {Tab} tab The tab whose information is to be extracted.
     * @param {function} shortCallback The function to be called if/when a
     * shortened URL is requested when parsing the template.
     * @returns {Object} The data based on information extracted from the tab
     * provided and its URL. This can contain Strings, Arrays, Objects, and
     * functions.
     * @since 0.1.0.0
     * @requires jQuery
     * @requires jQuery URL Parser Plugin
     * @private
     */
    buildTemplateData: function (tab, shortCallback) {
        var data = {}, title = '', url = {};
        if (ietab.isActive(tab)) {
            title = ietab.extractTitle(tab.title);
            url = $.url(ietab.extractUrl(tab.url));
        } else {
            title = tab.title;
            url = $.url(tab.url);
        }
        $.extend(data, url.attr(), {
            doAnchorTarget: utils.get('doAnchorTarget'),
            doAnchorTitle: utils.get('doAnchorTitle'),
            encoded: encodeURIComponent(url.attr('source')),
            favicon: tab.favIconUrl,
            fparam: url.fparam,
            fparams: url.fparam(),
            fsegment: url.fsegment,
            fsegments: url.fsegment(),
            notificationDuration: utils.get('notificationDuration') / 1000,
            notifications: utils.get('notifications'),
            originalSource: tab.url,
            originalTitle: tab.title || url.attr('source'),
            param: url.param,
            params: url.param(),
            segment: url.segment,
            segments: url.segment(),
            'short': function () {
                return shortCallback();
            },
            shortcuts: utils.get('shortcuts'),
            title: title || url.attr('source')
        });
        return data;
    },

    /**
     * <p>Calls the active URL shortener service with the URL provided in order
     * to obtain a corresponding short URL.</p>
     * <p>This function calls the callback function specified with the result
     * once it has been received.</p>
     * @param {String} url The URL to be shortened and added to the clipboard.
     * @param {function} callback The function to be called once a response has
     * been received.
     * @see urlcopy.shorteners
     * @since 0.1.0.0 - Previously located in <code>helper</code>.
     */
    callUrlShortener: function (url, callback) {
        urlcopy.callUrlShortenerHelper(url, function (url, service) {
            var params = service.getParameters(url) || {};
            var req = new XMLHttpRequest();
            req.open(service.method, service.url() + '?' + $.param(params),
                true);
            req.setRequestHeader('Content-Type', service.contentType);
            if (service.oauth && service.isOAuthEnabled()) {
                req.setRequestHeader('Authorization',
                        service.oauth.getAuthorizationHeader(service.url(),
                        service.method, params));
            }
            req.onreadystatechange = function () {
                if (req.readyState === 4) {
                    callback(service.output(req.responseText));
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
     * @see urlcopy.callUrlShortener
     * @since 0.1.0.0 - Previously located in <code>helper</code>.
     * @private
     */
    callUrlShortenerHelper: function (url, callback) {
        var service = urlcopy.getUrlShortener();
        if (service.oauth && service.isOAuthEnabled()) {
            service.oauth.authorize(function () {
                callback(url, service);
            });
        } else {
            callback(url, service);
        }
    },

    /**
     * <p>Adds the specified string to the system clipboard.</p>
     * <p>This is the core function for copying to the clipboard by the
     * extension. All supported copy requests should, at some point, call this
     * function.</p>
     * @param {String} str The string to be added to the clipboard.
     * @requires document.execCommand
     * @requires jQuery
     */
    copy: function (str) {
        var popup = chrome.extension.getViews({type: 'popup'})[0],
            sandbox = $('#sandbox').val(str).select();
        urlcopy.status = document.execCommand('copy', false, null);
        sandbox.val('');
        urlcopy.showNotification();
        if (popup) {
            popup.close();
        }
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
                        urlcopy.executeScriptsInExistingTabs);
            }
        });
    },

    /**
     * <p>Attempts to return the information for the any feature with the
     * specified shortcut assigned to it.</p>
     * @param {String} shortcut The shortcut to be queried.
     * @returns {Object} The function using the shortcut provided, if possible.
     * @since 0.1.0.0
     */
    getFeatureWithShortcut: function (shortcut) {
        var feature;
        for (var i = 0; i < urlcopy.features.length; i++) {
            if (urlcopy.features[i].shortcut === shortcut) {
                feature = urlcopy.features[i];
                break;
            }
        }
        return feature;
    },

    /**
     * <p>Returns the information for the active URL shortener service.</p>
     * @returns {Object} The active URL shortener.
     * @see urlcopy.shorteners
     */
    getUrlShortener: function () {
        // Attempts to lookup enabled URL shortener service
        for (var i = 0; i < urlcopy.shorteners.length; i++) {
            if (urlcopy.shorteners[i].isEnabled()) {
                return urlcopy.shorteners[i];
            }
        }
        // Returns goo.gl service by default
        return urlcopy.shorteners[1];
    },

    /**
     * <p>Initializes the background page.</p>
     * <p>This involves initializing the settings, injecting keyboard shortcut
     * listeners and adding the request listeners.</p>
     */
    init: function () {
        urlcopy.init_update(); // TODO: Remove call in v0.1.0.1
        utils.init('notifications', true);
        utils.init('notificationDuration', 3000);
        utils.init('shortcuts', true);
        utils.init('doAnchorTarget', false);
        utils.init('doAnchorTitle', false);
        urlcopy.initFeatures();
        urlcopy.initUrlShorteners();
        urlcopy.executeScriptsInExistingWindows();
        chrome.extension.onRequest.addListener(urlcopy.onRequest);
        chrome.extension.onRequestExternal.addListener(
            urlcopy.onExternalRequest
        );
    },

    /**
     * <p>Handles the conversion/removal of older version of settings that may
     * have been stored previously by {@link urlcopy.init}.</p>
     * @since 0.1.0.0
     * @private
     */
    init_update: function () {
        // TODO: Remove function in v0.1.0.1
        utils.rename('settingNotification', 'notifications', true);
        utils.rename('settingNotificationTimer', 'notificationDuration', 3000);
        utils.rename('settingShortcut', 'shortcuts', true);
        utils.rename('settingTargetAttr', 'doAnchorTarget', false);
        utils.rename('settingTitleAttr', 'doAnchorTitle', false);
        utils.remove('settingIeTabExtract');
        utils.remove('settingIeTabTitle');
    },

    /**
     * <p>Initilaizes the values of the specified feature by potentially
     * storing them in to their respective locations.</p>
     * <p>This function should only be used initializing default features and
     * some values will always overwrite the existing one to provide
     * functionality for changing current defaults.</p>
     * <p>Names of initialized features are also added to that stored in
     * localStorage if they do not already exist there.</p>
     * @param {Object} feature The feature whose values are to be initialized.
     * @param {String} feature.image The file name of the feature's image
     * (overwrites).
     * @param {Integer} feature.index The index representing the feature's
     * display order.
     * @param {Boolean} feature.enabled <code>true</code> if the feature is
     * enabled; otherwise <code>false</code>.
     * @param {String} feature.name The unique name of the feature.
     * @param {Boolean} feature.readOnly <code>true</code> if the feature is
     * read-only and certain values cannot be editted by the user; otherwise
     * <code>false</code> (overwrites).
     * @param {String} feature.shortcut The keyboard shortcut assigned to the
     * feature.
     * @param {String} feature.template The mustache template for the feature
     * (overwrites).
     * @param {String} feature.title The title of the feature (overwrites).
     * @returns {Object} The feature provided.
     * @since 0.1.0.0
     * @private
     */
    initFeature: function (feature) {
        var name = feature.name;
        utils.set('feat_' + name + '_image', feature.image);
        utils.init('feat_' + name + '_index', feature.index);
        utils.init('feat_' + name + '_enabled', feature.enabled);
        utils.set('feat_' + name + '_readonly', feature.readOnly);
        utils.init('feat_' + name + '_shortcut', feature.shortcut);
        utils.set('feat_' + name + '_template', feature.template);
        utils.set('feat_' + name + '_title', feature.title);
        urlcopy.addFeatureName(name);
        return feature;
    },

    /**
     * <p>Initializes the supported copy request features (including their
     * corresponding settings).</p>
     * @private
     */
    initFeatures: function () {
        urlcopy.initFeatures_update(); // TODO: Remove call in v0.1.0.1
        utils.init('features', []);
        for (var i = 0; i < urlcopy.defaultFeatures.length; i++) {
            urlcopy.initFeature(urlcopy.defaultFeatures[i]);
        }
        urlcopy.updateFeatures();
    },

    /**
     * <p>Handles the conversion/removal of older version of settings that may
     * have been stored previously by {@link urlcopy.initFeatures}.</p>
     * @since 0.1.0.0
     * @private
     */
    initFeatures_update: function () {
        // TODO: Remove function in v0.1.0.1
        utils.rename('copyAnchorEnabled', 'feat__anchor_enabled', true);
        utils.rename('copyAnchorOrder', 'feat__anchor_index', 2);
        utils.rename('copyBBCodeEnabled', 'feat__bbcode_enabled', false);
        utils.rename('copyBBCodeOrder', 'feat__bbcode_index', 4);
        utils.rename('copyEncodedEnabled', 'feat__encoded_enabled', true);
        utils.rename('copyEncodedOrder', 'feat__encoded_index', 3);
        utils.rename('copyShortEnabled', 'feat__short_enabled', true);
        utils.rename('copyShortOrder', 'feat__short_index', 1);
        utils.rename('copyUrlEnabled', 'feat__url_enabled', true);
        utils.rename('copyUrlOrder', 'feat__url_index', 0);
    },

    /**
     * <p>Initializes the settings related to the supported URL Shortener
     * services.</p>
     * @private
     */
    initUrlShorteners: function () {
        urlcopy.initUrlShorteners_update(); // TODO: Remove call in v0.1.0.1
        utils.init('bitly_enabled', false);
        utils.init('bitly_xapi_key', '');
        utils.init('bitly_xlogin', '');
        utils.init('googl_enabled', true);
        utils.init('googl_oauth_enabled', true);
        utils.init('yourls_enabled', false);
        utils.init('yourls_password', '');
        utils.init('yourls_signature', '');
        utils.init('yourls_url', '');
        utils.init('yourls_username', '');
    },

    /**
     * <p>Handles the conversion/removal of older version of settings that may
     * have been stored previously by {@link urlcopy.initUrlShorteners}.</p>
     * @since 0.1.0.0
     * @private
     */
    initUrlShorteners_update: function () {
        // TODO: Remove function in v0.1.0.1
        utils.rename('bitlyEnabled', 'bitly_enabled', false);
        utils.rename('bitlyXApiKey', 'bitly_xapi_key', '');
        utils.rename('bitlyXLogin', 'bitly_xlogin', '');
        utils.rename('googleEnabled', 'googl_enabled', true);
        utils.rename('googleOAuthEnabled', 'googl_oauth_enabled', true);
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
        for (var i = 0; i < urlcopy.blacklistedExtensions.length; i++) {
            if (urlcopy.blacklistedExtensions[i] === sender.id) {
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
     * @param {String} os The operating system to be tested.
     * @returns {Boolean} <code>true</code> if the user's OS matches that
     * specified; otherwise <code>false</code>.
     */
    isThisPlatform: function (os) {
        return navigator.userAgent.toLowerCase().indexOf(os) !== -1;
    },

    /**
     * <p>Loads the values of the feature with the specified name from their
     * respective locations.</p>
     * @param {String} name The name of the feature whose values are to be
     * fetched.
     * @returns {Object} The feature for the name provided.
     * @since 0.1.0.0
     * @private
     */
    loadFeature: function (name) {
        return {
            image: utils.get('feat_' + name + '_image'),
            index: utils.get('feat_' + name + '_index'),
            enabled: utils.get('feat_' + name + '_enabled'),
            name: name,
            readOnly: utils.get('feat_' + name + '_readonly'),
            shortcut: utils.get('feat_' + name + '_shortcut'),
            template: utils.get('feat_' + name + '_template'),
            title: utils.get('feat_' + name + '_title')
        };
    },

    /**
     * <p>Loads the values of each stored feature from their respective
     * locations.</p>
     * <p>The array returned is sorted based on the index of each feature.</p>
     * @returns {Array} The array of the features loaded.
     * @since 0.1.0.0
     */
    loadFeatures: function () {
        var features = [],
            names = utils.get('features');
        for (var i = 0; i < names.length; i++) {
            features.push(urlcopy.loadFeature(names[i]));
        }
        features.sort(function (a, b) {
            return a.index - b.index;
        });
        return features;
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
        if (!urlcopy.isBlacklisted(sender)) {
            urlcopy.onRequest(request, sender, sendResponse);
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
     * @param {MessageSender} [sender] An object containing information about
     * the script context that sent a message or request.
     * @param {function} [sendResponse] Function to call when you have a
     * response. The argument should be any JSON-ifiable object, or undefined
     * if there is no response.
     * @private
     */
    onRequest: function (request, sender, sendResponse) {
        if (request.type !== 'shortcut' || utils.get('shortcuts')) {
            urlcopy.onRequestHelper(request, sender, sendResponse);
        }
    },

    /**
     * <p>Helper function for the internal/external request listeners.</p>
     * <p>This function will handle the request based on its type and the data
     * provided.</p>
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
     * @requires jQuery
     * @requires Mustache
     * @private
     */
    onRequestHelper: function (request, sender, sendResponse) {
        chrome.tabs.getSelected(null, function (tab) {
            var feature,
                popup = chrome.extension.getViews({type: 'popup'})[0],
                shortCalled = false,
                shortPlaceholder = 'short' +
                    (Math.floor(Math.random() * 99999 + 1000));
            switch (request.type) {
            case 'popup':
                // Should be cheaper than searching urlcopy.features...
                feature = urlcopy.loadFeature(request.data.name);
                break;
            case 'shortcut':
                feature = urlcopy.getFeatureWithShortcut(request.data.key);
                break;
            }
            if (feature) {
                if (popup) {
                    $('#loadDiv', popup.document).show();
                    $('#item', popup.document).hide();
                }
                var data = urlcopy.buildTemplateData(tab, function () {
                        shortCalled = true;
                        return '{' + shortPlaceholder + '}';
                    }),
                    output = Mustache.to_html(feature.template, data);
                if (shortCalled) {
                    urlcopy.callUrlShortener(data.source, function (shortUrl) {
                        if (shortUrl) {
                            var newData = {};
                            newData[shortPlaceholder] = shortUrl;
                            urlcopy.copy(Mustache.to_html(output, newData));
                        }
                    });
                } else {
                    urlcopy.copy(output);
                }
            }
        });
    },

    /**
     * <p>Removes the specified feature name from those stored in
     * localStorage.</p>
     * @param {String} name The feature name to be removed.
     * @since 0.1.0.0
     * @private
     */
    removeFeatureName: function (name) {
        var features = utils.get('features'),
            idx = features.indexOf(name);
        if (idx !== -1) {
            features.splice(idx, 1);
            utils.set('features', features);
        }
    },

    /**
     * <p>Resets the message and status associated with the current copy
     * request.</p>
     * <p>This function should be called on the completion of a copy request
     * regardless of its outcome.</p>
     */
    reset: function () {
        urlcopy.message = '';
        urlcopy.status = false;
    },

    /**
     * <p>Stores the values of the specified feature in to their respective
     * locations.</p>
     * @param {Object} feature The feature whose values are to be saved.
     * @param {String} feature.image The file name of the feature's image.
     * @param {Integer} feature.index The index representing the feature's
     * display order.
     * @param {Boolean} feature.enabled <code>true</code> if the feature is
     * enabled; otherwise <code>false</code>.
     * @param {String} feature.name The unique name of the feature.
     * @param {Boolean} feature.readOnly <code>true</code> if the feature is
     * read-only and certain values cannot be editted by the user; otherwise
     * <code>false</code>.
     * @param {String} feature.shortcut The keyboard shortcut assigned to the
     * feature.
     * @param {String} feature.template The mustache template for the feature.
     * @param {String} feature.title The title of the feature.
     * @returns {Object} The feature provided.
     * @since 0.1.0.0
     * @private
     */
    saveFeature: function (feature) {
        var name = feature.name;
        utils.set('feat_' + name + '_image', feature.image);
        utils.set('feat_' + name + '_index', feature.index);
        utils.set('feat_' + name + '_enabled', feature.enabled);
        utils.set('feat_' + name + '_readonly', feature.readOnly);
        utils.set('feat_' + name + '_shortcut', feature.shortcut);
        utils.set('feat_' + name + '_template', feature.template);
        utils.set('feat_' + name + '_title', feature.title);
        return feature;
    },

    /**
     * <p>Stores the values of each of the speciifed features in to their
     * respective locations.</p>
     * @param {Array} features The features whose values are to be saved.
     * @returns {Array} The array of features provided.
     * @since 0.1.0.0
     */
    saveFeatures: function (features) {
        var names = [];
        for (var i = 0; i < features.length; i++) {
            names.push(features[i].name);
            urlcopy.saveFeature(features[i]);
        }
        utils.set('features', names);
        return features;
    },

    /**
     * <p>Displays a Chrome notification to inform the user on whether or not
     * the copy request was successful.</p>
     * <p>This function ensures that urlcopy is reset and that
     * notifications are only displayed if specified by the user (or by
     * default).</p>
     * @see urlcopy.reset
     */
    showNotification: function () {
        if (utils.get('notifications')) {
            webkitNotifications.createHTMLNotification(
                chrome.extension.getURL('pages/notification.html')
            ).show();
        } else {
            urlcopy.reset();
        }
    },

    /**
     * <p>Updates the list of features stored locally to reflect that stored
     * in localStorage.</p>
     * <p>It is important that this function is called whenever features might
     * of changed as this also updates the prepared popup HTML.</p>
     */
    updateFeatures: function () {
        urlcopy.features = urlcopy.loadFeatures();
        urlcopy.buildPopup();
    }

};

/**
 * <p>Provides an interface to by used by {@link urlcopy} for copy requests on
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
     * <p>Attempts to extract the title embedded within that used by the IE Tab
     * extension.</p>
     * <p>If no title prefix was detected the string provided is returned.</p>
     * @param {String} str The string from which to extract the embedded title.
     * @returns {String} The title extracted from the string or the string if no
     * prefix was detected.
     */
    extractTitle: function (str) {
        if (str) {
            var idx = str.indexOf(ietab.titlePrefix);
            if (idx !== -1) {
                return str.substring(idx + ietab.titlePrefix.length);
            }
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
     */
    extractUrl: function (str) {
        if (str) {
            var idx = str.indexOf(ietab.containerSegment);
            if (idx !== -1) {
                return str.substring(idx + ietab.containerSegment.length);
            }
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
        return (urlcopy.isSpecialPage(tab) &&
                tab.url.indexOf(ietab.extensionId) !== -1);
    }

};