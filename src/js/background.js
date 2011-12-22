/* Copyright (C) 2011 Alasdair Mercer, http://neocotic.com/
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy  
 * of this software and associated documentation files (the "Software"), to deal  
 * in the Software without restriction, including without limitation the rights  
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell  
 * copies of the Software, and to permit persons to whom the Software is  
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all  
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR  
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE  
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER  
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,  
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE  
 * SOFTWARE.
 */

/**
 * <p>Main controller for the extension and manages all copy requests.</p>
 * @author <a href="http://neocotic.com">Alasdair Mercer</a>
 * @since 0.2.0.0 - Previously named <code>urlcopy</code>.
 * @requires jQuery
 * @requires jQuery URL Parser Plugin
 * @requires mustache.js
 * @namespace
 */
var ext = {

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

        /**
         * <p>The name of the browser (i.e. <code>Chrome</code>).</p>
         * @since 0.1.0.3
         * @private
         * @type String
         */
        title: 'Chrome',

        /**
         * <p>The version of the browser (e.g. <code>12.0.742.122</code>).</p>
         * @since 0.1.0.3
         * @private
         * @type String
         */
        version: ''

    },

    /**
     * <p>The default features to be used by this extension.</p>
     * @since 0.1.0.0
     * @private
     * @type Object[]
     */
    defaultFeatures: [{
        content: '<a href="{{url}}"' +
                '{#doAnchorTarget} target="_blank"{/doAnchorTarget}' +
                '{#doAnchorTitle} title="{{title}}"{/doAnchorTitle}' +
                '>{{title}}</a>',
        enabled: true,
        image: 11,
        index: 2,
        name: '_anchor',
        readOnly: true,
        shortcut: 'A',
        title: chrome.i18n.getMessage('copy_anchor')
    }, {
        content: '[url={url}]{title}[/url]',
        enabled: false,
        image: 7,
        index: 5,
        name: '_bbcode',
        readOnly: true,
        shortcut: 'B',
        title: chrome.i18n.getMessage('copy_bbcode')
    }, {
        content: '{#encode}{url}{/encode}',
        enabled: true,
        image: 5,
        index: 3,
        name: '_encoded',
        readOnly: true,
        shortcut: 'E',
        title: chrome.i18n.getMessage('copy_encoded')
    }, {
        content: '[{title}]({url})',
        enabled: false,
        image: 7,
        index: 4,
        name: '_markdown',
        readOnly: true,
        shortcut: 'M',
        title: chrome.i18n.getMessage('copy_markdown')
    }, {
        content: '{short}',
        enabled: true,
        image: 16,
        index: 1,
        name: '_short',
        readOnly: true,
        shortcut: 'S',
        title: chrome.i18n.getMessage('copy_short')
    }, {
        content: '{url}',
        enabled: true,
        image: 8,
        index: 0,
        name: '_url',
        readOnly: true,
        shortcut: 'U',
        title: chrome.i18n.getMessage('copy_url')
    }],

    /**
     * <p>The list of copy request features supported by the extension.</p>
     * <p>This list ordered to match that specified by the user.</p>
     * @see ext.updateFeatures
     * @type Object[]
     */
    features: [],

    /**
     * <p>The domain of this extension's homepage.</p>
     * @since 0.3.0.0
     * @private
     * @type String
     */
    homepage: 'neocotic.com',

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
        file: 'feat_auction.png',
        id: 1,
        name: chrome.i18n.getMessage('feat_auction')
    }, {
        file: 'feat_bug.png',
        id: 2,
        name: chrome.i18n.getMessage('feat_bug')
    }, {
        file: 'feat_clipboard.png',
        id: 3,
        name: chrome.i18n.getMessage('feat_clipboard')
    }, {
        file: 'feat_clipboard_empty.png',
        id: 4,
        name: chrome.i18n.getMessage('feat_clipboard_empty')
    }, {
        file: 'feat_component.png',
        id: 5,
        name: chrome.i18n.getMessage('feat_component')
    }, {
        file: 'feat_cookies.png',
        id: 6,
        name: chrome.i18n.getMessage('feat_cookies')
    }, {
        file: 'feat_discussion.png',
        id: 7,
        name: chrome.i18n.getMessage('feat_discussion')
    }, {
        file: 'feat_globe.png',
        id: 8,
        name: chrome.i18n.getMessage('feat_globe')
    }, {
        file: 'feat_google.png',
        id: 9,
        name: chrome.i18n.getMessage('feat_google')
    }, {
        file: 'feat_heart.png',
        id: 10,
        name: chrome.i18n.getMessage('feat_heart')
    }, {
        file: 'feat_html.png',
        id: 11,
        name: chrome.i18n.getMessage('feat_html')
    }, {
        file: 'feat_key.png',
        id: 12,
        name: chrome.i18n.getMessage('feat_key')
    }, {
        file: 'feat_lightbulb.png',
        id: 13,
        name: chrome.i18n.getMessage('feat_lightbulb')
    }, {
        file: 'feat_lighthouse.png',
        id: 14,
        name: chrome.i18n.getMessage('feat_lighthouse')
    }, {
        file: 'feat_lightning.png',
        id: 15,
        name: chrome.i18n.getMessage('feat_lightning')
    }, {
        file: 'feat_link.png',
        id: 16,
        name: chrome.i18n.getMessage('feat_link')
    }, {
        file: 'feat_linux.png',
        id: 17,
        name: chrome.i18n.getMessage('feat_linux')
    }, {
        file: 'feat_mail.png',
        id: 18,
        name: chrome.i18n.getMessage('feat_mail')
    }, {
        file: 'feat_newspaper.png',
        id: 19,
        name: chrome.i18n.getMessage('feat_newspaper')
    }, {
        file: 'feat_note.png',
        id: 20,
        name: chrome.i18n.getMessage('feat_note')
    }, {
        file: 'feat_page.png',
        id: 21,
        name: chrome.i18n.getMessage('feat_page')
    }, {
        file: 'feat_plugin.png',
        id: 22,
        name: chrome.i18n.getMessage('feat_plugin')
    }, {
        file: 'feat_rss.png',
        id: 23,
        name: chrome.i18n.getMessage('feat_rss')
    }, {
        file: 'feat_script.png',
        id: 24,
        name: chrome.i18n.getMessage('feat_script')
    }, {
        file: 'feat_scull.png',
        id: 25,
        name: chrome.i18n.getMessage('feat_scull')
    }, {
        file: 'feat_sign.png',
        id: 26,
        name: chrome.i18n.getMessage('feat_sign')
    }, {
        file: 'feat_siren.png',
        id: 27,
        name: chrome.i18n.getMessage('feat_siren')
    }, {
        file: 'feat_star.png',
        id: 28,
        name: chrome.i18n.getMessage('feat_star')
    }, {
        file: 'feat_support.png',
        id: 29,
        name: chrome.i18n.getMessage('feat_support')
    }, {
        file: 'feat_tag.png',
        id: 30,
        name: chrome.i18n.getMessage('feat_tag')
    }, {
        file: 'feat_tags.png',
        id: 31,
        name: chrome.i18n.getMessage('feat_tags')
    }, {
        file: 'feat_thumb_down.png',
        id: 32,
        name: chrome.i18n.getMessage('feat_thumb_down')
    }, {
        file: 'feat_thumb_up.png',
        id: 33,
        name: chrome.i18n.getMessage('feat_thumb_up')
    }, {
        file: 'feat_tools.png',
        id: 34,
        name: chrome.i18n.getMessage('feat_tools')
    }],

    /**
     * <p>Provides potential of displaying a message to the user other than the
     * defaults that depend on the value of {@link ext.status}.</p>
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
     * @see ext.updateFeatures
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
    shortcutMacModifiers: '&#8679;&#8997;',

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
                apiKey: 'R_2371fda46305d0ec3065972f5e72800e',
                format: 'json',
                login: 'forchoon',
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
            app_name: chrome.i18n.getMessage('app_name'),
            authorize_url: 'https://www.google.com/accounts/' +
                    'OAuthAuthorizeToken',
            consumer_key: 'anonymous',
            consumer_secret: 'anonymous',
            request_url: 'https://www.google.com/accounts/' +
                    'OAuthGetRequestToken',
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
     * <p>Extracts additional data with the provided information and adds it to
     * the specified object.</p>
     * @param {Tab} tab The tab whose information is to be extracted.
     * @param {Object} data The data to receive the additional data.
     * @param {function} callback The function to be called once the
     * information has been extracted.
     * @since 0.1.1.0
     * @private
     */
    addAdditionalData: function (tab, data, callback) {
        chrome.cookies.getAll({url: data.url}, function (cookies) {
            var cookieNames = [];
            cookies = cookies || [];
            // Extracts the names of every cookie
            for (var i = 0; i < cookies.length; i++) {
                cookieNames.push(cookies[i].name);
            }
            $.extend(data, {
                cookie: function () {
                    return function (text, render) {
                        var name = render(text),
                            value = '';
                        // Attempts to find the value for the cookie name
                        for (var j = 0; j < cookies.length; j++) {
                            if (cookies[j].name === name) {
                                value = cookies[j].value;
                                break;
                            }
                        }
                        return value;
                    };
                },
                cookies: cookieNames
            });
            // Prevents hanging on pages where content script wasn't executed
            if (ext.isProtectedPage(tab)) {
                $.extend(data, {
                    selection: '',
                    selectionlinks: []
                });
                callback();
            } else {
                chrome.tabs.sendRequest(tab.id, {}, function (response) {
                    $.extend(data, {
                        selection: response.text || '',
                        selectionlinks: response.urls || []
                    });
                    callback();
                });
            }
        });
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
     * shortened URL is requested when parsing the template's content.
     * @returns {Object} The data based on information extracted from the tab
     * provided and its URL. This can contain Strings, Arrays, Objects, and
     * functions.
     * @see ext.buildStandardData
     * @since 0.1.0.0
     * @private
     */
    buildDerivedData: function (tab, onClickData, shortCallback) {
        var data = {
            title: tab.title,
            url: ''
        };
        if (onClickData.linkUrl) {
            data.url = onClickData.linkUrl;
        } else if (onClickData.srcUrl) {
            data.url = onClickData.srcUrl;
        } else if (onClickData.frameUrl) {
            data.url = onClickData.frameUrl;
        } else {
            data.url = onClickData.pageUrl;
        }
        return ext.buildStandardData(data, shortCallback);
    },

    /**
     * <p>Creates a <code>&lt;li/&gt;</code> representing the feature provided.
     * This is to be inserted in to the <code>&lt;ul/&gt;</code> in the popup
     * page but is created here to optimize display times for the popup.</p>
     * @param {Object} feature The information of the feature to be used.
     * @returns {jQuery} The generated <code>&lt;li/&gt;</code> jQuery object.
     * @since 0.1.0.0
     * @private
     */
    buildFeature: function (feature) {
        var image = ext.getImagePathForFeature(feature, true);
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
            var modifiers = ext.shortcutModifiers;
            if (ext.isThisPlatform('mac')) {
                modifiers = ext.shortcutMacModifiers;
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
        for (var i = 0; i < ext.features.length; i++) {
            if (ext.features[i].enabled) {
                itemList.append(ext.buildFeature(ext.features[i]));
            }
        }
        // Adds generic message to state the obvious... list is empty
        if (itemList.find('li').length === 0) {
            $('<li/>').append(
                $('<div/>', {
                    'class': 'menu',
                    style: 'background-image: url(\'../images/spacer.png\');'
                }).append(
                    $('<span/>', {
                        'class': 'text',
                        style: 'margin-left: 0',
                        text: chrome.i18n.getMessage('empty')
                    })
                )
            ).appendTo(itemList);
        }
        item.append(itemList);
        ext.popupHTML = $('<div/>').append(loadDiv, item).html();
    },

    /**
     * <p>Creates an Object containing data based on information extracted from
     * the specified tab.</p>
     * <p>This function merges this data with additional information relating
     * to the URL of the tab.</p>
     * <p>If a shortened URL is requested when parsing the template's content
     * later the callback function specified is called to handle this scenario
     * as we don't want to call a URL shortener service unless it is
     * required.</p>
     * @param {Tab} tab The tab whose information is to be extracted.
     * @param {function} shortCallback The function to be called if/when a
     * shortened URL is requested when parsing the template's content.
     * @returns {Object} The data based on information extracted from the tab
     * provided and its URL. This can contain Strings, Arrays, Objects, and
     * functions.
     * @since 0.1.0.0
     * @private
     */
    buildStandardData: function (tab, shortCallback) {
        var compatibility = false,
            data = {},
            title = '',
            url = {};
        for (var i = 0; i < ext.support.length; i++) {
            if (ext.isExtensionActive(tab,
                ext.support[i].extensionId)) {
                title = ext.support[i].title(tab.title);
                url = $.url(ext.support[i].url(tab.url));
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
            bitlyapikey: utils.get('bitlyApiKey'),
            bitlyusername: utils.get('bitlyUsername'),
            browser: ext.browser.title,
            browserversion: ext.browser.version,
            contextmenu: utils.get('contextMenu'),
            cookiesenabled: window.navigator.cookieEnabled,
            datetime: function () {
                return function (text, render) {
                    text = render(text);
                    if (text) {
                        return (new Date()).format(text);
                    }
                    return (new Date()).format();
                };
            },
            decode: function () {
                return function (text, render) {
                    return decodeURIComponent(render(text));
                };
            },
            doanchortarget: utils.get('doAnchorTarget'),
            doanchortitle: utils.get('doAnchorTitle'),
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
            googloauth: utils.get('googlOAuth'),
            java: window.navigator.javaEnabled(),
            notificationduration: utils.get('notificationDuration') / 1000,
            notifications: utils.get('notifications'),
            offline: !window.navigator.onLine,
            // Deprecated since 0.1.0.2, use originalUrl instead
            originalsource: tab.url,
            originaltitle: tab.title || url.attr('source'),
            originalurl: tab.url,
            os: ext.operatingSystem,
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
            shortcuts: utils.get('shortcuts'),
            title: title || url.attr('source'),
            toolbarfeature: utils.get('toolbarFeature'),
            toolbarfeaturedetails: utils.get('toolbarFeatureDetails'),
            toolbarfeaturename: utils.get('toolbarFeatureName'),
            toolbarpopup: utils.get('toolbarPopup'),
            url: url.attr('source'),
            version: ext.version,
            yourls: utils.get('yourls'),
            yourlspassword: utils.get('yourlsPassword'),
            yourlssignature: utils.get('yourlsSignature'),
            yourlsurl: utils.get('yourlsUrl'),
            yourlsusername: utils.get('yourlsUsername')
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
     * @see ext.shorteners
     * @since 0.1.0.0 - Previously located in <code>helper</code>.
     */
    callUrlShortener: function (url, callback) {
        ext.callUrlShortenerHelper(url, function (url, service) {
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
     * @see ext.callUrlShortener
     * @since 0.1.0.0 - Previously located in <code>helper</code>.
     * @private
     */
    callUrlShortenerHelper: function (url, callback) {
        var service = ext.getUrlShortener();
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
     * <p>If the string provided is empty a single space will be copied
     * instead.</p>
     * @param {String} str The string to be added to the clipboard.
     * @param {Boolean} [hidden] <code>true</code> to avoid updating
     * {@link ext.status} and showing a notification; otherwise
     * <code>false</code>.
     */
    copy: function (str, hidden) {
        var result = false,
            sandbox = $('#sandbox').val(str).select();
        result = document.execCommand('copy');
        sandbox.val('');
        if (!hidden) {
            ext.status = result;
            ext.showNotification();
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
        utils.remove('feat_' + name + '_content');
        utils.remove('feat_' + name + '_enabled');
        utils.remove('feat_' + name + '_image');
        utils.remove('feat_' + name + '_index');
        utils.remove('feat_' + name + '_readonly');
        utils.remove('feat_' + name + '_shortcut');
        utils.remove('feat_' + name + '_title');
    },

    /**
     * <p>Injects and executes the <code>content.js</code> and
     * <code>install.js</code> scripts within each of the tabs provided (where
     * valid).</p>
     * @param {Object[]} tabs The tabs to execute the script in.
     * @private
     */
    executeScriptsInExistingTabs: function (tabs) {
        for (var i = 0; i < tabs.length; i++) {
            if (!ext.isProtectedPage(tabs[i])) {
                chrome.tabs.executeScript(tabs[i].id, {file: 'js/content.js'});
                if (tabs[i].url.indexOf(ext.homepage) !== -1) {
                    chrome.tabs.executeScript(tabs[i].id, {
                        file: 'js/install.js'
                    });
                }
            }
        }
    },

    /**
     * <p>Injects and executes the <code>content.js</code> and
     * <code>install.js</code> scripts within all the tabs (where valid) of each
     * Chrome window.</p>
     * @private
     */
    executeScriptsInExistingWindows: function () {
        chrome.windows.getAll(null, function (windows) {
            for (var i = 0; i < windows.length; i++) {
                chrome.tabs.query({windowId: windows[i].id},
                        ext.executeScriptsInExistingTabs);
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
            idx = str.indexOf(ext.browser.title);
        if (idx !== -1) {
            str = str.substring(idx + ext.browser.title.length + 1);
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
        for (var i = 0; i < ext.features.length; i++) {
            if (ext.features[i].menuId === menuId) {
                feature = ext.features[i];
                break;
            }
        }
        return feature;
    },

    /**
     * <p>Attempts to return the information for the any feature with the
     * specified name assigned to it.</p>
     * @param {String} name The name to be queried.
     * @returns {Object} The feature with the name provided, if possible.
     * @since 0.3.0.0
     * @private
     */
    getFeatureWithName: function (name) {
        var feature;
        for (var i = 0; i < ext.features.length; i++) {
            if (ext.features[i].name === name) {
                feature = ext.features[i];
                break;
            }
        }
        return feature;
    },

    /**
     * <p>Attempts to return the information for the any feature with the
     * specified shortcut assigned to it.</p>
     * <p>Disabled features are not included in this search.</p>
     * @param {String} shortcut The shortcut to be queried.
     * @returns {Object} The feature using the shortcut provided, if possible.
     * @since 0.1.0.0
     */
    getFeatureWithShortcut: function (shortcut) {
        var feature;
        for (var i = 0; i < ext.features.length; i++) {
            if (ext.features[i].enabled &&
                    ext.features[i].shortcut === shortcut) {
                feature = ext.features[i];
                break;
            }
        }
        return feature;
    },

    /**
     * <p>Returns the path of the image assigned to the feature provided.</p>
     * @param {Object} feature The feature whose image path is desired.
     * @param {Boolean} [relative] <code>true</code> if the path should be
     * relative; otherwise <code>false</code>.
     * @returns {String} The path of the image.
     * @since 0.3.0.0
     * @private
     */
    getImagePathForFeature: function (feature, relative) {
        var path = '';
        for (var i = 0; i < ext.images.length; i++) {
            if (ext.images[i].id === feature.image) {
                if (relative) {
                    path += '../';
                }
                path += 'images/' + ext.images[i].file;
                break;
            }
        }
        return path;
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
        for (var i = 0; i < ext.operatingSystems.length; i++) {
            os = ext.operatingSystems[i];
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
     * @see ext.shorteners
     */
    getUrlShortener: function () {
        // Attempts to lookup enabled URL shortener service
        for (var i = 0; i < ext.shorteners.length; i++) {
            if (ext.shorteners[i].isEnabled()) {
                return ext.shorteners[i];
            }
        }
        /*
         * Should never reach here but we'll return goo.gl service by default
         * after ensuring it's enabled from now on to save some time next
         * lookup.
         */
        utils.set('googl', true);
        return ext.shorteners[1];
    },

    /**
     * <p>Initializes the background page.</p>
     * <p>This involves initializing the settings, injecting keyboard shortcut
     * listeners and adding the request listeners.</p>
     */
    init: function () {
        utils.init('update_progress', {
            features: [],
            settings: [],
            shorteners: []
        });
        ext.init_update();
        utils.init('contextMenu', true);
        utils.init('notifications', true);
        utils.init('notificationDuration', 3000);
        utils.init('shortcuts', true);
        utils.init('doAnchorTarget', false);
        utils.init('doAnchorTitle', false);
        ext.initFeatures();
        ext.initToolbar();
        ext.initUrlShorteners();
        ext.executeScriptsInExistingWindows();
        chrome.browserAction.onClicked.addListener(ext.onClick);
        chrome.extension.onRequest.addListener(ext.onRequest);
        chrome.extension.onRequestExternal.addListener(ext.onExternalRequest);
        // Derives static browser and OS information
        ext.browser.version = ext.getBrowserVersion();
        ext.operatingSystem = ext.getOperatingSystem();
        // Derives extension's version
        $.getJSON(chrome.extension.getURL('manifest.json'), function (data) {
            ext.version = data.version;
        });
    },

    /**
     * <p>Handles the conversion/removal of older version of settings that may
     * have been stored previously by {@link ext.init}.</p>
     * @since 0.1.0.0
     * @private
     */
    init_update: function () {
        var update = utils.get('update_progress');
        // Checks if 0.1.0.0 update for settings is required
        if (update.settings.indexOf('0.1.0.0') === -1) {
            // Performs 0.1.0.0 update for settings
            utils.rename('settingNotification', 'notifications', true);
            utils.rename('settingNotificationTimer', 'notificationDuration',
                    3000);
            utils.rename('settingShortcut', 'shortcuts', true);
            utils.rename('settingTargetAttr', 'doAnchorTarget', false);
            utils.rename('settingTitleAttr', 'doAnchorTitle', false);
            utils.remove('settingIeTabExtract');
            utils.remove('settingIeTabTitle');
            // Ensures 0.1.0.0 update for settings is not performed again
            update.settings.push('0.1.0.0');
            utils.set('update_progress', update);
        }
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
     * @param {String} feature.content The mustache template for the feature
     * (overwrites).
     * @param {Boolean} feature.enabled <code>true</code> if the feature is
     * enabled; otherwise <code>false</code>.
     * @param {Integer} feature.image The identifier of the feature's image.
     * @param {Integer} feature.index The index representing the feature's
     * display order.
     * @param {String} feature.name The unique name of the feature.
     * @param {Boolean} feature.readOnly <code>true</code> if the feature is
     * read-only and certain values cannot be editted by the user; otherwise
     * <code>false</code> (overwrites).
     * @param {String} feature.shortcut The keyboard shortcut assigned to the
     * feature.
     * @param {String} feature.title The title of the feature (overwrites).
     * @returns {Object} The feature provided.
     * @since 0.1.0.0
     * @private
     */
    initFeature: function (feature) {
        var name = feature.name;
        utils.set('feat_' + name + '_content', feature.content);
        utils.init('feat_' + name + '_enabled', feature.enabled);
        utils.init('feat_' + name + '_image', feature.image);
        utils.init('feat_' + name + '_index', feature.index);
        utils.set('feat_' + name + '_readonly', feature.readOnly);
        utils.init('feat_' + name + '_shortcut', feature.shortcut);
        utils.set('feat_' + name + '_title', feature.title);
        ext.addFeatureName(name);
        return feature;
    },

    /**
     * <p>Initializes the supported copy request features (including their
     * corresponding settings).</p>
     * @private
     */
    initFeatures: function () {
        utils.init('features', []);
        ext.initFeatures_update();
        for (var i = 0; i < ext.defaultFeatures.length; i++) {
            ext.initFeature(ext.defaultFeatures[i]);
        }
        ext.updateFeatures();
    },

    /**
     * <p>Handles the conversion/removal of older version of settings that may
     * have been stored previously by {@link ext.initFeatures}.</p>
     * @since 0.1.0.0
     * @private
     */
    initFeatures_update: function () {
        var update = utils.get('update_progress');
        // Checks if 0.1.0.0 update for features is required
        if (update.features.indexOf('0.1.0.0') === -1) {
            // Performs 0.1.0.0 update for features
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
            // Ensures 0.1.0.0 update for features is not performed again
            update.features.push('0.1.0.0');
            utils.set('update_progress', update);
        }
        // Checks if 0.2.0.0 update for features is required
        if (update.features.indexOf('0.2.0.0') === -1) {
            // Performs 0.2.0.0 update for features
            var image,
                names = utils.get('features');
            for (var i = 0; i < names.length; i++) {
                utils.rename('feat_' + names[i] + '_template', 'feat_' +
                        names[i] + '_content');
                image = utils.get('feat_' + names[i] + '_image');
                if (typeof image === 'string') {
                    for (var j = 0; j < ext.images.length; j++) {
                        if (ext.images[j].file === image) {
                            utils.set('feat_' + names[i] + '_image',
                                    ext.images[j].id);
                            break;
                        }
                    }
                } else if (typeof image === 'undefined') {
                    utils.set('feat_' + names[i] + '_image', 0);
                }
            }
            // Ensures 0.2.0.0 update for features is not performed again
            update.features.push('0.2.0.0');
            utils.set('update_progress', update);
        }
    },

    /**
     * <p>Initializes the settings related to the toolbar/browser action.</p>
     * @since 0.3.0.0
     * @private
     */
    initToolbar: function () {
        utils.init('toolbarPopup', true);
        utils.init('toolbarFeature', false);
        utils.init('toolbarFeatureDetails', false);
        utils.init('toolbarFeatureName', '');
        ext.updateToolbar();
    },

    /**
     * <p>Initializes the settings related to the supported URL Shortener
     * services.</p>
     * @private
     */
    initUrlShorteners: function () {
        ext.initUrlShorteners_update();
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
     * have been stored previously by {@link ext.initUrlShorteners}.</p>
     * @since 0.1.0.0
     * @private
     */
    initUrlShorteners_update: function () {
        var update = utils.get('update_progress');
        // Checks if 0.1.0.0 update for URL shorteners is required
        if (update.shorteners.indexOf('0.1.0.0') === -1) {
            // Performs 0.1.0.0 update for URL shorteners
            utils.rename('bitlyEnabled', 'bitly', false);
            utils.rename('bitlyXApiKey', 'bitlyApiKey', '');
            utils.rename('bitlyXLogin', 'bitlyUsername', '');
            utils.rename('googleEnabled', 'googl', true);
            utils.rename('googleOAuthEnabled', 'googlOAuth', true);
            // Ensures 0.1.0.0 update for URL shorteners is not performed again
            update.shorteners.push('0.1.0.0');
            utils.set('update_progress', update);
        }
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
        for (var i = 0; i < ext.blacklistedExtensions.length; i++) {
            if (ext.blacklistedExtensions[i] === sender.id) {
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
        return (ext.isSpecialPage(tab) && tab.url.indexOf(extensionId) !== -1);
    },

    /**
     * <p>Determines whether or not the tab provided is currently displaying a
     * page on the Chrome Extension Gallery (i.e. Web Store).</p>
     * @param {Tab} tab The tab to be tested.
     * @returns {Boolean} <code>true</code> if displaying a page on the Chrome
     * Extension Gallery; otherwise <code>false</code>.
     * @since 0.2.1.0
     */
    isExtensionGallery: function (tab) {
        return tab.url.indexOf('https://chrome.google.com/webstore') === 0;
    },

    /**
     * <p>Determines whether or not the tab provided is currently display a
     * <em>protected</em> page (i.e. a page that content scripts cannot be
     * executed on).</p>
     * @param {Tab} tab The tab to be tested.
     * @returns {Boolean} <code>true</code> if displaying a <em>protected</em>
     * page; otherwise <code>false</code>.
     * @since 0.2.1.0
     */
    isProtectedPage: function (tab) {
        return ext.isSpecialPage(tab) || ext.isExtensionGallery(tab);
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
            content: utils.get('feat_' + name + '_content'),
            enabled: utils.get('feat_' + name + '_enabled'),
            image: utils.get('feat_' + name + '_image'),
            index: utils.get('feat_' + name + '_index'),
            name: name,
            readOnly: utils.get('feat_' + name + '_readonly'),
            shortcut: utils.get('feat_' + name + '_shortcut'),
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
            features.push(ext.loadFeature(names[i]));
        }
        features.sort(function (a, b) {
            return a.index - b.index;
        });
        return features;
    },

    /**
     * <p>Listener for toolbar/browser action clicks.</p>
     * @param {Tab} tab The tab active when clicked.
     * @since 0.3.0.0
     * @private
     */
    onClick: function (tab) {
        ext.onRequest({
            data: {
                name: utils.get('toolbarFeatureName')
            },
            type: 'popup'
        });
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
        if (!ext.isBlacklisted(sender)) {
            ext.onRequest(request, sender, sendResponse);
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
            ext.onRequestHelper(request, sender, sendResponse);
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
     * @private
     */
    onRequestHelper: function (request, sender, sendResponse) {
        if (request.type === 'version') {
            if (typeof sendResponse === 'function') {
                sendResponse({version: ext.version});
            }
            return;
        }
        chrome.windows.getCurrent(function (win) {
            chrome.tabs.query({
                active: true,
                windowId: win.id
            }, function (tabs) {
                var data = {},
                    feature,
                    popup = chrome.extension.getViews({type: 'popup'})[0],
                    shortCalled = false,
                    shortPlaceholder = 'short' +
                            (Math.floor(Math.random() * 99999 + 1000)),
                    tab = tabs[0];
                function copyOutput(str) {
                    if (str) {
                        ext.copy(str);
                    } else {
                        ext.message = chrome.i18n.getMessage('copy_fail_empty');
                        ext.status = false;
                        ext.showNotification();
                    }
                }
                function shortCallback() {
                    shortCalled = true;
                    return '{' + shortPlaceholder + '}';
                }
                if (popup) {
                    $('#item', popup.document).hide();
                    $('#loadDiv', popup.document).show();
                }
                try {
                    switch (request.type) {
                    case 'menu':
                        data = ext.buildDerivedData(tab, request.data,
                                shortCallback);
                        feature = ext.getFeatureWithMenuId(
                                request.data.menuItemId);
                        break;
                    case 'popup':
                        // Should be cheaper than searching ext.features...
                        data = ext.buildStandardData(tab, shortCallback);
                        feature = ext.loadFeature(request.data.name);
                        break;
                    case 'shortcut':
                        data = ext.buildStandardData(tab, shortCallback);
                        feature = ext.getFeatureWithShortcut(request.data.key);
                        break;
                    }
                } catch (e) {
                    if (e instanceof URIError) {
                        ext.message = chrome.i18n.getMessage('copy_fail_uri');
                    } else {
                        ext.message = chrome.i18n.getMessage('copy_fail_error');
                    }
                    ext.status = false;
                    ext.showNotification();
                    return;
                }
                if (feature) {
                    ext.addAdditionalData(tab, data, function () {
                        if (!feature.content) {
                            // Displays empty template error message
                            copyOutput();
                            return;
                        }
                        var output = Mustache.to_html(feature.content, data);
                        if (shortCalled) {
                            ext.callUrlShortener(data.source, function (response) {
                                if (response.success && response.shortUrl) {
                                    var newData = {};
                                    newData[shortPlaceholder] = response.shortUrl;
                                    copyOutput(Mustache.to_html(output, newData));
                                } else {
                                    if (!response.message) {
                                        response.message = chrome.i18n.getMessage(
                                                'shortener_error',
                                                response.shortener);
                                    }
                                    ext.message = response.message;
                                    ext.status = false;
                                    ext.showNotification();
                                }
                            });
                        } else {
                            copyOutput(output);
                        }
                    });
                } else {
                    if (popup) {
                        popup.close();
                    }
                }
            });
        });
    },

    /**
     * <p>Attempts to retrieve the contents of the system clipboard.</p>
     * @returns {String} The string taken from the clipboard.
     * @since 0.2.0.1
     */
    paste: function () {
        var result = '',
            sandbox = $('#sandbox').val('').select();
        if (document.execCommand('paste')) {
            result = sandbox.val();
        }
        sandbox.val('');
        return result;
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
        ext.message = '';
        ext.status = false;
    },

    /**
     * <p>Stores the values of the specified feature in to their respective
     * locations.</p>
     * @param {Object} feature The feature whose values are to be saved.
     * @param {String} feature.content The mustache template for the feature.
     * @param {Boolean} feature.enabled <code>true</code> if the feature is
     * enabled; otherwise <code>false</code>.
     * @param {Integer} feature.image The identifier of the feature's image.
     * @param {Integer} feature.index The index representing the feature's
     * display order.
     * @param {String} feature.name The unique name of the feature.
     * @param {Boolean} feature.readOnly <code>true</code> if the feature is
     * read-only and certain values cannot be editted by the user; otherwise
     * <code>false</code>.
     * @param {String} feature.shortcut The keyboard shortcut assigned to the
     * feature.
     * @param {String} feature.title The title of the feature.
     * @returns {Object} The feature provided.
     * @since 0.1.0.0
     * @private
     */
    saveFeature: function (feature) {
        var name = feature.name;
        utils.set('feat_' + name + '_content', feature.content);
        utils.set('feat_' + name + '_enabled', feature.enabled);
        utils.set('feat_' + name + '_image', feature.image);
        utils.set('feat_' + name + '_index', feature.index);
        utils.set('feat_' + name + '_readonly', feature.readOnly);
        utils.set('feat_' + name + '_shortcut', feature.shortcut);
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
            ext.saveFeature(features[i]);
        }
        // Ensures any features no longer used are removed from localStorage
        for (var j = 0; j < oldNames.length; j++) {
            if (names.indexOf(oldNames[j]) === -1) {
                ext.deleteFeature(oldNames[j]);
            }
        }
        utils.set('features', names);
        return features;
    },

    /**
     * <p>Displays a Chrome notification to inform the user on whether or not
     * the copy request was successful.</p>
     * <p>This function ensures that {@link ext} is reset and that
     * notifications are only displayed if specified by the user (or by
     * default).</p>
     * @see ext.reset
     */
    showNotification: function () {
        var popup = chrome.extension.getViews({type: 'popup'})[0];
        if (utils.get('notifications')) {
            webkitNotifications.createHTMLNotification(
                chrome.extension.getURL('pages/notification.html')
            ).show();
        } else {
            ext.reset();
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
                ext.onRequestHelper({
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
                for (var i = 0; i < ext.features.length; i++) {
                    if (ext.features[i].enabled) {
                        menuId = chrome.contextMenus.create({
                            contexts: ['all'],
                            onclick: onMenuClick,
                            parentId: parentId,
                            title: ext.features[i].title
                        });
                        ext.features[i].menuId = menuId;
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
        ext.features = ext.loadFeatures();
        ext.buildPopup();
        ext.updateContextMenu();
    },

    /**
     * <p>Updates the toolbar/browser action depending on the current
     * settings.</p>
     * @since 0.3.0.0
     */
    updateToolbar: function () {
        var feature,
            featureName = utils.get('toolbarFeatureName'),
            image = 'images/icon_19.png',
            title = chrome.i18n.getMessage('name');
        if (featureName) {
            feature = ext.getFeatureWithName(featureName);
        }
        if (utils.get('toolbarPopup') || !feature) {
            chrome.browserAction.setIcon({
                path: chrome.extension.getURL(image)
            });
            chrome.browserAction.setTitle({title: title});
            chrome.browserAction.setPopup({popup: 'pages/popup.html'});
        } else {
            if (utils.get('toolbarFeatureDetails')) {
                if (feature.image !== 0) {
                    image = ext.getImagePathForFeature(feature);
                }
                title = feature.title;
            }
            chrome.browserAction.setIcon({
                path: chrome.extension.getURL(image)
            });
            chrome.browserAction.setTitle({title: title});
            chrome.browserAction.setPopup({popup: ''});
        }
    }

};