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
     * @type String[]
     */
    blacklistedExtensions: [],

    /**
     * <p>The details of the user's current browser.</p>
     * @since 0.1.0.3
     * @private
     * @type Object
     */
    browser: {
        title: 'Chrome',
        version: ''
    },

    /**
     * <p>The default features to be used by this extension.</p>
     * @since 0.1.0.0
     * @private
     * @type Object[]
     */
    defaultFeatures: [{
        enabled: true,
        image: 4,
        index: 2,
        name: '_anchor',
        readOnly: true,
        shortcut: 'A',
        template: '<a href="{{url}}"{#doAnchorTarget} target="_blank"{/doAnchorTarget}{#doAnchorTitle} title="{{title}}"{/doAnchorTitle}>{{title}}</a>',
        title: chrome.i18n.getMessage('copy_anchor')
    }, {
        enabled: false,
        image: 2,
        index: 4,
        name: '_bbcode',
        readOnly: true,
        shortcut: 'B',
        template: '[url={url}]{title}[/url]',
        title: chrome.i18n.getMessage('copy_bbcode')
    }, {
        enabled: true,
        image: 1,
        index: 3,
        name: '_encoded',
        readOnly: true,
        shortcut: 'E',
        template: '{#encode}{url}{/encode}',
        title: chrome.i18n.getMessage('copy_encoded')
    }, {
        enabled: true,
        image: 5,
        index: 1,
        name: '_short',
        readOnly: true,
        shortcut: 'S',
        template: '{short}',
        title: chrome.i18n.getMessage('copy_short')
    }, {
        enabled: true,
        image: 3,
        index: 0,
        name: '_url',
        readOnly: true,
        shortcut: 'U',
        template: '{url}',
        title: chrome.i18n.getMessage('copy_url')
    }],

    /**
     * <p>The list of copy request features supported by the extension.</p>
     * <p>This list ordered to match that specified by the user.</p>
     * @see urlcopy.updateFeatures
     * @type Object[]
     */
    features: [],

    /**
     * <p>The details of the images available as feature icons.</p>
     * @since 0.2.0.0
     * @private
     * @type Object[]
     */
    images: [{
        file: 'spacer.gif',
        id: 0,
        name: chrome.i18n.getMessage('feat_none'),
        separate: true
    }, {
        file: 'feat_component.png',
        id: 1,
        name: chrome.i18n.getMessage('feat_component')
    }, {
        file: 'feat_discussion.png',
        id: 2,
        name: chrome.i18n.getMessage('feat_discussion')
    }, {
        file: 'feat_globe.png',
        id: 3,
        name: chrome.i18n.getMessage('feat_globe')
    }, {
        file: 'feat_html.png',
        id: 4,
        name: chrome.i18n.getMessage('feat_html')
    }, {
        file: 'feat_link.png',
        id: 5,
        name: chrome.i18n.getMessage('feat_link')
    }],

    /**
     * <p>Provides potential of displaying a message to the user other than the
     * defaults that depend on the value of {@link urlcopy.status}.</p>
     * <p>This value is reset to an empty String after every copy request.</p>
     * @since 0.1.0.0
     * @type String
     */
    message: '',

    /**
     * <p>The name of the user's operating system.</p>
     * @since 0.1.0.3
     * @private
     * @type String
     */
    operatingSystem: '',

    /**
     * <p>The details used to determine the operating system being used by the
     * user.</p>
     * @since 0.1.0.3
     * @private
     * @type Object[]
     */
    operatingSystems: [{
        substring: 'Win',
        title: 'Windows'
    }, {
        substring: 'Mac',
        title: 'Mac'
    }, {
        substring: 'Linux',
        title: 'Linux'
    }],

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
    shortcutMacModifiers: 'Shift-&#8997;-',

    /**
     * <p>The URL shortener services supported by this extension.</p>
     * @since 0.1.0.0
     * @private
     * @type Object[]
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
            if (utils.get('bitlyApiKey') && utils.get('bitlyUsername')) {
                params.x_apiKey = utils.get('bitlyApiKey');
                params.x_login = utils.get('bitlyUsername');
            }
            return params;
        },
        input: function (url) {
            return null;
        },
        isEnabled: function () {
            return utils.get('bitly');
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
            return utils.get('googl');
        },
        isOAuthEnabled: function () {
            return utils.get('googlOAuth');
        },
        method: 'POST',
        name: 'goo.gl',
        oauth: ChromeExOAuth.initBackgroundPage({
            access_url: 'https://www.google.com/accounts/OAuthGetAccessToken',
            app_name: 'URL-Copy', // TODO: chrome.i18n.getMessage('name')
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
            if (utils.get('yourlsPassword') && utils.get('yourlsUsername')) {
                params.password = utils.get('yourlsPassword');
                params.username = utils.get('yourlsUsername');
            } else if (utils.get('yourlsSignature')) {
                params.signature = utils.get('yourlsSignature');
            }
            return params;
        },
        input: function (url) {
            return null;
        },
        isEnabled: function () {
            return utils.get('yourls');
        },
        method: 'POST',
        name: 'YOURLS',
        output: function (resp) {
            return JSON.parse(resp).shorturl;
        },
        url: function () {
            return utils.get('yourlsUrl');
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
     * <p>Contains the extensions supported by this extension for compatibility
     * purposes.</p>
     * @since 0.1.0.0
     * @type Object[]
     */
    support: [{
        // IE Tab
        extensionId: 'hehijbfgiekmjfkfjpbkbammjbdenadd',
        title: function (title) {
            var str = 'IE: ';
            if (title) {
                var idx = title.indexOf(str);
                if (idx !== -1) {
                    return title.substring(idx + str.length);
                }
            }
            return title;
        },
        url: function (url) {
            var str = 'iecontainer.html#url=';
            if (url) {
                var idx = url.indexOf(str);
                if (idx !== -1) {
                    return decodeURIComponent(url.substring(idx + str.length));
                }
            }
            return url;
        }
    }, {
        // IE Tab Classic
        extensionId: 'miedgcmlgpmdagojnnbemlkgidepfjfi',
        title: function (title) {
            return title;
        },
        url: function (url) {
            var str = 'ie.html#';
            if (url) {
                var idx = url.indexOf(str);
                if (idx !== -1) {
                    return url.substring(idx + str.length);
                }
            }
            return url;
        }
    }, {
        // IE Tab Multi (Enhance)
        extensionId: 'fnfnbeppfinmnjnjhedifcfllpcfgeea',
        title: function (title) {
            return title;
        },
        url: function (url) {
            var str = 'navigate.html?chromeurl=',
                str2 = '[escape]';
            if (url) {
                var idx = url.indexOf(str);
                if (idx !== -1) {
                    url = url.substring(idx + str.length);
                    if (url && url.indexOf(str2) === 0) {
                        url = decodeURIComponent(url.substring(str2.length));
                    }
                    return url;
                }
            }
            return url;
        }
    }, {
        // Mozilla Gecko Tab
        extensionId: 'icoloanbecehinobmflpeglknkplbfbm',
        title: function (title) {
            return title;
        },
        url: function (url) {
            var str = 'navigate.html?chromeurl=',
                str2 = '[escape]';
            if (url) {
                var idx = url.indexOf(str);
                if (idx !== -1) {
                    url = url.substring(idx + str.length);
                    if (url && url.indexOf(str2) === 0) {
                        url = decodeURIComponent(url.substring(str2.length));
                    }
                    return url;
                }
            }
            return url;
        }
    }],

    /**
     * <p>The current version of this extension.</p>
     * @since 0.1.0.3
     * @private
     * @type String
     */
    version: '',

    /**
     * <p>Adds extra data to the specified object.</p>
     * @param {Object} data The data to receive the additional data.
     * @param {Object} extraData The object containing the additional data.
     * @param {Object[]} extraData.cookies The array of cookies to be
     * extracted.
     * @returns {Object} The updated data object.
     * @since 0.1.1.0
     * @private
     */
    addAdditionalData: function (data, extraData) {
        // Extracts the names of every cookie
        var cookies = [];
        for (var i = 0; i < extraData.cookies.length; i++) {
            cookies.push(extraData.cookies[i].name);
        }
        $.extend(data, {
            cookie: function () {
                return function (text, render) {
                    var name = render(text),
                        value = '';
                    // Attempts to find the value for the cookie name
                    for (var j = 0; j < extraData.cookies.length; j++) {
                        if (extraData.cookies[j].name === name) {
                            value = extraData.cookies[j].value;
                            break;
                        }
                    }
                    return value;
                };
            },
            cookies: cookies
        });
        return data;
    },

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
     * <p>Creates an Object containing data based on information derived from
     * the specified tab and menu item data.</p>
     * @param {Tab} tab The tab whose information is to be extracted.
     * @param {OnClickData} onClickData The details about the menu item clicked
     * and the context where the click happened.
     * @param {function} shortCallback The function to be called if/when a
     * shortened URL is requested when parsing the template.
     * @returns {Object} The data based on information extracted from the tab
     * provided and its URL. This can contain Strings, Arrays, Objects, and
     * functions.
     * @see urlcopy.buildStandardData
     * @since 0.1.0.0
     * @requires jQuery
     * @requires jQuery URL Parser Plugin
     * @private
     */
    buildDerivedData: function (tab, onClickData, shortCallback) {
        var data = {
            selectionText: onClickData.selectionText,
            title: tab.title,
            url: ''
        };
        if (onClickData.frameUrl) {
            data.url = onClickData.frameUrl;
        } else if (onClickData.linkUrl) {
            data.url = onClickData.linkUrl;
        } else if (onClickData.srcUrl) {
            data.url = onClickData.srcUrl;
        } else {
            data.url = onClickData.pageUrl;
        }
        return urlcopy.buildStandardData(data, shortCallback);
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
        var image = '';
        for (var j = 0; j < urlcopy.images.length; j++) {
            if (urlcopy.images[j].id === feature.image) {
                image = '../images/' + urlcopy.images[j].file;
                break;
            }
        }
        image = image || '../images/spacer.png';
        var item = $('<li/>', {
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
                html: (feature.shortcut) ? modifiers + feature.shortcut : ''
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
     * <p>This function merges this data with additional information relating
     * to the URL of the tab.</p>
     * <p>If a shortened URL is requested when parsing the template later the
     * callback function specified is called to handle this scenario as we
     * don't want to call a URL shortener service unless it is required.</p>
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
    buildStandardData: function (tab, shortCallback) {
        var compatibility = false,
            data = {},
            title = '',
            url = {};
        for (var i = 0; i < urlcopy.support.length; i++) {
            if (urlcopy.isExtensionActive(tab,
                urlcopy.support[i].extensionId)) {
                title = urlcopy.support[i].title(tab.title);
                url = $.url(urlcopy.support[i].url(tab.url));
                compatibility = true;
                break;
            }
        }
        if (!compatibility) {
            title = tab.title;
            url = $.url(tab.url);
        }
        $.extend(data, url.attr(), {
            bitly: utils.get('bitly'),
            bitlyApiKey: utils.get('bitlyApiKey'),
            bitlyUsername: utils.get('bitlyUsername'),
            browser: urlcopy.browser.title,
            browserVersion: urlcopy.browser.version,
            contextMenu: utils.get('contextMenu'),
            cookiesEnabled: window.navigator.cookieEnabled,
            doAnchorTarget: utils.get('doAnchorTarget'),
            doAnchorTitle: utils.get('doAnchorTitle'),
            encode: function () {
                return function (text, render) {
                    return encodeURIComponent(render(text));
                };
            },
            // Deprecated since 0.1.0.2, use encode instead
            encoded: encodeURIComponent(url.attr('source')),
            favicon: tab.favIconUrl,
            fparam: function () {
                return function (text, render) {
                    return url.fparam(render(text));
                };
            },
            fparams: url.fparam(),
            fsegment: function () {
                return function (text, render) {
                    return url.fsegment(parseInt(render(text), 10));
                };
            },
            fsegments: url.fsegment(),
            googl: utils.get('googl'),
            googlOAuth: utils.get('googlOAuth'),
            java: window.navigator.javaEnabled(),
            notificationDuration: utils.get('notificationDuration') / 1000,
            notifications: utils.get('notifications'),
            offline: !window.navigator.onLine,
            // Deprecated since 0.1.0.2, use originalUrl instead
            originalSource: tab.url,
            originalTitle: tab.title || url.attr('source'),
            originalUrl: tab.url,
            os: urlcopy.operatingSystem,
            param: function () {
                return function (text, render) {
                    return url.param(render(text));
                };
            },
            params: url.param(),
            segment: function () {
                return function (text, render) {
                    return url.segment(parseInt(render(text), 10));
                };
            },
            segments: url.segment(),
            'short': function () {
                return shortCallback();
            },
            selection: tab.selectionText || '',
            shortcuts: utils.get('shortcuts'),
            title: title || url.attr('source'),
            url: url.attr('source'),
            version: urlcopy.version,
            yourls: utils.get('yourls'),
            yourlsPassword: utils.get('yourlsPassword'),
            yourlsSignature: utils.get('yourlsSignature'),
            yourlsUrl: utils.get('yourlsUrl'),
            yourlsUsername: utils.get('yourlsUsername')
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
            var name = service.name;
            if (!service.url()) {
                callback({
                    message: chrome.i18n.getMessage('shortener_config_error',
                            name),
                    shortener: name,
                    success: false
                });
                return;
            }
            try {
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
                        callback({
                            shortUrl: service.output(req.responseText),
                            shortener: name,
                            success: true
                        });
                    }
                };
                req.send(service.input(url));
            } catch (e) {
                console.log(e.message || e);
                callback({
                    message: chrome.i18n.getMessage('shortener_error', name),
                    shortener: name,
                    success: false
                });
            }
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
     * @param {Boolean} [hidden] <code>true</code> to avoid updating
     * {@link urlcopy.status} and showing a notification; otherwise
     * <code>false</code>.
     * @requires document.execCommand
     * @requires jQuery
     */
    copy: function (str, hidden) {
        var result = false,
            sandbox = $('#sandbox').val(str).select();
        result = document.execCommand('copy', false, null);
        sandbox.val('');
        if (!hidden) {
            urlcopy.status = result;
            urlcopy.showNotification();
        }
    },

    /**
     * <p>Deletes the values of the feature with the specified name from
     * their respective locations.</p>
     * @param {String} name The name of the feature whose values are to be
     * deleted.
     * @since 0.1.0.0
     * @private
     */
    deleteFeature: function (name) {
        utils.remove('feat_' + name + '_enabled');
        utils.remove('feat_' + name + '_image');
        utils.remove('feat_' + name + '_index');
        utils.remove('feat_' + name + '_readonly');
        utils.remove('feat_' + name + '_shortcut');
        utils.remove('feat_' + name + '_template');
        utils.remove('feat_' + name + '_title');
    },

    /**
     * <p>Injects and executes the <code>shortcuts.js</code> script within each
     * of the tabs provided (where valid).</p>
     * @param {Object[]} tabs The tabs to execute the script in.
     * @private
     */
    executeScriptsInExistingTabs: function (tabs) {
        for (var i = 0; i < tabs.length; i++) {
            try {
                chrome.tabs.executeScript(tabs[i].id, {
                    file: 'js/shortcuts.js'
                });
            } catch (e) {
                console.log(e.message || e);
            }
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
     * <p>Attempts to return the current version of the user's browser.</p>
     * @returns {String} The browser's version.
     * @since 0.1.0.3
     * @private
     */
    getBrowserVersion: function () {
        var str = navigator.userAgent,
            idx = str.indexOf(urlcopy.browser.title);
        if (idx !== -1) {
            str = str.substring(idx + urlcopy.browser.title.length + 1);
            idx = str.indexOf(' ');
            return (idx === -1) ? str : str.substring(0, idx);
        }
    },

    /**
     * <p>Attempts to return the information for the any feature with the
     * specified menu identifier assigned to it.</p>
     * @param {Integer} menuId The menu identifier to be queried.
     * @returns {Object} The feature using the menu identifier provided, if
     * possible.
     * @since 0.1.0.0
     * @private
     */
    getFeatureWithMenuId: function (menuId) {
        var feature;
        for (var i = 0; i < urlcopy.features.length; i++) {
            if (urlcopy.features[i].menuId === menuId) {
                feature = urlcopy.features[i];
                break;
            }
        }
        return feature;
    },

    /**
     * <p>Attempts to return the information for the any feature with the
     * specified shortcut assigned to it.</p>
     * @param {String} shortcut The shortcut to be queried.
     * @returns {Object} The feature using the shortcut provided, if possible.
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
     * <p>Attempts to return the operating system being used by the user.</p>
     * @returns {String} The user's operating system.
     * @since 0.1.0.3
     * @private
     */
    getOperatingSystem: function () {
        var os = {},
            str = navigator.platform;
        for (var i = 0; i < urlcopy.operatingSystems.length; i++) {
            os = urlcopy.operatingSystems[i];
            if (str.indexOf(os.substring) !== -1) {
                str = os.title;
                break;
            }
        }
        return str;
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
        /*
         * Should never reach here but we'll return goo.gl service by default
         * after ensuring it's enabled from now on to save some time next
         * lookup.
         */
        utils.set('googl', true);
        return urlcopy.shorteners[1];
    },

    /**
     * <p>Initializes the background page.</p>
     * <p>This involves initializing the settings, injecting keyboard shortcut
     * listeners and adding the request listeners.</p>
     */
    init: function () {
        utils.init('update_progress', {
            features: false,
            settings: false,
            shorteners: false
        });
        urlcopy.init_update();
        utils.init('contextMenu', true);
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
        // Derives static browser and OS information
        urlcopy.browser.version = urlcopy.getBrowserVersion();
        urlcopy.operatingSystem = urlcopy.getOperatingSystem();
        // Derives extension's version
        $.getJSON(chrome.extension.getURL('manifest.json'), function (data) {
            urlcopy.version = data.version;
        });
    },

    /**
     * <p>Handles the conversion/removal of older version of settings that may
     * have been stored previously by {@link urlcopy.init}.</p>
     * @since 0.1.0.0
     * @private
     */
    init_update: function () {
        // Checks if settings need updated
        var progress = utils.get('update_progress');
        if (progress.settings) {
            return;
        }
        // Updates settings accordingly
        utils.rename('settingNotification', 'notifications', true);
        utils.rename('settingNotificationTimer', 'notificationDuration', 3000);
        utils.rename('settingShortcut', 'shortcuts', true);
        utils.rename('settingTargetAttr', 'doAnchorTarget', false);
        utils.rename('settingTitleAttr', 'doAnchorTitle', false);
        utils.remove('settingIeTabExtract');
        utils.remove('settingIeTabTitle');
        // Ensures settings are not updated again
        progress.settings = true;
        utils.set('update_progress', progress);
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
     * @param {Integer} feature.image The identifier of the feature's image.
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
        utils.init('feat_' + name + '_image', feature.image);
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
        utils.init('features', []);
        urlcopy.initFeatures_update();
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
        // Checks if features need updated
        var progress = utils.get('update_progress');
        if (progress.features) {
            return;
        }
        // Updates features accordingly
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
        // Updates images accordingly (0.2.0.0 update)
        var image,
            names = utils.get('features');
        for (var i = 0; i < names.length; i++) {
            image = utils.get('feat_' + names[i] + '_image');
            if (typeof image === 'string') {
                for (var j = 0; j < urlcopy.images.length; j++) {
                    if (urlcopy.images[j].file === image) {
                        utils.set('feat_' + names[i] + '_image',
                                urlcopy.images[j].id);
                        break;
                    }
                }
            } else if (typeof image === 'undefined') {
                utils.set('feat_' + names[i] + '_image', 0);
            }
        }
        // Ensures features are not updated again
        progress.features = true;
        utils.set('update_progress', progress);
    },

    /**
     * <p>Initializes the settings related to the supported URL Shortener
     * services.</p>
     * @private
     */
    initUrlShorteners: function () {
        urlcopy.initUrlShorteners_update();
        utils.init('bitly', false);
        utils.init('bitlyApiKey', '');
        utils.init('bitlyUsername', '');
        utils.init('googl', true);
        utils.init('googlOAuth', true);
        utils.init('yourls', false);
        utils.init('yourlsPassword', '');
        utils.init('yourlsSignature', '');
        utils.init('yourlsUrl', '');
        utils.init('yourlsUsername', '');
    },

    /**
     * <p>Handles the conversion/removal of older version of settings that may
     * have been stored previously by {@link urlcopy.initUrlShorteners}.</p>
     * @since 0.1.0.0
     * @private
     */
    initUrlShorteners_update: function () {
        // Checks if URL shorteners need updated
        var progress = utils.get('update_progress');
        if (progress.shorteners) {
            return;
        }
        // Updates URL shorteners accordingly
        utils.rename('bitlyEnabled', 'bitly', false);
        utils.rename('bitlyXApiKey', 'bitlyApiKey', '');
        utils.rename('bitlyXLogin', 'bitlyUsername', '');
        utils.rename('googleEnabled', 'googl', true);
        utils.rename('googleOAuthEnabled', 'googlOAuth', true);
        // Ensures URL shorteners are not updated again
        progress.shorteners = true;
        utils.set('update_progress', progress);
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
     * <p>Returns whether or not the extension with the specified identifier is
     * active on the tab provided.</p>
     * @param {Tab} tab The tab to be tested.
     * @param {String} extensionId The identifier of the extension to be
     * tested.
     * @returns {Boolean} <code>true</code> if the extension is active on the
     * tab provided; otherwise <code>false</code>.
     * @since 0.1.1.1
     * @private
     */
    isExtensionActive: function (tab, extensionId) {
        return (urlcopy.isSpecialPage(tab) &&
                tab.url.indexOf(extensionId) !== -1);
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
            enabled: utils.get('feat_' + name + '_enabled'),
            image: utils.get('feat_' + name + '_image'),
            index: utils.get('feat_' + name + '_index'),
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
     * @returns {Object[]} The array of the features loaded.
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
            var data = {},
                feature,
                popup = chrome.extension.getViews({type: 'popup'})[0],
                shortCalled = false,
                shortPlaceholder = 'short' +
                        (Math.floor(Math.random() * 99999 + 1000));
            function shortCallback() {
                shortCalled = true;
                return '{' + shortPlaceholder + '}';
            }
            if (popup) {
                $('#item', popup.document).hide();
                $('#loadDiv', popup.document).show();
            }
            switch (request.type) {
            case 'menu':
                data = urlcopy.buildDerivedData(tab, request.data,
                        shortCallback);
                feature = urlcopy.getFeatureWithMenuId(
                        request.data.menuItemId);
                break;
            case 'popup':
                // Should be cheaper than searching urlcopy.features...
                data = urlcopy.buildStandardData(tab, shortCallback);
                feature = urlcopy.loadFeature(request.data.name);
                break;
            case 'shortcut':
                data = urlcopy.buildStandardData(tab, shortCallback);
                feature = urlcopy.getFeatureWithShortcut(request.data.key);
                break;
            }
            if (feature) {
                chrome.cookies.getAll({url: data.url}, function (cookies) {
                    urlcopy.addAdditionalData(data, {
                        cookies: cookies || []
                    });
                    if (!feature.template) {
                        urlcopy.message = chrome.i18n.getMessage(
                                'copy_template_fail', feature.title);
                        urlcopy.status = false;
                        urlcopy.showNotification();
                        return;
                    }
                    var output = Mustache.to_html(feature.template, data);
                    if (shortCalled) {
                        urlcopy.callUrlShortener(data.source,
                                function (response) {
                            if (response.success && response.shortUrl) {
                                var newData = {};
                                newData[shortPlaceholder] = response.shortUrl;
                                urlcopy.copy(Mustache.to_html(output,
                                        newData));
                            } else {
                                if (!response.message) {
                                    response.message = chrome.i18n.getMessage(
                                            'shortener_error',
                                            response.shortener);
                                }
                                urlcopy.message = response.message;
                                urlcopy.status = false;
                                urlcopy.showNotification();
                            }
                        });
                    } else {
                        urlcopy.copy(output);
                    }
                });
            } else {
                if (popup) {
                    popup.close();
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
     * @param {Integer} feature.image The identifier of the feature's image.
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
        utils.set('feat_' + name + '_enabled', feature.enabled);
        utils.set('feat_' + name + '_image', feature.image);
        utils.set('feat_' + name + '_index', feature.index);
        utils.set('feat_' + name + '_readonly', feature.readOnly);
        utils.set('feat_' + name + '_shortcut', feature.shortcut);
        utils.set('feat_' + name + '_template', feature.template);
        utils.set('feat_' + name + '_title', feature.title);
        return feature;
    },

    /**
     * <p>Stores the values of each of the speciifed features in to their
     * respective locations.</p>
     * <p>Any features no longer in use are removed from localStorage in an
     * attempt to keep capacity under control.</p>
     * @param {Object[]} features The features whose values are to be saved.
     * @returns {Object[]} The array of features provided.
     * @since 0.1.0.0
     */
    saveFeatures: function (features) {
        var names = [],
            oldNames = utils.get('features');
        for (var i = 0; i < features.length; i++) {
            names.push(features[i].name);
            urlcopy.saveFeature(features[i]);
        }
        // Ensures any features no longer used are removed from localStorage
        for (var j = 0; j < oldNames.length; j++) {
            if (names.indexOf(oldNames[j]) === -1) {
                urlcopy.deleteFeature(oldNames[j]);
            }
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
        var popup = chrome.extension.getViews({type: 'popup'})[0];
        if (utils.get('notifications')) {
            webkitNotifications.createHTMLNotification(
                chrome.extension.getURL('pages/notification.html')
            ).show();
        } else {
            urlcopy.reset();
        }
        if (popup) {
            popup.close();
        }
    },

    /**
     * <p>Updates the context menu items to reflect respective features.</p>
     * @since 0.1.0.0
     * @private
     */
    updateContextMenu: function () {
        // Ensures any previously added context menu items are removed
        chrome.contextMenus.removeAll(function () {
            function onMenuClick(info, tab) {
                urlcopy.onRequestHelper({
                    data: info,
                    type: 'menu'
                });
            }
            if (utils.get('contextMenu')) {
                var menuId,
                    parentId = chrome.contextMenus.create({
                        contexts: ['all'],
                        title: chrome.i18n.getMessage('name')
                    });
                for (var i = 0; i < urlcopy.features.length; i++) {
                    if (urlcopy.features[i].enabled) {
                        menuId = chrome.contextMenus.create({
                            contexts: ['all'],
                            onclick: onMenuClick,
                            parentId: parentId,
                            title: urlcopy.features[i].title
                        });
                        urlcopy.features[i].menuId = menuId;
                    }
                }
            }
        });
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
        urlcopy.updateContextMenu();
    }

};