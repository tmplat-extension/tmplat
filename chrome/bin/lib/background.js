// [Template](http://neocotic.com/template)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/template>
(function() {
  var AppError, BLACKLIST, DEFAULT_TEMPLATES, EXTENSION_ID, Extension, HOMEPAGE_DOMAIN, Icon, OPERATING_SYSTEMS, POPUP_DELAY, REAL_EXTENSION_ID, R_EXPRESION_TAG, R_UPPER_CASE, R_VALID_URL, SHORTENERS, SUPPORT, UNKNOWN_LOCALE, addAdditionalData, browser, buildConfig, buildDerivedData, buildIcons, buildPopup, buildStandardData, buildTemplate, callUrlShortener, deriveMessageInfo, deriveMessageTempate, evaluateExpressions, executeScriptsInExistingWindows, ext, getActiveUrlShortener, getBrowserVersion, getHotkeys, getOperatingSystem, getTemplateWithKey, getTemplateWithMenuId, getTemplateWithShortcut, initStatistics, initTemplate, initTemplates, initTemplates_update, initToolbar, initToolbar_update, initUrlShorteners, initUrlShorteners_update, init_update, isBlacklisted, isExtensionActive, isNewInstall, isProductionBuild, isProtectedPage, isSpecialPage, isWebStore, nullIfEmpty, onMessage, onMessageExternal, operatingSystem, selectOrCreateTab, showNotification, transformData, updateHotkeys, updateProgress, updateStatistics, updateTemplateUsage, updateUrlShortenerUsage, _ref,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  BLACKLIST = [];

  DEFAULT_TEMPLATES = [
    {
      content: '{url}',
      enabled: true,
      image: 'globe',
      index: 0,
      key: 'PREDEFINED.00001',
      readOnly: true,
      shortcut: 'U',
      title: i18n.get('default_template_url'),
      usage: 0
    }, {
      content: '{#shorten}{url}{/shorten}',
      enabled: true,
      image: 'tag',
      index: 1,
      key: 'PREDEFINED.00002',
      readOnly: true,
      shortcut: 'S',
      title: i18n.get('default_template_short'),
      usage: 0
    }, {
      content: "<a href=\"{url}\"{#anchorTarget} target=\"_blank\"{/anchorTarget}{#anchorTitle} title=\"{{title}}\"{/anchorTitle}>{{title}}</a>",
      enabled: true,
      image: 'font',
      index: 2,
      key: 'PREDEFINED.00003',
      readOnly: true,
      shortcut: 'A',
      title: i18n.get('default_template_anchor'),
      usage: 0
    }, {
      content: '{#encode}{url}{/encode}',
      enabled: true,
      image: 'lock',
      index: 3,
      key: 'PREDEFINED.00004',
      readOnly: true,
      shortcut: 'E',
      title: i18n.get('default_template_encoded'),
      usage: 0
    }, {
      content: '[url={url}]{title}[/url]',
      enabled: false,
      image: 'comment',
      index: 5,
      key: 'PREDEFINED.00005',
      readOnly: true,
      shortcut: 'B',
      title: i18n.get('default_template_bbcode'),
      usage: 0
    }, {
      content: '[{title}]({url})',
      enabled: false,
      image: 'asterisk',
      index: 4,
      key: 'PREDEFINED.00006',
      readOnly: true,
      shortcut: 'M',
      title: i18n.get('default_template_markdown'),
      usage: 0
    }, {
      content: '{selectionMarkdown}',
      enabled: false,
      image: 'italic',
      index: 6,
      key: 'PREDEFINED.00007',
      readOnly: true,
      shortcut: 'I',
      title: i18n.get('default_template_markdown_selection'),
      usage: 0
    }
  ];

  EXTENSION_ID = i18n.get('@@extension_id');

  HOMEPAGE_DOMAIN = 'neocotic.com';

  OPERATING_SYSTEMS = [
    {
      substring: 'Win',
      title: 'Windows'
    }, {
      substring: 'Mac',
      title: 'Mac'
    }, {
      substring: 'Linux',
      title: 'Linux'
    }
  ];

  POPUP_DELAY = 600;

  R_EXPRESION_TAG = /^(select|xpath)(all)?(\S*)?$/;

  R_UPPER_CASE = /[A-Z]+/;

  R_VALID_URL = /^https?:\/\/\S+\.\S+/i;

  REAL_EXTENSION_ID = 'dcjnfaoifoefmnbhhlbppaebgnccfddf';

  SHORTENERS = [
    {
      name: 'bitly',
      title: i18n.get('shortener_bitly'),
      method: 'GET',
      getHeaders: function() {
        return {
          'Content-Type': 'application/x-www-form-urlencoded'
        };
      },
      getParameters: function(url) {
        var params;

        params = {
          format: 'json',
          longUrl: url
        };
        if (this.oauth.hasAccessToken()) {
          params.access_token = this.oauth.getAccessToken();
        } else {
          params.apiKey = ext.config.services.bitly.api_key;
          params.login = ext.config.services.bitly.login;
        }
        return params;
      },
      getUsage: function() {
        return store.get('bitly.usage');
      },
      input: function() {
        return null;
      },
      isEnabled: function() {
        return store.get('bitly.enabled');
      },
      oauth: function() {
        var options;

        options = _.pick(ext.config.services.bitly, 'client_id', 'client_secret');
        return new OAuth2('bitly', options);
      },
      output: function(resp) {
        return JSON.parse(resp).data.url;
      },
      url: function() {
        return ext.config.services.bitly.url;
      }
    }, {
      name: 'googl',
      title: i18n.get('shortener_googl'),
      method: 'POST',
      getHeaders: function() {
        var headers;

        headers = {
          'Content-Type': 'application/json'
        };
        if (this.oauth.hasAccessToken()) {
          headers.Authorization = "OAuth " + (this.oauth.getAccessToken());
        }
        return headers;
      },
      getParameters: function() {
        if (!this.oauth.hasAccessToken()) {
          return {
            key: ext.config.services.googl.api_key
          };
        }
      },
      getUsage: function() {
        return store.get('googl.usage');
      },
      input: function(url) {
        return JSON.stringify({
          longUrl: url
        });
      },
      isEnabled: function() {
        return store.get('googl.enabled');
      },
      oauth: function() {
        var options;

        options = _.pick(ext.config.services.googl, 'api_scope', 'client_id', 'client_secret');
        return new OAuth2('google', options);
      },
      output: function(resp) {
        return JSON.parse(resp).id;
      },
      url: function() {
        return ext.config.services.googl.url;
      }
    }, {
      name: 'yourls',
      title: i18n.get('shortener_yourls'),
      method: 'POST',
      getHeaders: function() {
        return {
          'Content-Type': 'application/json'
        };
      },
      getParameters: function(url) {
        var authentication, params, password, signature, username, _ref;

        params = {
          action: 'shorturl',
          format: 'json',
          url: url
        };
        _ref = store.get('yourls'), authentication = _ref.authentication, password = _ref.password, signature = _ref.signature, username = _ref.username;
        switch (authentication) {
          case 'advanced':
            if (signature) {
              params.signature = signature;
            }
            break;
          case 'basic':
            if (password) {
              params.password = password;
            }
            if (username) {
              params.username = username;
            }
        }
        return params;
      },
      getUsage: function() {
        return store.get('yourls.usage');
      },
      input: function() {
        return null;
      },
      isEnabled: function() {
        return store.get('yourls.enabled');
      },
      output: function(resp) {
        return JSON.parse(resp).shorturl;
      },
      url: function() {
        return store.get('yourls.url');
      }
    }
  ];

  SUPPORT = {
    hehijbfgiekmjfkfjpbkbammjbdenadd: function(tab) {
      var idx, str;

      if (tab.title) {
        str = 'IE: ';
        idx = tab.title.indexOf(str);
        if (idx !== -1) {
          tab.title = tab.title.substring(idx + str.length);
        }
      }
      if (tab.url) {
        str = 'iecontainer.html#url=';
        idx = tab.url.indexOf(str);
        if (idx !== -1) {
          return tab.url = decodeURIComponent(tab.url.substring(idx + str.length));
        }
      }
    },
    miedgcmlgpmdagojnnbemlkgidepfjfi: function(tab) {
      var idx, str;

      if (tab.url) {
        str = 'ie.html#';
        idx = tab.url.indexOf(str);
        if (idx !== -1) {
          return tab.url = tab.url.substring(idx + str.length);
        }
      }
    },
    fnfnbeppfinmnjnjhedifcfllpcfgeea: function(tab) {
      var idx, str;

      if (tab.url) {
        str = 'navigate.html?chromeurl=';
        idx = tab.url.indexOf(str);
        if (idx !== -1) {
          tab.url = tab.url.substring(idx + str.length);
          str = '[escape]';
          if (!tab.url.indexOf(str)) {
            return tab.url = decodeURIComponent(tab.url.slice(str.length));
          }
        }
      }
    },
    icoloanbecehinobmflpeglknkplbfbm: function(tab) {
      var idx, str;

      if (tab.url) {
        str = 'navigate.html?chromeurl=';
        idx = tab.url.indexOf(str);
        if (idx !== -1) {
          tab.url = tab.url.substring(idx + str.length);
          str = '[escape]';
          if (!tab.url.indexOf(str)) {
            return tab.url = decodeURIComponent(tab.url.slice(str.length));
          }
        }
      }
    }
  };

  UNKNOWN_LOCALE = 'und';

  browser = {
    title: 'Chrome',
    version: ''
  };

  isNewInstall = false;

  isProductionBuild = EXTENSION_ID === REAL_EXTENSION_ID;

  operatingSystem = '';

  executeScriptsInExistingWindows = function() {
    log.trace();
    return chrome.tabs.query({}, function(tabs) {
      var tab, _i, _len, _results;

      log.info('Checking the following tabs for content script execution...', tabs);
      _results = [];
      for (_i = 0, _len = tabs.length; _i < _len; _i++) {
        tab = tabs[_i];
        if (!(!isProtectedPage(tab))) {
          continue;
        }
        chrome.tabs.executeScript(tab.id, {
          file: 'lib/content.js'
        });
        if (__indexOf.call(tab.url, HOMEPAGE_DOMAIN) >= 0) {
          _results.push(chrome.tabs.executeScript(tab.id, {
            file: 'lib/install.js'
          }));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    });
  };

  getBrowserVersion = function() {
    var idx, str;

    log.trace();
    str = navigator.userAgent;
    idx = str.indexOf(browser.title);
    if (idx !== -1) {
      str = str.substring(idx + browser.title.length + 1);
      idx = str.indexOf(' ');
      if (idx === -1) {
        return str;
      } else {
        return str.slice(0, idx);
      }
    }
  };

  getHotkeys = function() {
    var template, _i, _len, _ref, _results;

    log.trace();
    _ref = ext.templates;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      template = _ref[_i];
      if (template.enabled) {
        _results.push(template.shortcut);
      }
    }
    return _results;
  };

  getOperatingSystem = function() {
    var os, _i, _len, _ref;

    log.trace();
    for (_i = 0, _len = OPERATING_SYSTEMS.length; _i < _len; _i++) {
      os = OPERATING_SYSTEMS[_i];
      if (_ref = os.substring, __indexOf.call(navigator.platform, _ref) >= 0) {
        return os.title;
      }
    }
    return navigator.platform;
  };

  getTemplateWithKey = function(key) {
    log.trace();
    return _.findWhere(ext.templates, {
      key: key
    });
  };

  getTemplateWithMenuId = function(menuId) {
    log.trace();
    return _.findWhere(ext.templates, {
      menuId: menuId
    });
  };

  getTemplateWithShortcut = function(shortcut) {
    log.trace();
    return _.findWhere(ext.templates, {
      enabled: true,
      shortcut: shortcut
    });
  };

  isBlacklisted = function(extensionId) {
    var extension, _i, _len;

    log.trace();
    for (_i = 0, _len = BLACKLIST.length; _i < _len; _i++) {
      extension = BLACKLIST[_i];
      if (extension === extensionId) {
        return true;
      }
    }
    return false;
  };

  isExtensionActive = function(tab, extensionId) {
    log.trace();
    log.debug("Checking activity of supported extension '" + extensionId + "'");
    return isSpecialPage(tab) && __indexOf.call(tab.url, extensionId) >= 0;
  };

  isProtectedPage = function(tab) {
    log.trace();
    return isSpecialPage(tab) || isWebStore(tab);
  };

  isSpecialPage = function(tab) {
    log.trace();
    return !tab.url.indexOf('chrome');
  };

  isWebStore = function(tab) {
    log.trace();
    return !tab.url.indexOf('https://chrome.google.com/webstore');
  };

  nullIfEmpty = function(object) {
    log.trace();
    if (_.isEmpty(object)) {
      return null;
    } else {
      return object;
    }
  };

  onMessage = function(message, sender, sendResponse) {
    var active, callback, data, editable, id, link, output, placeholders, shortcut, template, _ref, _ref1;

    log.trace();
    callback = utils.callback(sendResponse);
    if (!message.type) {
      return callback();
    }
    if (message.type === 'shortcut' && !store.get('shortcuts.enabled')) {
      return callback();
    }
    if (message.type === 'options') {
      selectOrCreateTab(utils.url('pages/options.html'));
      if ((_ref = chrome.extension.getViews({
        type: 'popup'
      })[0]) != null) {
        _ref.close();
      }
      return callback();
    }
    if ((_ref1 = message.type) === 'info' || _ref1 === 'version') {
      return callback({
        hotkeys: getHotkeys(),
        id: EXTENSION_ID,
        version: ext.version
      });
    }
    active = data = output = template = null;
    editable = link = shortcut = false;
    id = utils.keyGen('', null, 't', false);
    placeholders = {};
    return async.series([
      function(done) {
        return chrome.tabs.query({
          active: true,
          currentWindow: true
        }, function(tabs) {
          log.debug('Checking the following tabs for the active tab...', tabs);
          active = _.first(tabs);
          return done();
        });
      }, function(done) {
        var err, getCallback, _ref2;

        getCallback = function(tag) {
          return function(text, render) {
            var key, placeholder, trim, val;

            if (text) {
              text = render(text);
            }
            if (tag === 'shorten' && !text) {
              text = this.url;
            }
            trim = (text != null ? text.trim() : void 0) || '';
            log.debug("Following is the contents of a " + tag + " tag...", text);
            if (!trim || tag === 'shorten' && !R_VALID_URL.test(trim)) {
              return text;
            }
            for (key in placeholders) {
              if (!__hasProp.call(placeholders, key)) continue;
              val = placeholders[key];
              if (val.data === trim && val.tag === tag) {
                placeholder = key;
                break;
              }
            }
            if (placeholder == null) {
              placeholder = utils.keyGen('', null, 'c', false);
              placeholders[placeholder] = {
                data: trim,
                tag: tag
              };
              this[placeholder] = "{" + placeholder + "}";
            }
            log.debug("Replacing " + tag + " tag with " + placeholder + " placeholder");
            return "{" + placeholder + "}";
          };
        };
        updateProgress(null, true);
        try {
          template = deriveMessageTempate(message);
          updateProgress(10);
          _ref2 = deriveMessageInfo(message, active, getCallback), data = _ref2.data, editable = _ref2.editable, link = _ref2.link, shortcut = _ref2.shortcut;
          updateProgress(20);
          return done();
        } catch (_error) {
          err = _error;
          log.error(err);
          if (err instanceof AppError) {
            return done(err);
          } else {
            return done(new AppError(err instanceof URIError ? 'result_bad_uri_description' : 'result_bad_error_description'));
          }
        }
      }, function(done) {
        updateProgress(30);
        return addAdditionalData(active, data, id, editable, shortcut, link, function() {
          updateProgress(40);
          transformData(data);
          $.extend(data, {
            template: template
          });
          log.debug("Using the following data to render " + template.title + "...", data);
          if (template.content) {
            output = Mustache.render(template.content, data);
            log.debug('The following was generated as a result...', output);
          }
          updateProgress(60);
          if (output == null) {
            output = '';
          }
          return done();
        });
      }, function(done) {
        var expressionMap, info, match, placeholder, shortenMap;

        updateProgress(70);
        if (_.isEmpty(placeholders)) {
          return done();
        }
        expressionMap = {};
        shortenMap = {};
        for (placeholder in placeholders) {
          if (!__hasProp.call(placeholders, placeholder)) continue;
          info = placeholders[placeholder];
          if (info.tag === 'shorten') {
            shortenMap[placeholder] = info.data;
          } else {
            match = info.tag.match(R_EXPRESION_TAG);
            if (match) {
              expressionMap[placeholder] = {
                all: match[2] != null,
                convertTo: match[3],
                expression: info.data,
                type: match[1]
              };
            }
          }
        }
        return async.series([
          function(done) {
            updateProgress(80);
            if (_.isEmpty(expressionMap)) {
              return done();
            }
            return evaluateExpressions(active, expressionMap, function(err) {
              var value;

              updateProgress(85);
              if (!err) {
                log.info("" + (_.size(expressionMap)) + " expression(s) were evaluated");
                for (placeholder in expressionMap) {
                  if (!__hasProp.call(expressionMap, placeholder)) continue;
                  value = expressionMap[placeholder];
                  placeholders[placeholder] = value;
                }
              }
              return done(err);
            });
          }, function(done) {
            updateProgress(90);
            if (_.isEmpty(shortenMap)) {
              return done();
            }
            return callUrlShortener(shortenMap, function(err, response) {
              var value;

              updateProgress(95);
              if (!err) {
                log.info("URL shortener service was called " + (_.size(shortenMap)) + " time(s)");
                updateUrlShortenerUsage(response.service.name, response.oauth);
                for (placeholder in shortenMap) {
                  if (!__hasProp.call(shortenMap, placeholder)) continue;
                  value = shortenMap[placeholder];
                  placeholders[placeholder] = value;
                }
              }
              return done(err);
            });
          }
        ], function(err) {
          if (!err) {
            output = Mustache.render(output, placeholders);
            log.debug('The follow was re-generated as a result...', output);
          }
          return done(err);
        });
      }
    ], function(err) {
      var notification, type, _ref2;

      updateProgress(100);
      type = utils.capitalize(message.type);
      analytics.track('Requests', 'Processed', type, shortcut ? message.data.key.charCodeAt(0) : void 0);
      if (!err && !output) {
        err = new AppError('result_bad_empty_description', template.title);
      }
      notification = ext.notification;
      if (err) {
        log.warn(err.message);
        notification.title = i18n.get('result_bad_title');
        notification.titleStyle = 'color: #B94A48';
        notification.description = (_ref2 = err.message) != null ? _ref2 : i18n.get('result_bad_description', template.title);
        showNotification();
      } else {
        updateTemplateUsage(template.key);
        updateStatistics();
        notification.title = i18n.get('result_good_title');
        notification.titleStyle = 'color: #468847';
        notification.description = i18n.get('result_good_description', template.title);
        ext.copy(output);
        if (!isProtectedPage(active) && (editable && store.get('menu.paste')) || (shortcut && store.get('shortcuts.paste'))) {
          chrome.tabs.sendMessage(active.id, {
            contents: output,
            id: id,
            type: 'paste'
          });
        }
      }
      return log.debug("Finished handling a " + type + " request");
    });
  };

  onMessageExternal = function(message, sender, sendResponse) {
    var blocked, callback;

    log.trace();
    callback = utils.callback(sendResponse);
    blocked = isBlacklisted(sender.id);
    analytics.track('External Requests', 'Started', sender.id, Number(!blocked));
    if (blocked) {
      log.debug("Blocked external request from " + sender.id);
      return callback();
    }
    log.debug("Accepted external request from " + sender.id);
    return onMessage(message, sender, sendResponse);
  };

  selectOrCreateTab = function(url, callback) {
    log.trace();
    return chrome.windows.getLastFocused({
      populate: true
    }, function(win) {
      var existing, tab, tabs, _i, _len;

      tabs = win.tabs;
      log.debug('Checking the tabs of the following last focused window...', win);
      log.debug('Checking the following tabs for a matching URL...', tabs);
      for (_i = 0, _len = tabs.length; _i < _len; _i++) {
        tab = tabs[_i];
        if (!(!tab.url.indexOf(url))) {
          continue;
        }
        existing = tab;
        break;
      }
      if (existing != null) {
        chrome.tabs.update(existing.id, {
          active: true
        });
        return typeof callback === "function" ? callback(existing) : void 0;
      } else {
        return chrome.tabs.create({
          windowId: win.id,
          url: url,
          active: true
        }, function(tab) {
          return typeof callback === "function" ? callback(tab) : void 0;
        });
      }
    });
  };

  showNotification = function() {
    log.trace();
    if (store.get('notifications.enabled')) {
      webkitNotifications.createHTMLNotification(utils.url('pages/notification.html')).show();
    } else {
      ext.reset();
    }
    return updateProgress(null, false);
  };

  updateHotkeys = function() {
    var hotkeys;

    log.trace();
    hotkeys = getHotkeys();
    return chrome.tabs.query({}, function(tabs) {
      var tab, _i, _len, _results;

      log.info('Updating the hotkeys registed in the following tabs...', tabs);
      _results = [];
      for (_i = 0, _len = tabs.length; _i < _len; _i++) {
        tab = tabs[_i];
        if (!isProtectedPage(tab)) {
          _results.push(chrome.tabs.sendMessage(tab.id, {
            hotkeys: hotkeys
          }));
        }
      }
      return _results;
    });
  };

  updateProgress = function(percent, toggle) {
    var loading, popup, progressBar, templates;

    log.trace();
    popup = $(chrome.extension.getViews({
      type: 'popup'
    })[0]);
    templates = popup.length ? $('#templates', popup[0].document) : $();
    loading = popup.length ? $('#loading', popup[0].document) : $();
    progressBar = loading.find('.bar');
    if (toggle != null) {
      if (toggle) {
        progressBar.css('width', '0%');
        popup.delay(POPUP_DELAY);
        templates.hide().delay(POPUP_DELAY);
        return loading.show().delay(POPUP_DELAY);
      } else {
        if (store.get('toolbar.close')) {
          return popup.queue(function() {
            var _ref;

            return (_ref = popup.dequeue()[0]) != null ? _ref.close() : void 0;
          });
        } else {
          loading.queue(function() {
            loading.hide().dequeue();
            return progressBar.css('width', '0%');
          });
          return templates.queue(function() {
            return templates.show().dequeue();
          });
        }
      }
    } else if (percent != null) {
      log.info("Updating bar progress to " + percent + "%");
      popup.dequeue().delay(POPUP_DELAY);
      templates.dequeue().delay(POPUP_DELAY);
      loading.dequeue().delay(POPUP_DELAY);
      return progressBar.css('width', "" + percent + "%");
    }
  };

  updateStatistics = function() {
    log.trace();
    log.info('Updating statistics');
    store.init('stats', {});
    return store.modify('stats', function(stats) {
      var popular;

      popular = _.max(ext.templates, function(template) {
        return template.usage;
      });
      stats.count = ext.templates.length;
      stats.customCount = stats.count - DEFAULT_TEMPLATES.length;
      return stats.popular = popular != null ? popular.key : void 0;
    });
  };

  updateTemplateUsage = function(key) {
    var template;

    log.trace();
    template = _.findWhere(ext.templates, {
      key: key
    });
    if (template != null) {
      template.usage++;
      store.set('templates', ext.templates);
      log.info("Used the " + template.title + " template");
      return analytics.track('Templates', 'Used', template.title, Number(template.readOnly));
    }
  };

  updateUrlShortenerUsage = function(name, oauth) {
    var shortener;

    log.trace();
    shortener = _.findWhere(SHORTENERS, {
      name: name
    });
    if (shortener != null) {
      store.modify(name, function(shortener) {
        return shortener.usage++;
      });
      log.info("Used the " + shortener.title + " URL shortener");
      return analytics.track('Shorteners', 'Used', shortener.title, Number(oauth));
    }
  };

  AppError = (function(_super) {
    __extends(AppError, _super);

    function AppError() {
      var messageKey, substitutions;

      messageKey = arguments[0], substitutions = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      Error.call(this, messageKey ? i18n.get(messageKey, substitutions) : void 0);
    }

    return AppError;

  })(Error);

  addAdditionalData = function(tab, data, id, editable, shortcut, link, callback) {
    log.trace();
    return async.parallel([
      function(done) {
        return chrome.tabs.query({
          windowId: tab.windowId
        }, function(tabs) {
          log.debug('Extracting the URLs from the following tabs...', tabs);
          tabs = _.pluck(tabs, 'url');
          return done(null, {
            tabs: tabs
          });
        });
      }, function(done) {
        return chrome.tabs.detectLanguage(tab.id, function(locale) {
          log.debug("Chrome automatically detected language: " + locale);
          if (!(locale && locale !== UNKNOWN_LOCALE)) {
            locale = '';
          }
          return done(null, {
            locale: locale
          });
        });
      }, function(done) {
        var coords;

        coords = {};
        return navigator.geolocation.getCurrentPosition(function(position) {
          var prop, value, _ref;

          log.debug('Retrieved the following geolocation information...', position);
          _ref = position.coords;
          for (prop in _ref) {
            if (!__hasProp.call(_ref, prop)) continue;
            value = _ref[prop];
            coords[prop.toLowerCase()] = value != null ? "" + value : '';
          }
          return done(null, {
            coords: coords
          });
        }, function(err) {
          log.warn('Ingoring error thrown when calculating geolocation', err.message);
          return done(null, {
            coords: coords
          });
        });
      }, function(done) {
        return chrome.cookies.getAll({
          url: data.url
        }, function(cookies) {
          if (cookies == null) {
            cookies = [];
          }
          log.debug('Found the following cookies...', cookies);
          return done(null, {
            cookie: function() {
              return function(text, render) {
                var cookie, name;

                name = render(text);
                cookie = _.findWhere(cookies, {
                  name: name
                });
                return (cookie != null ? cookie.value : void 0) || '';
              };
            },
            cookies: _.chain(cookies).pluck('name').uniq().value()
          });
        });
      }, function(done) {
        if (isProtectedPage(tab)) {
          return done();
        }
        return chrome.tabs.sendMessage(tab.id, {
          editable: editable,
          id: id,
          link: link,
          shortcut: shortcut,
          url: data.url
        }, function(response) {
          var lastModified, time, _ref, _ref1, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref16, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;

          log.debug('The following data was retrieved from the content script...', response);
          if (response == null) {
            response = {};
          }
          lastModified = response.lastModified != null ? (time = Date.parse(response.lastModified), !isNaN(time) ? new Date(time) : void 0) : void 0;
          return done(null, {
            author: (_ref = response.author) != null ? _ref : '',
            characterset: (_ref1 = response.characterSet) != null ? _ref1 : '',
            description: (_ref2 = response.description) != null ? _ref2 : '',
            images: (_ref3 = response.images) != null ? _ref3 : [],
            keywords: (_ref4 = response.keywords) != null ? _ref4 : [],
            lastmodified: function() {
              return function(text, render) {
                var _ref5;

                return (_ref5 = lastModified != null ? lastModified.format(render(text) || void 0) : void 0) != null ? _ref5 : '';
              };
            },
            linkhtml: (_ref5 = response.linkHTML) != null ? _ref5 : '',
            links: (_ref6 = response.links) != null ? _ref6 : [],
            linktext: (_ref7 = response.linkText) != null ? _ref7 : '',
            pageheight: (_ref8 = response.pageHeight) != null ? _ref8 : '',
            pagewidth: (_ref9 = response.pageWidth) != null ? _ref9 : '',
            referrer: (_ref10 = response.referrer) != null ? _ref10 : '',
            scripts: (_ref11 = response.scripts) != null ? _ref11 : [],
            selectedimages: (_ref12 = response.selectedImages) != null ? _ref12 : [],
            selectedlinks: (_ref13 = response.selectedLinks) != null ? _ref13 : [],
            selection: (_ref14 = response.selection) != null ? _ref14 : '',
            selectionhtml: (_ref15 = response.selectionHTML) != null ? _ref15 : '',
            selectionlinks: function() {
              return this.selectedlinks;
            },
            stylesheets: (_ref16 = response.styleSheets) != null ? _ref16 : []
          });
        });
      }
    ], function(err, results) {
      var result, _i, _len;

      if (results == null) {
        results = [];
      }
      if (err) {
        log.error(err);
      }
      for (_i = 0, _len = results.length; _i < _len; _i++) {
        result = results[_i];
        if (result != null) {
          $.extend(data, result);
        }
      }
      return callback();
    });
  };

  buildDerivedData = function(tab, onClickData, getCallback) {
    var fakeTab, info;

    log.trace();
    info = {
      editable: onClickData.editable,
      link: false
    };
    fakeTab = {
      title: tab.title,
      url: onClickData.linkUrl ? (info.link = true, onClickData.linkUrl) : onClickData.srcUrl ? onClickData.srcUrl : onClickData.frameUrl ? onClickData.frameUrl : onClickData.pageUrl
    };
    info.data = buildStandardData(fakeTab, getCallback);
    return info;
  };

  buildStandardData = function(tab, getCallback) {
    var anchor, bitly, ctab, data, extension, googl, handler, menu, notifications, shortcuts, stats, toolbar, url, yourls;

    log.trace();
    ctab = $.extend({}, tab);
    for (extension in SUPPORT) {
      if (!__hasProp.call(SUPPORT, extension)) continue;
      handler = SUPPORT[extension];
      if (!(isExtensionActive(tab, extension))) {
        continue;
      }
      log.debug("Making data compatible with " + extension);
      if (typeof handler === "function") {
        handler(ctab);
      }
      break;
    }
    data = {};
    url = $.url(ctab.url);
    anchor = store.get('anchor');
    bitly = store.get('bitly');
    googl = store.get('googl');
    menu = store.get('menu');
    notifications = store.get('notifications');
    shortcuts = store.get('shortcuts');
    stats = store.get('stats');
    toolbar = store.get('toolbar');
    yourls = store.get('yourls');
    $.extend(data, url.attr(), {
      anchortarget: anchor.target,
      anchortitle: anchor.title,
      bitly: bitly.enabled,
      bitlyaccount: function() {
        return _.findWhere(SHORTENERS, {
          name: 'bitly'
        }).oauth.hasAccessToken();
      },
      browser: browser.title,
      browserversion: browser.version,
      capitalise: function() {
        return this.capitalize();
      },
      capitalize: function() {
        return function(text, render) {
          return utils.capitalize(render(text));
        };
      },
      contextmenu: function() {
        return this.menu;
      },
      cookiesenabled: navigator.cookieEnabled,
      count: stats.count,
      customcount: stats.customCount,
      datetime: function() {
        return function(text, render) {
          var _ref;

          return (_ref = new Date().format(render(text) || void 0)) != null ? _ref : '';
        };
      },
      decode: function() {
        return function(text, render) {
          var _ref;

          return (_ref = decodeURIComponent(render(text))) != null ? _ref : '';
        };
      },
      depth: screen.colorDepth,
      doanchortarget: function() {
        return this.anchortarget;
      },
      doanchortitle: function() {
        return this.anchortitle;
      },
      encode: function() {
        return function(text, render) {
          var _ref;

          return (_ref = encodeURIComponent(render(text))) != null ? _ref : '';
        };
      },
      encoded: function() {
        return encodeURIComponent(this.url);
      },
      escape: function() {
        return function(text, render) {
          return _.escape(render(text));
        };
      },
      favicon: ctab.favIconUrl,
      fparam: function() {
        return function(text, render) {
          var _ref;

          return (_ref = url.fparam(render(text))) != null ? _ref : '';
        };
      },
      fparams: nullIfEmpty(url.fparam()),
      fsegment: function() {
        return function(text, render) {
          var _ref;

          return (_ref = url.fsegment(parseInt(render(text), 10))) != null ? _ref : '';
        };
      },
      fsegments: url.fsegment(),
      googl: googl.enabled,
      googlaccount: function() {
        return _.findWhere(SHORTENERS, {
          name: 'googl'
        }).oauth.hasAccessToken();
      },
      googloauth: function() {
        return this.googlaccount();
      },
      java: navigator.javaEnabled(),
      length: function() {
        return function(text, render) {
          return render(text).length;
        };
      },
      linkmarkdown: function() {
        return md(this.linkhtml);
      },
      lowercase: function() {
        return function(text, render) {
          return render(text).toLowerCase();
        };
      },
      menu: menu.enabled,
      menuoptions: menu.options,
      menupaste: menu.paste,
      notifications: notifications.enabled,
      notificationduration: notifications.duration * .001,
      offline: !navigator.onLine,
      originalsource: function() {
        return this.originalurl;
      },
      originaltitle: tab.title || url.attr('source'),
      originalurl: tab.url,
      os: operatingSystem,
      param: function() {
        return function(text, render) {
          var _ref;

          return (_ref = url.param(render(text))) != null ? _ref : '';
        };
      },
      params: nullIfEmpty(url.param()),
      plugins: _.chain(navigator.plugins).pluck('name').uniq().value(),
      popular: _.findWhere(ext.templates, {
        key: stats.popular
      }),
      screenheight: screen.height,
      screenwidth: screen.width,
      segment: function() {
        return function(text, render) {
          var _ref;

          return (_ref = url.segment(parseInt(render(text), 10))) != null ? _ref : '';
        };
      },
      segments: url.segment(),
      select: function() {
        return getCallback('select');
      },
      selectall: function() {
        return getCallback('selectall');
      },
      selectallhtml: function() {
        return getCallback('selectallhtml');
      },
      selectallmarkdown: function() {
        return getCallback('selectallmarkdown');
      },
      selecthtml: function() {
        return getCallback('selecthtml');
      },
      selectionmarkdown: function() {
        return md(this.selectionhtml);
      },
      selectmarkdown: function() {
        return getCallback('selectmarkdown');
      },
      short: function() {
        return this.shorten();
      },
      shortcuts: shortcuts.enabled,
      shortcutspaste: shortcuts.paste,
      shorten: function() {
        return getCallback('shorten');
      },
      tidy: function() {
        return function(text, render) {
          return render(text).replace(/([ \t]+)/g, ' ').trim();
        };
      },
      title: ctab.title || url.attr('source'),
      toolbarclose: toolbar.close,
      toolbarfeature: function() {
        return !this.toolbarpopup;
      },
      toolbarfeaturedetails: function() {
        return this.toolbarstyle;
      },
      toolbarfeaturename: function() {
        return this.toolbarkey;
      },
      toolbarkey: toolbar.key,
      toolbaroptions: toolbar.options,
      toolbarpopup: toolbar.popup,
      toolbarstyle: false,
      trim: function() {
        return function(text, render) {
          return render(text).trim();
        };
      },
      trimleft: function() {
        return function(text, render) {
          return render(text).trimLeft();
        };
      },
      trimright: function() {
        return function(text, render) {
          return render(text).trimRight();
        };
      },
      unescape: function() {
        return function(text, render) {
          return _.unescape(render(text));
        };
      },
      uppercase: function() {
        return function(text, render) {
          return render(text).toUpperCase();
        };
      },
      url: url.attr('source'),
      version: ext.version,
      xpath: function() {
        return getCallback('xpath');
      },
      xpathall: function() {
        return getCallback('xpathall');
      },
      xpathallhtml: function() {
        return getCallback('xpathallhtml');
      },
      xpathallmarkdown: function() {
        return getCallback('xpathallmarkdown');
      },
      xpathhtml: function() {
        return getCallback('xpathhtml');
      },
      xpathmarkdown: function() {
        return getCallback('xpathmarkdown');
      },
      yourls: yourls.enabled,
      yourlsauthentication: yourls.authentication,
      yourlspassword: yourls.password,
      yourlssignature: yourls.signature,
      yourlsurl: yourls.url,
      yourlsusername: yourls.username
    });
    return data;
  };

  deriveMessageInfo = function(message, tab, getCallback) {
    var info;

    log.trace();
    info = {
      data: null,
      editable: false,
      link: false,
      shortcut: false
    };
    return $.extend(info, (function() {
      switch (message.type) {
        case 'menu':
          return buildDerivedData(tab, message.data, getCallback);
        case 'popup':
        case 'toolbar':
          return {
            data: buildStandardData(tab, getCallback)
          };
        case 'shortcut':
          return {
            data: buildStandardData(tab, getCallback),
            shortcut: true
          };
        default:
          throw new AppError('result_bad_type_description');
      }
    })());
  };

  deriveMessageTempate = function(message) {
    var template;

    log.trace();
    template = (function() {
      switch (message.type) {
        case 'menu':
          return getTemplateWithMenuId(message.data.menuItemId);
        case 'popup':
        case 'toolbar':
          return getTemplateWithKey(message.data.key);
        case 'shortcut':
          return getTemplateWithShortcut(message.data.key);
        default:
          throw new AppError('result_bad_type_description');
      }
    })();
    if (template == null) {
      throw new AppError('result_bad_template_description');
    }
    return template;
  };

  evaluateExpressions = function(tab, map, callback) {
    var placeholder;

    log.trace();
    if (isProtectedPage(tab)) {
      for (placeholder in map) {
        if (!__hasProp.call(map, placeholder)) continue;
        map[placeholder] = '';
      }
      return callback();
    }
    return chrome.tabs.sendMessage(tab.id, {
      expressions: map
    }, function(response) {
      var convertTo, error, expression, result, _ref;

      log.debug('The following response was returned by the content script...', response);
      _ref = response.expressions;
      for (placeholder in _ref) {
        if (!__hasProp.call(_ref, placeholder)) continue;
        expression = _ref[placeholder];
        convertTo = expression.convertTo, error = expression.error, result = expression.result;
        if (error) {
          break;
        }
        result || (result = '');
        if (_.isArray(result)) {
          result = result.join('\n');
        }
        if (convertTo === 'markdown') {
          result = md(result);
        }
        map[placeholder] = result;
      }
      return callback(error ? new AppError('result_bad_xpath_description') : void 0);
    });
  };

  transformData = function(data, deleteOld) {
    var prop, value, _results;

    log.trace();
    _results = [];
    for (prop in data) {
      if (!__hasProp.call(data, prop)) continue;
      value = data[prop];
      if (!(R_UPPER_CASE.test(prop))) {
        continue;
      }
      data[prop.toLowerCase()] = value;
      if (deleteOld) {
        _results.push(delete data[prop]);
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  buildConfig = function() {
    log.trace();
    return buildIcons();
  };

  buildIcons = function() {
    var i, name, _i, _len, _ref, _results;

    log.trace();
    _ref = ext.config.icons.current;
    _results = [];
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      name = _ref[i];
      _results.push(ext.config.icons.current[i] = new Icon(name));
    }
    return _results;
  };

  buildPopup = function() {
    var anchor, items, message, template, _i, _len, _ref;

    log.trace();
    items = $();
    _ref = ext.templates;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      template = _ref[_i];
      if (template.enabled) {
        items = items.add(buildTemplate(template));
      }
    }
    if (!items.length) {
      message = " " + (i18n.get('empty'));
      items = items.add($('<li/>', {
        "class": 'empty'
      }).append($('<i/>', {
        "class": 'icon-'
      })).append(message));
    }
    if (store.get('toolbar.options')) {
      anchor = $('<a/>', {
        "class": 'options',
        'data-type': 'options'
      });
      anchor.append($('<i/>', {
        "class": Icon.get('cog').style
      }));
      anchor.append(" " + (i18n.get('options')));
      items = items.add($('<li/>', {
        "class": 'divider'
      }));
      items = items.add($('<li/>').append(anchor));
    }
    return ext.templatesHtml = $('<div/>').append(items).html();
  };

  buildTemplate = function(template) {
    var anchor;

    log.trace();
    log.debug("Creating popup list item for the " + template.title + " template");
    anchor = $('<a/>', {
      'data-key': template.key,
      'data-type': 'popup'
    });
    if (template.shortcut && store.get('shortcuts.enabled')) {
      anchor.append($('<span/>', {
        "class": 'pull-right',
        html: "" + (ext.modifiers()) + template.shortcut
      }));
    }
    anchor.append($('<i/>', {
      "class": Icon.get(template.image, true).style
    }));
    anchor.append(" " + template.title);
    return $('<li/>').append(anchor);
  };

  init_update = function() {
    var updater;

    log.trace();
    if (store.exists('update_progress')) {
      store.modify('updates', function(updates) {
        var namespace, versions, _ref, _results;

        _ref = store.remove('update_progress');
        _results = [];
        for (namespace in _ref) {
          if (!__hasProp.call(_ref, namespace)) continue;
          versions = _ref[namespace];
          _results.push(updates[namespace] = (versions != null ? versions.length : void 0) ? versions.pop() : '');
        }
        return _results;
      });
    }
    updater = new store.Updater('settings');
    updater.on('update', function(version) {
      return log.info("Updating general settings for " + version);
    });
    isNewInstall = updater.isNew;
    updater.update('0.1.0.0', function() {
      store.rename('settingNotification', 'notifications', true);
      store.rename('settingNotificationTimer', 'notificationDuration', 3000);
      store.rename('settingShortcut', 'shortcuts', true);
      store.rename('settingTargetAttr', 'doAnchorTarget', false);
      store.rename('settingTitleAttr', 'doAnchorTitle', false);
      return store.remove('settingIeTabExtract', 'settingIeTabTitle');
    });
    updater.update('1.0.0', function() {
      var optionsActiveTab, _ref, _ref1;

      if (store.exists('options_active_tab')) {
        optionsActiveTab = store.get('options_active_tab');
        store.set('options_active_tab', (function() {
          switch (optionsActiveTab) {
            case 'features_nav':
              return 'templates_nav';
            case 'toolbar_nav':
              return 'general_nav';
            default:
              return optionsActiveTab;
          }
        })());
      }
      store.modify('anchor', function(anchor) {
        var _ref, _ref1;

        anchor.target = (_ref = store.get('doAnchorTarget')) != null ? _ref : false;
        return anchor.title = (_ref1 = store.get('doAnchorTitle')) != null ? _ref1 : false;
      });
      store.remove('doAnchorTarget', 'doAnchorTitle');
      store.modify('menu', function(menu) {
        var _ref;

        return menu.enabled = (_ref = store.get('contextMenu')) != null ? _ref : true;
      });
      store.remove('contextMenu');
      store.set('notifications', {
        duration: (_ref = store.get('notificationDuration')) != null ? _ref : 3000,
        enabled: (_ref1 = store.get('notifications')) != null ? _ref1 : true
      });
      return store.remove('notificationDuration');
    });
    updater.update('1.1.0', function() {
      var _ref;

      return store.set('shortcuts', {
        enabled: (_ref = store.get('shortcuts')) != null ? _ref : true
      });
    });
    return updater.update('1.2.3', function() {
      store.modify('anchor', function(anchor) {
        delete anchor.Target;
        return delete anchor.Title;
      });
      store.modify('logger', function(logger) {
        delete logger.Enabled;
        return delete logger.Level;
      });
      store.modify('menu', function(menu) {
        delete menu.Enabled;
        delete menu.Options;
        return delete menu.Paste;
      });
      store.modify('notifications', function(notifications) {
        delete notifications.Duration;
        return delete notifications.Enabled;
      });
      store.modify('shortcuts', function(shortcuts) {
        delete shortcuts.Enabled;
        return delete shortcuts.Paste;
      });
      return store.modify('toolbar', function(toolbar) {
        delete toolbar.Close;
        delete toolbar.Key;
        return delete toolbar.Options;
      });
    });
  };

  initStatistics = function() {
    log.trace();
    return updateStatistics();
  };

  initTemplate = function(template, templates) {
    var idx, _base, _base1, _base10, _base11, _base12, _base2, _base3, _base4, _base5, _base6, _base7, _base8, _base9, _ref, _ref1, _ref10, _ref11, _ref12, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;

    log.trace();
    idx = templates.indexOf(_.findWhere(templates, {
      key: template.key
    }));
    if (idx === -1) {
      log.debug('Adding the following predefined template...', template);
      templates.push(template);
    } else {
      log.debug('Ensuring following template adheres to structure...', template);
      if (template.readOnly) {
        templates[idx].content = template.content;
        if ((_ref = (_base = templates[idx]).enabled) == null) {
          _base.enabled = template.enabled;
        }
        if ((_ref1 = (_base1 = templates[idx]).image) == null) {
          _base1.image = template.image;
        }
        if ((_ref2 = (_base2 = templates[idx]).index) == null) {
          _base2.index = template.index;
        }
        templates[idx].key = template.key;
        templates[idx].readOnly = true;
        if ((_ref3 = (_base3 = templates[idx]).shortcut) == null) {
          _base3.shortcut = template.shortcut;
        }
        templates[idx].title = template.title;
        if ((_ref4 = (_base4 = templates[idx]).usage) == null) {
          _base4.usage = template.usage;
        }
      } else {
        if ((_ref5 = (_base5 = templates[idx]).content) == null) {
          _base5.content = '';
        }
        if ((_ref6 = (_base6 = templates[idx]).enabled) == null) {
          _base6.enabled = true;
        }
        if ((_ref7 = (_base7 = templates[idx]).image) == null) {
          _base7.image = '';
        }
        if ((_ref8 = (_base8 = templates[idx]).index) == null) {
          _base8.index = 0;
        }
        if ((_ref9 = (_base9 = templates[idx]).key) == null) {
          _base9.key = template.key;
        }
        templates[idx].readOnly = false;
        if ((_ref10 = (_base10 = templates[idx]).shortcut) == null) {
          _base10.shortcut = '';
        }
        if ((_ref11 = (_base11 = templates[idx]).title) == null) {
          _base11.title = '?';
        }
        if ((_ref12 = (_base12 = templates[idx]).usage) == null) {
          _base12.usage = 0;
        }
      }
      template = templates[idx];
    }
    return template;
  };

  initTemplates = function() {
    log.trace();
    initTemplates_update();
    store.modify('templates', function(templates) {
      var template, _i, _j, _len, _len1, _results;

      for (_i = 0, _len = DEFAULT_TEMPLATES.length; _i < _len; _i++) {
        template = DEFAULT_TEMPLATES[_i];
        initTemplate(template, templates);
      }
      _results = [];
      for (_j = 0, _len1 = templates.length; _j < _len1; _j++) {
        template = templates[_j];
        _results.push(initTemplate(template, templates));
      }
      return _results;
    });
    return ext.updateTemplates();
  };

  initTemplates_update = function() {
    var updater;

    log.trace();
    updater = new store.Updater('features');
    updater.on('update', function(version) {
      return log.info("Updating template settings for " + version);
    });
    updater.rename('templates');
    updater.update('0.1.0.0', function() {
      store.rename('copyAnchorEnabled', 'feat__anchor_enabled', true);
      store.rename('copyAnchorOrder', 'feat__anchor_index', 2);
      store.rename('copyBBCodeEnabled', 'feat__bbcode_enabled', false);
      store.rename('copyBBCodeOrder', 'feat__bbcode_index', 4);
      store.rename('copyEncodedEnabled', 'feat__encoded_enabled', true);
      store.rename('copyEncodedOrder', 'feat__encoded_index', 3);
      store.rename('copyShortEnabled', 'feat__short_enabled', true);
      store.rename('copyShortOrder', 'feat__short_index', 1);
      store.rename('copyUrlEnabled', 'feat__url_enabled', true);
      return store.rename('copyUrlOrder', 'feat__url_index', 0);
    });
    updater.update('0.2.0.0', function() {
      var i, image, legacy, name, names, _i, _len, _ref, _results;

      names = (_ref = store.get('features')) != null ? _ref : [];
      _results = [];
      for (_i = 0, _len = names.length; _i < _len; _i++) {
        name = names[_i];
        if (!(_.isString(name))) {
          continue;
        }
        store.rename("feat_" + name + "_template", "feat_" + name + "_content");
        image = store.get("feat_" + name + "_image");
        if (_.isString(image)) {
          if (image === '' || image === 'spacer.gif' || image === 'spacer.png') {
            _results.push(store.set("feat_" + name + "_image", 0));
          } else {
            _results.push((function() {
              var _j, _len1, _ref1, _results1;

              _ref1 = ext.config.icons.legacy;
              _results1 = [];
              for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
                legacy = _ref1[i];
                if (("" + (legacy.name.replace(/^tmpl/, 'feat')) + ".png") === image) {
                  store.set("feat_" + name + "_image", i + 1);
                  break;
                } else {
                  _results1.push(void 0);
                }
              }
              return _results1;
            })());
          }
        } else {
          _results.push(store.set("feat_" + name + "_image", 0));
        }
      }
      return _results;
    });
    updater.update('1.0.0', function() {
      var image, key, name, names, templates, toolbarFeatureName, _i, _len, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;

      names = (_ref = store.remove('features')) != null ? _ref : [];
      templates = [];
      toolbarFeatureName = store.get('toolbarFeatureName');
      for (_i = 0, _len = names.length; _i < _len; _i++) {
        name = names[_i];
        if (!(_.isString(name))) {
          continue;
        }
        image = (_ref1 = store.remove("feat_" + name + "_image")) != null ? _ref1 : 0;
        image = --image >= 0 ? ((_ref2 = Icon.fromLegacy(image)) != null ? _ref2.name : void 0) || '' : '';
        key = ext.getKeyForName(name);
        if (toolbarFeatureName === name) {
          if (store.exists('toolbar')) {
            store.modify('toolbar', function(toolbar) {
              return toolbar.key = key;
            });
          } else {
            store.set('toolbar', {
              key: key
            });
          }
        }
        templates.push({
          content: (_ref3 = store.remove("feat_" + name + "_content")) != null ? _ref3 : '',
          enabled: (_ref4 = store.remove("feat_" + name + "_enabled")) != null ? _ref4 : true,
          image: image,
          index: (_ref5 = store.remove("feat_" + name + "_index")) != null ? _ref5 : 0,
          key: key,
          readOnly: (_ref6 = store.remove("feat_" + name + "_readonly")) != null ? _ref6 : false,
          shortcut: (_ref7 = store.remove("feat_" + name + "_shortcut")) != null ? _ref7 : '',
          title: (_ref8 = store.remove("feat_" + name + "_title")) != null ? _ref8 : '?',
          usage: 0
        });
      }
      store.set('templates', templates);
      return store.remove.apply(store, store.search(/^feat_.*_(content|enabled|image|index|readonly|shortcut|title)$/));
    });
    return updater.update('1.1.0', function() {
      return store.modify('templates', function(templates) {
        var base, template, _i, _j, _len, _len1, _ref, _results;

        _results = [];
        for (_i = 0, _len = templates.length; _i < _len; _i++) {
          template = templates[_i];
          if (template.readOnly) {
            for (_j = 0, _len1 = DEFAULT_TEMPLATES.length; _j < _len1; _j++) {
              base = DEFAULT_TEMPLATES[_j];
              if (base.key === template.key) {
                break;
              }
            }
            _results.push(template.image = (function() {
              var _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;

              switch (template.key) {
                case 'PREDEFINED.00001':
                  if (template.image === 'tmpl_globe') {
                    return base.image;
                  } else {
                    return ((_ref = Icon.fromLegacy(template.image)) != null ? _ref.name : void 0) || '';
                  }
                  break;
                case 'PREDEFINED.00002':
                  if (template.image === 'tmpl_link') {
                    return base.image;
                  } else {
                    return ((_ref1 = Icon.fromLegacy(template.image)) != null ? _ref1.name : void 0) || '';
                  }
                  break;
                case 'PREDEFINED.00003':
                  if (template.image === 'tmpl_html') {
                    return base.image;
                  } else {
                    return ((_ref2 = Icon.fromLegacy(template.image)) != null ? _ref2.name : void 0) || '';
                  }
                  break;
                case 'PREDEFINED.00004':
                  if (template.image === 'tmpl_component') {
                    return base.image;
                  } else {
                    return ((_ref3 = Icon.fromLegacy(template.image)) != null ? _ref3.name : void 0) || '';
                  }
                  break;
                case 'PREDEFINED.00005':
                  if (template.image === 'tmpl_discussion') {
                    return base.image;
                  } else {
                    return ((_ref4 = Icon.fromLegacy(template.image)) != null ? _ref4.name : void 0) || '';
                  }
                  break;
                case 'PREDEFINED.00006':
                  if (template.image === 'tmpl_discussion') {
                    return base.image;
                  } else {
                    return ((_ref5 = Icon.fromLegacy(template.image)) != null ? _ref5.name : void 0) || '';
                  }
                  break;
                case 'PREDEFINED.00007':
                  if (template.image === 'tmpl_note') {
                    return base.image;
                  } else {
                    return ((_ref6 = Icon.fromLegacy(template.image)) != null ? _ref6.name : void 0) || '';
                  }
                  break;
                default:
                  return base.image;
              }
            })());
          } else {
            _results.push(template.image = ((_ref = Icon.fromLegacy(template.image)) != null ? _ref.name : void 0) || '');
          }
        }
        return _results;
      });
    });
  };

  initToolbar = function() {
    log.trace();
    initToolbar_update();
    store.modify('toolbar', function(toolbar) {
      var _ref, _ref1, _ref2, _ref3;

      if ((_ref = toolbar.close) == null) {
        toolbar.close = true;
      }
      if ((_ref1 = toolbar.key) == null) {
        toolbar.key = 'PREDEFINED.00001';
      }
      if ((_ref2 = toolbar.options) == null) {
        toolbar.options = true;
      }
      return (_ref3 = toolbar.popup) != null ? _ref3 : toolbar.popup = true;
    });
    return ext.updateToolbar();
  };

  initToolbar_update = function() {
    var updater;

    log.trace();
    updater = new store.Updater('toolbar');
    updater.on('update', function(version) {
      return log.info("Updating toolbar settings for " + version);
    });
    updater.update('1.0.0', function() {
      store.modify('toolbar', function(toolbar) {
        var _ref, _ref1;

        toolbar.popup = (_ref = store.get('toolbarPopup')) != null ? _ref : true;
        return toolbar.style = (_ref1 = store.get('toolbarFeatureDetails')) != null ? _ref1 : false;
      });
      return store.remove('toolbarFeature', 'toolbarFeatureDetails', 'toolbarFeatureName', 'toolbarPopup');
    });
    return updater.update('1.1.0', function() {
      return store.modify('toolbar', function(toolbar) {
        return delete toolbar.style;
      });
    });
  };

  initUrlShorteners = function() {
    log.trace();
    store.init({
      bitly: {},
      googl: {},
      yourls: {}
    });
    initUrlShorteners_update();
    store.modify('bitly', function(bitly) {
      var _ref, _ref1;

      if ((_ref = bitly.enabled) == null) {
        bitly.enabled = true;
      }
      return (_ref1 = bitly.usage) != null ? _ref1 : bitly.usage = 0;
    });
    store.modify('googl', function(googl) {
      var _ref, _ref1;

      if ((_ref = googl.enabled) == null) {
        googl.enabled = false;
      }
      return (_ref1 = googl.usage) != null ? _ref1 : googl.usage = 0;
    });
    return store.modify('yourls', function(yourls) {
      var _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;

      if ((_ref = yourls.authentication) == null) {
        yourls.authentication = '';
      }
      if ((_ref1 = yourls.enabled) == null) {
        yourls.enabled = false;
      }
      if ((_ref2 = yourls.password) == null) {
        yourls.password = '';
      }
      if ((_ref3 = yourls.signature) == null) {
        yourls.signature = '';
      }
      if ((_ref4 = yourls.url) == null) {
        yourls.url = '';
      }
      if ((_ref5 = yourls.username) == null) {
        yourls.username = '';
      }
      return (_ref6 = yourls.usage) != null ? _ref6 : yourls.usage = 0;
    });
  };

  initUrlShorteners_update = function() {
    var updater;

    log.trace();
    updater = new store.Updater('shorteners');
    updater.on('update', function(version) {
      return log.info("Updating URL shortener settings for " + version);
    });
    updater.update('0.1.0.0', function() {
      store.rename('bitlyEnabled', 'bitly', true);
      store.rename('bitlyXApiKey', 'bitlyApiKey', '');
      store.rename('bitlyXLogin', 'bitlyUsername', '');
      store.rename('googleEnabled', 'googl', false);
      return store.rename('googleOAuthEnabled', 'googlOAuth', true);
    });
    updater.update('1.0.0', function() {
      var bitly, googl, yourls, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;

      bitly = store.get('bitly');
      store.set('bitly', {
        apiKey: (_ref = store.get('bitlyApiKey')) != null ? _ref : '',
        enabled: _.isBoolean(bitly) ? bitly : true,
        username: (_ref1 = store.get('bitlyUsername')) != null ? _ref1 : ''
      });
      store.remove('bitlyApiKey', 'bitlyUsername');
      googl = store.get('googl');
      store.set('googl', {
        enabled: _.isBoolean(googl) ? googl : false
      });
      store.remove('googlOAuth');
      yourls = store.get('yourls');
      store.set('yourls', {
        enabled: _.isBoolean(yourls) ? yourls : false,
        password: (_ref2 = store.get('yourlsPassword')) != null ? _ref2 : '',
        signature: (_ref3 = store.get('yourlsSignature')) != null ? _ref3 : '',
        url: (_ref4 = store.get('yourlsUrl')) != null ? _ref4 : '',
        username: (_ref5 = store.get('yourlsUsername')) != null ? _ref5 : ''
      });
      return store.remove('yourlsPassword', 'yourlsSignature', 'yourlsUrl', 'yourlsUsername');
    });
    updater.update('1.0.1', function() {
      store.modify('bitly', function(bitly) {
        delete bitly.apiKey;
        return delete bitly.username;
      });
      store.modify('yourls', function(yourls) {
        return yourls.authentication = yourls.signature ? 'advanced' : yourls.password && yourls.username ? 'basic' : '';
      });
      return store.remove.apply(store, store.search(/^oauth_token.*/));
    });
    return updater.update('1.2.3', function() {
      return store.modify('yourls', function(yourls) {
        delete yourls.Password;
        delete yourls.Signature;
        delete yourls.Url;
        return delete yourls.Username;
      });
    });
  };

  callUrlShortener = function(map, callback) {
    var endpoint, oauth, service, tasks, title;

    log.trace();
    service = getActiveUrlShortener();
    endpoint = service.url();
    oauth = false;
    title = service.title;
    if (!endpoint) {
      return callback(new AppError('shortener_config_error', title));
    }
    tasks = [];
    _.each(map, function(url, placeholder) {
      var _ref;

      oauth = !!((_ref = service.oauth) != null ? _ref.hasAccessToken() : void 0);
      return tasks.push(function(done) {
        return async.series([
          function(done) {
            if (oauth) {
              return service.oauth.authorize(function() {
                return done();
              });
            } else {
              return done();
            }
          }, function(done) {
            var header, params, value, xhr, _ref1, _ref2;

            params = service.getParameters(url);
            if (params != null) {
              endpoint += "?" + ($.param(params));
            }
            xhr = new XMLHttpRequest();
            xhr.open(service.method, endpoint, true);
            _ref2 = (_ref1 = service.getHeaders()) != null ? _ref1 : {};
            for (header in _ref2) {
              if (!__hasProp.call(_ref2, header)) continue;
              value = _ref2[header];
              xhr.setRequestHeader(header, value);
            }
            xhr.onreadystatechange = function() {
              if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                  map[placeholder] = service.output(xhr.responseText);
                  return done();
                } else {
                  return done(new AppError('shortener_detailed_error', title, url));
                }
              }
            };
            return xhr.send(service.input(url));
          }
        ], done);
      });
    });
    return async.series(tasks, function(err) {
      if (err) {
        err.message || (err.message = i18n.get('shortener_error', service.title));
        return callback(err);
      } else {
        return callback(null, {
          oauth: oauth,
          service: service
        });
      }
    });
  };

  getActiveUrlShortener = function() {
    var shortener;

    log.trace();
    shortener = _.find(SHORTENERS, function(shortener) {
      return shortener.isEnabled();
    });
    if (shortener == null) {
      store.modify('bitly', function(bitly) {
        return bitly.enabled = true;
      });
      shortener = getActiveUrlShortener();
    }
    log.debug("Getting details for " + shortener.title + " URL shortener");
    return shortener;
  };

  ext = window.ext = new (Extension = (function(_super) {
    __extends(Extension, _super);

    function Extension() {
      _ref = Extension.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Extension.prototype.SHORTCUT_MODIFIERS = 'Ctrl+Alt+';

    Extension.prototype.SHORTCUT_MAC_MODIFIERS = '&#8679;&#8997;';

    Extension.prototype.config = {};

    Extension.prototype.notification = {
      description: '',
      descriptionStyle: '',
      html: '',
      icon: utils.url('../images/icon_48.png'),
      iconStyle: '',
      title: '',
      titleStyle: ''
    };

    Extension.prototype.shorteners = SHORTENERS;

    Extension.prototype.templates = [];

    Extension.prototype.templatesHtml = '';

    Extension.prototype.version = '';

    Extension.prototype.copy = function(str, hidden) {
      var sandbox;

      log.trace();
      sandbox = $('#sandbox').val(str).trigger('select');
      document.execCommand('copy');
      log.debug('Copied the following string...', str);
      sandbox.val('');
      if (!hidden) {
        return showNotification();
      }
    };

    Extension.prototype.getKeyForName = function(name, generate) {
      var key;

      if (generate == null) {
        generate = true;
      }
      log.trace();
      key = (function() {
        switch (name) {
          case '_url':
            return 'PREDEFINED.00001';
          case '_short':
            return 'PREDEFINED.00002';
          case '_anchor':
            return 'PREDEFINED.00003';
          case '_encoded':
            return 'PREDEFINED.00004';
          case '_bbcode':
            return 'PREDEFINED.00005';
          case '_markdown':
            return 'PREDEFINED.00006';
          default:
            if (generate) {
              return utils.keyGen();
            }
        }
      })();
      log.debug("Associating " + key + " key with " + name + " template");
      return key;
    };

    Extension.prototype.init = function() {
      var _this = this;

      log.trace();
      log.info('Initializing extension controller');
      if (store.get('analytics')) {
        analytics.add();
      }
      return $.getJSON(utils.url('configuration.json'), function(data) {
        var shortener, _i, _len;

        _this.config = data;
        buildConfig();
        _this.version = chrome.runtime.getManifest().version;
        for (_i = 0, _len = SHORTENERS.length; _i < _len; _i++) {
          shortener = SHORTENERS[_i];
          shortener.oauth = typeof shortener.oauth === "function" ? shortener.oauth() : void 0;
        }
        store.init({
          anchor: {},
          menu: {},
          notifications: {},
          shortcuts: {},
          stats: {},
          templates: [],
          toolbar: {}
        });
        init_update();
        store.modify('anchor', function(anchor) {
          var _ref1, _ref2;

          if ((_ref1 = anchor.target) == null) {
            anchor.target = false;
          }
          return (_ref2 = anchor.title) != null ? _ref2 : anchor.title = false;
        });
        store.modify('menu', function(menu) {
          var _ref1, _ref2, _ref3;

          if ((_ref1 = menu.enabled) == null) {
            menu.enabled = true;
          }
          if ((_ref2 = menu.options) == null) {
            menu.options = true;
          }
          return (_ref3 = menu.paste) != null ? _ref3 : menu.paste = false;
        });
        store.modify('notifications', function(notifications) {
          var _ref1, _ref2;

          if ((_ref1 = notifications.duration) == null) {
            notifications.duration = 3000;
          }
          return (_ref2 = notifications.enabled) != null ? _ref2 : notifications.enabled = true;
        });
        store.modify('shortcuts', function(shortcuts) {
          var _ref1, _ref2;

          if ((_ref1 = shortcuts.enabled) == null) {
            shortcuts.enabled = true;
          }
          return (_ref2 = shortcuts.paste) != null ? _ref2 : shortcuts.paste = false;
        });
        initTemplates();
        initToolbar();
        initStatistics();
        initUrlShorteners();
        chrome.browserAction.onClicked.addListener(function(tab) {
          return onMessage({
            data: {
              key: store.get('toolbar.key')
            },
            type: 'toolbar'
          });
        });
        chrome.extension.onMessage.addListener(onMessage);
        chrome.extension.onMessageExternal.addListener(onMessageExternal);
        browser.version = getBrowserVersion();
        operatingSystem = getOperatingSystem();
        if (isNewInstall) {
          analytics.track('Installs', 'New', _this.version, Number(isProductionBuild));
        }
        return executeScriptsInExistingWindows();
      });
    };

    Extension.prototype.isThisPlatform = function(os) {
      log.trace();
      return RegExp("" + os, "i").test(navigator.platform);
    };

    Extension.prototype.modifiers = function() {
      log.trace();
      if (this.isThisPlatform('mac')) {
        return this.SHORTCUT_MAC_MODIFIERS;
      } else {
        return this.SHORTCUT_MODIFIERS;
      }
    };

    Extension.prototype.paste = function() {
      var result, sandbox;

      log.trace();
      result = '';
      sandbox = $('#sandbox').val('').trigger('select');
      if (document.execCommand('paste')) {
        result = sandbox.val();
      }
      log.debug('Pasted the following string...', result);
      sandbox.val('');
      return result;
    };

    Extension.prototype.reset = function() {
      log.trace();
      return this.notification = {
        description: '',
        descriptionStyle: '',
        html: '',
        icon: utils.url('../images/icon_48.png'),
        iconStyle: '',
        title: '',
        titleStyle: ''
      };
    };

    Extension.prototype.updateContextMenu = function() {
      var _this = this;

      log.trace();
      return chrome.contextMenus.removeAll(function() {
        var menu, menuId, notEmpty, onMenuClick, parentId, template, _i, _len, _ref1;

        onMenuClick = function(info, tab) {
          return onMessage({
            data: info,
            type: 'menu'
          });
        };
        menu = store.get('menu');
        if (!menu.enabled) {
          return;
        }
        parentId = chrome.contextMenus.create({
          contexts: ['all'],
          title: i18n.get('name')
        });
        _ref1 = _this.templates;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          template = _ref1[_i];
          if (!template.enabled) {
            continue;
          }
          notEmpty = true;
          menuId = chrome.contextMenus.create({
            contexts: ['all'],
            onclick: onMenuClick,
            parentId: parentId,
            title: template.title
          });
          template.menuId = menuId;
        }
        if (!notEmpty) {
          chrome.contextMenus.create({
            contexts: ['all'],
            parentId: parentId,
            title: i18n.get('empty')
          });
        }
        if (menu.options) {
          chrome.contextMenus.create({
            contexts: ['all'],
            parentId: parentId,
            type: 'separator'
          });
          return chrome.contextMenus.create({
            contexts: ['all'],
            onclick: function(info, tab) {
              return onMessage({
                type: 'options'
              });
            },
            parentId: parentId,
            title: i18n.get('options')
          });
        }
      });
    };

    Extension.prototype.updateTemplates = function() {
      log.trace();
      this.templates = _.sortBy(store.get('templates'), 'index');
      buildPopup();
      this.updateContextMenu();
      updateStatistics();
      return updateHotkeys();
    };

    Extension.prototype.updateToolbar = function() {
      var key, template;

      log.trace();
      key = store.get('toolbar.key');
      if (key) {
        template = getTemplateWithKey(key);
      }
      buildPopup();
      if (!template || store.get('toolbar.popup')) {
        log.info('Configuring toolbar to display popup');
        return chrome.browserAction.setPopup({
          popup: 'pages/popup.html'
        });
      } else {
        log.info('Configuring toolbar to activate specified template');
        return chrome.browserAction.setPopup({
          popup: ''
        });
      }
    };

    return Extension;

  })(utils.Class));

  ext.Icon = Icon = (function(_super) {
    __extends(Icon, _super);

    function Icon(name) {
      this.name = name;
      this.message = i18n.get("icon_" + ((name != null ? name.replace(/-/g, '_') : void 0) || 'none'));
      this.style = "icon-" + (name || '');
    }

    return Icon;

  })(utils.Class);

  Icon.exists = function(name) {
    return Icon.get(name) != null;
  };

  Icon.get = function(name, safe) {
    var icon;

    icon = _.findWhere(ext.config.icons.current, {
      name: name
    });
    if ((icon == null) && safe) {
      return new Icon();
    } else {
      return icon;
    }
  };

  Icon.fromLegacy = function(name) {
    var legacy;

    legacy = (function() {
      switch (typeof name) {
        case 'number':
          return ext.config.icons.legacy[name];
        case 'string':
          return _.findWhere(ext.config.icons.legacy, {
            name: name
          });
      }
    })();
    if (legacy) {
      return Icon.get(legacy.icon);
    }
  };

  utils.ready(function() {
    return ext.init();
  });

}).call(this);
