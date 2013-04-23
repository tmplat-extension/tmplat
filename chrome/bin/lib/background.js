// [Template](http://neocotic.com/template)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/template>
(function() {
  var BLACKLIST, DEFAULT_TEMPLATES, EXTENSION_ID, Extension, HOMEPAGE_DOMAIN, OPERATING_SYSTEMS, POPUP_DELAY, REAL_EXTENSION_ID, R_SELECT_TAG, R_UPPER_CASE, R_VALID_URL, SHORTENERS, SUPPORT, addAdditionalData, browser, buildDerivedData, buildPopup, buildStandardData, buildTemplate, callUrlShortener, executeScriptsInExistingWindows, ext, getActiveUrlShortener, getBrowserVersion, getHotkeys, getOperatingSystem, getTemplateWithKey, getTemplateWithMenuId, getTemplateWithShortcut, initStatistics, initTemplate, initTemplates, initTemplates_update, initToolbar, initToolbar_update, initUrlShorteners, initUrlShorteners_update, init_update, isBlacklisted, isExtensionActive, isExtensionGallery, isNewInstall, isProductionBuild, isProtectedPage, isSpecialPage, nullIfEmpty, onMessage, operatingSystem, runSelectors, selectOrCreateTab, showNotification, transformData, updateHotkeys, updateProgress, updateStatistics, updateTemplateUsage, updateUrlShortenerUsage, _ref,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __slice = [].slice,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  String.prototype.capitalize = function() {
    return this.replace(/\w+/g, function(word) {
      return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
    });
  };

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
      content: "<a href=\"{{url}}\"{#anchorTarget} target=\"_blank\"{/anchorTarget}{#anchorTitle} title=\"{{title}}\"{/anchorTitle}>{{title}}</a>",
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

  R_SELECT_TAG = /^select(all)?(\S*)?$/;

  R_UPPER_CASE = /[A-Z]+/;

  R_VALID_URL = /^https?:\/\/\S+\.\S+/i;

  REAL_EXTENSION_ID = 'dcjnfaoifoefmnbhhlbppaebgnccfddf';

  SHORTENERS = [
    {
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
      method: 'GET',
      name: 'bitly',
      oauth: function() {
        return new OAuth2('bitly', {
          client_id: ext.config.services.bitly.client_id,
          client_secret: ext.config.services.bitly.client_secret
        });
      },
      output: function(resp) {
        return JSON.parse(resp).data.url;
      },
      title: i18n.get('shortener_bitly'),
      url: function() {
        return ext.config.services.bitly.url;
      }
    }, {
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
      method: 'POST',
      name: 'googl',
      oauth: function() {
        return new OAuth2('google', {
          api_scope: ext.config.services.googl.api_scope,
          client_id: ext.config.services.googl.client_id,
          client_secret: ext.config.services.googl.client_secret
        });
      },
      output: function(resp) {
        return JSON.parse(resp).id;
      },
      title: i18n.get('shortener_googl'),
      url: function() {
        return ext.config.services.googl.url;
      }
    }, {
      getHeaders: function() {
        return {
          'Content-Type': 'application/json'
        };
      },
      getParameters: function(url) {
        var params, yourls;

        params = {
          action: 'shorturl',
          format: 'json',
          url: url
        };
        yourls = store.get('yourls');
        switch (yourls.authentication) {
          case 'advanced':
            if (yourls.signature) {
              params.signature = yourls.signature;
            }
            break;
          case 'basic':
            if (yourls.password) {
              params.password = yourls.password;
            }
            if (yourls.username) {
              params.username = yourls.username;
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
      method: 'POST',
      name: 'yourls',
      output: function(resp) {
        return JSON.parse(resp).shorturl;
      },
      title: i18n.get('shortener_yourls'),
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
          if (tab.url.indexOf(str) === 0) {
            return tab.url = decodeURIComponent(tab.url.substring(str.length));
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
          if (tab.url.indexOf(str) === 0) {
            return tab.url = decodeURIComponent(tab.url.substring(str.length));
          }
        }
      }
    }
  };

  browser = {
    title: 'Chrome',
    version: ''
  };

  isNewInstall = false;

  isProductionBuild = EXTENSION_ID === REAL_EXTENSION_ID;

  operatingSystem = '';

  executeScriptsInExistingWindows = function() {
    log.trace();
    return chrome.windows.getAll({
      populate: true
    }, function(windows) {
      var tab, win, _i, _len, _results;

      log.info('Retrieved the following windows...', windows);
      _results = [];
      for (_i = 0, _len = windows.length; _i < _len; _i++) {
        win = windows[_i];
        log.info('Retrieved the following tabs...', win.tabs);
        _results.push((function() {
          var _j, _len1, _ref, _results1;

          _ref = win.tabs;
          _results1 = [];
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            tab = _ref[_j];
            if (!(!isProtectedPage(tab))) {
              continue;
            }
            chrome.tabs.executeScript(tab.id, {
              file: 'lib/content.js'
            });
            if (__indexOf.call(tab.url, HOMEPAGE_DOMAIN) >= 0) {
              _results1.push(chrome.tabs.executeScript(tab.id, {
                file: 'lib/install.js'
              }));
            } else {
              _results1.push(void 0);
            }
          }
          return _results1;
        })());
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
        return str.substring(0, idx);
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
    var os, str, _i, _len;

    log.trace();
    str = navigator.platform;
    for (_i = 0, _len = OPERATING_SYSTEMS.length; _i < _len; _i++) {
      os = OPERATING_SYSTEMS[_i];
      if (!(str.indexOf(os.substring) !== -1)) {
        continue;
      }
      str = os.title;
      break;
    }
    return str;
  };

  getTemplateWithKey = function(key) {
    log.trace();
    return ext.queryTemplate(function(template) {
      return template.key === key;
    });
  };

  getTemplateWithMenuId = function(menuId) {
    log.trace();
    return ext.queryTemplate(function(template) {
      return template.menuId === menuId;
    });
  };

  getTemplateWithShortcut = function(shortcut) {
    log.trace();
    return ext.queryTemplate(function(template) {
      return template.enabled && template.shortcut === shortcut;
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
    log.debug("Checking activity of " + extensionId);
    return isSpecialPage(tab) && tab.url.indexOf(extensionId) !== -1;
  };

  isExtensionGallery = function(tab) {
    log.trace();
    return tab.url.indexOf('https://chrome.google.com/webstore') === 0;
  };

  isProtectedPage = function(tab) {
    log.trace();
    return isSpecialPage(tab) || isExtensionGallery(tab);
  };

  isSpecialPage = function(tab) {
    log.trace();
    return !tab.url.indexOf('chrome');
  };

  nullIfEmpty = function(object) {
    log.trace();
    if ($.isEmptyObject(object)) {
      return null;
    } else {
      return object;
    }
  };

  onMessage = function(message, sender, sendResponse) {
    var active, data, editable, id, link, output, placeholders, shortcut, template, _ref, _ref1;

    log.trace();
    if (!message.type) {
      return typeof sendResponse === "function" ? sendResponse() : void 0;
    }
    if (message.type === 'shortcut' && !store.get('shortcuts.enabled')) {
      return typeof sendResponse === "function" ? sendResponse() : void 0;
    }
    if (message.type === 'options') {
      selectOrCreateTab(utils.url('pages/options.html'));
      if ((_ref = chrome.extension.getViews({
        type: 'popup'
      })[0]) != null) {
        _ref.close();
      }
      return typeof sendResponse === "function" ? sendResponse() : void 0;
    }
    if ((_ref1 = message.type) === 'info' || _ref1 === 'version') {
      return typeof sendResponse === "function" ? sendResponse({
        hotkeys: getHotkeys(),
        id: EXTENSION_ID,
        version: ext.version
      }) : void 0;
    }
    active = data = output = template = null;
    editable = link = shortcut = false;
    id = utils.keyGen('', null, 't', false);
    placeholders = {};
    return async.series([
      function(done) {
        return chrome.windows.getCurrent({
          populate: true
        }, function(win) {
          var tab, _i, _len, _ref2;

          log.info('Retrieved the following window...', win);
          log.info('Retrieved the following tabs...', win.tabs);
          _ref2 = win.tabs;
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            tab = _ref2[_i];
            if (!tab.active) {
              continue;
            }
            active = tab;
            break;
          }
          if (active == null) {
            active = _.first(win.tabs);
          }
          return done();
        });
      }, function(done) {
        var error, getCallback, msg, _ref2;

        getCallback = function(tag) {
          return function(text, render) {
            var key, placeholder, trim, val;

            if (text) {
              text = render(text);
            }
            if (tag === 'shorten' && !text) {
              text = this.url;
            }
            trim = text.trim();
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
          switch (message.type) {
            case 'menu':
              template = getTemplateWithMenuId(message.data.menuItemId);
              if (template != null) {
                _ref2 = buildDerivedData(active, message.data, getCallback), data = _ref2.data, editable = _ref2.editable, link = _ref2.link;
              }
              break;
            case 'popup':
            case 'toolbar':
              template = getTemplateWithKey(message.data.key);
              if (template != null) {
                data = buildStandardData(active, getCallback);
              }
              break;
            case 'shortcut':
              shortcut = true;
              template = getTemplateWithShortcut(message.data.key);
              if (template != null) {
                data = buildStandardData(active, getCallback);
              }
              break;
            default:
              return done(new Error(i18n.get('result_bad_type_description')));
          }
          if (template != null) {
            updateProgress(20);
            return done();
          } else {
            return done(new Error(i18n.get('result_bad_template_description')));
          }
        } catch (_error) {
          error = _error;
          msg = i18n.get(error instanceof URIError ? 'result_bad_uri_description' : 'result_bad_error_description');
          return done(new Error(msg));
        }
      }, function(done) {
        return addAdditionalData(active, data, id, editable, shortcut, link, function() {
          updateProgress(40);
          transformData(data);
          $.extend(data, {
            template: template
          });
          log.debug("Using the following data to render " + template.title + "...", data);
          if (template.content) {
            output = Mustache.to_html(template.content, data);
            log.debug('Following string is the rendered result...', output);
            updateProgress(60);
          }
          if (output == null) {
            output = '';
          }
          return done();
        });
      }, function(done) {
        var info, match, placeholder, selectMap, shortenMap;

        updateProgress(80);
        if (_.isEmpty(placeholders)) {
          return done();
        }
        selectMap = {};
        shortenMap = {};
        for (placeholder in placeholders) {
          if (!__hasProp.call(placeholders, placeholder)) continue;
          info = placeholders[placeholder];
          if (info.tag === 'shorten') {
            shortenMap[placeholder] = info.data;
          } else {
            match = info.tag.match(R_SELECT_TAG);
            selectMap[placeholder] = {
              all: match[1] != null,
              convertTo: match[2],
              selector: info.data
            };
          }
        }
        return async.series([
          function(done) {
            if (_.isEmpty(selectMap)) {
              done();
            }
            return runSelectors(active, selectMap, function() {
              var value;

              log.info('One or more selectors were executed');
              updateProgress(85);
              for (placeholder in selectMap) {
                if (!__hasProp.call(selectMap, placeholder)) continue;
                value = selectMap[placeholder];
                placeholders[placeholder] = value;
              }
              return done();
            });
          }, function(done) {
            if (_.isEmpty(shortenMap)) {
              done();
            }
            return callUrlShortener(shortenMap, function(err, response) {
              var value, _ref2;

              log.info('URL shortener service was called one or more times');
              updateProgress(90);
              if (err) {
                if ((_ref2 = err.message) == null) {
                  err.message = i18n.get('shortener_error', response.service.title);
                }
                return done(err);
              } else {
                updateUrlShortenerUsage(response.service.name, response.oauth);
                for (placeholder in shortenMap) {
                  if (!__hasProp.call(shortenMap, placeholder)) continue;
                  value = shortenMap[placeholder];
                  placeholders[placeholder] = value;
                }
                return done();
              }
            });
          }
        ], function(err) {
          if (!err) {
            output = Mustache.to_html(output, placeholders);
            log.debug('Following string is the re-rendered result...', output);
          }
          return done(err);
        });
      }
    ], function(err) {
      var type, value, _ref2;

      type = message.type[0].toUpperCase() + message.type.substr(1);
      if (shortcut) {
        value = message.data.key.charCodeAt(0);
      }
      analytics.track('Requests', 'Processed', type, value);
      updateProgress(100);
      if (!err && !output) {
        err = new Error(i18n.get('result_bad_empty_description', template.title));
      }
      if (err) {
        log.warn(err.message);
        ext.notification.title = i18n.get('result_bad_title');
        ext.notification.titleStyle = 'color: #B94A48';
        ext.notification.description = (_ref2 = err.message) != null ? _ref2 : i18n.get('result_bad_description', template.title);
        showNotification();
        if (typeof sendResponse === "function") {
          sendResponse();
        }
      } else {
        updateTemplateUsage(template.key);
        updateStatistics();
        ext.notification.title = i18n.get('result_good_title');
        ext.notification.titleStyle = 'color: #468847';
        ext.notification.description = i18n.get('result_good_description', template.title);
        ext.copy(output);
        if (!isProtectedPage(active) && (editable && store.get('menu.paste')) || (shortcut && store.get('shortcuts.paste'))) {
          utils.sendMessage('tabs', active.id, {
            contents: output,
            id: id,
            type: 'paste'
          });
        }
        if (typeof sendResponse === "function") {
          sendResponse({
            contents: output
          });
        }
      }
      return log.debug("Finished handling " + type + " request");
    });
  };

  selectOrCreateTab = function(url, callback) {
    log.trace();
    return chrome.windows.getCurrent({
      populate: true
    }, function(win) {
      var existing, tab, _i, _len, _ref;

      log.debug('Retrieved the following window...', win);
      log.debug('Retrieved the following tabs...', win.tabs);
      _ref = win.tabs;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tab = _ref[_i];
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
        return typeof callback === "function" ? callback(false) : void 0;
      } else {
        chrome.tabs.create({
          windowId: win.id,
          url: url,
          active: true
        });
        return typeof callback === "function" ? callback(true) : void 0;
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
    return chrome.windows.getAll({
      populate: true
    }, function(windows) {
      var tab, win, _i, _len, _results;

      log.info('Retrieved the following windows...', windows);
      _results = [];
      for (_i = 0, _len = windows.length; _i < _len; _i++) {
        win = windows[_i];
        log.info('Retrieved the following tabs...', win.tabs);
        _results.push((function() {
          var _j, _len1, _ref, _results1;

          _ref = win.tabs;
          _results1 = [];
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            tab = _ref[_j];
            if (!isProtectedPage(tab)) {
              _results1.push(utils.sendMessage('tabs', tab.id, {
                hotkeys: hotkeys
              }));
            }
          }
          return _results1;
        })());
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
      popup.dequeue().delay(POPUP_DELAY);
      templates.dequeue().delay(POPUP_DELAY);
      loading.dequeue().delay(POPUP_DELAY);
      return progressBar.css('width', "" + percent + "%");
    }
  };

  updateStatistics = function() {
    var _this = this;

    log.trace();
    log.info('Updating statistics');
    store.init('stats', {});
    return store.modify('stats', function(stats) {
      var maxUsage, popular;

      maxUsage = 0;
      utils.query(ext.templates, false, function(template) {
        if (template.usage > maxUsage) {
          maxUsage = template.usage;
        }
        return false;
      });
      popular = ext.queryTemplate(function(template) {
        return template.usage === maxUsage;
      });
      stats.count = ext.templates.length;
      stats.customCount = stats.count - DEFAULT_TEMPLATES.length;
      return stats.popular = popular != null ? popular.key : void 0;
    });
  };

  updateTemplateUsage = function(key) {
    var template, _i, _len, _ref;

    log.trace();
    _ref = ext.templates;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      template = _ref[_i];
      if (!(template.key === key)) {
        continue;
      }
      template.usage++;
      break;
    }
    store.set('templates', ext.templates);
    log.info("Used " + template.title + " template");
    return analytics.track('Templates', 'Used', template.title, Number(template.readOnly));
  };

  updateUrlShortenerUsage = function(name, oauth) {
    var shortener;

    log.trace();
    store.modify(name, function(shortener) {
      return shortener.usage++;
    });
    shortener = ext.queryUrlShortener(function(shortener) {
      return shortener.name === name;
    });
    log.info("Used " + shortener.title + " URL shortener");
    return analytics.track('Shorteners', 'Used', shortener.title, Number(oauth));
  };

  addAdditionalData = function(tab, data, id, editable, shortcut, link, callback) {
    log.trace();
    return chrome.windows.getCurrent({
      populate: true
    }, function(win) {
      log.info('Retrieved the following window...', win);
      log.info('Retrieved the following tabs...', win.tabs);
      $.extend(data, {
        tabs: (function() {
          var _i, _len, _ref, _results;

          _ref = win.tabs;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            tab = _ref[_i];
            _results.push(tab.url);
          }
          return _results;
        })()
      });
      return async.parallel([
        function(done) {
          return navigator.geolocation.getCurrentPosition(function(position) {
            var coords, prop, value, _ref;

            log.debug('Retrieved the following geolocation information...', position);
            coords = {};
            _ref = position.coords;
            for (prop in _ref) {
              if (!__hasProp.call(_ref, prop)) continue;
              value = _ref[prop];
              cords[prop.toLowerCase()] = value != null ? "" + value : '';
            }
            return done(null, {
              coords: coords
            });
          }, function(err) {
            log.error(err.message);
            return done(null, {
              coords: {}
            });
          });
        }, function(done) {
          return chrome.cookies.getAll({
            url: data.url
          }, function(cookies) {
            var cookie, names;

            if (cookies == null) {
              cookies = [];
            }
            log.debug('Retrieved the following cookies...', cookies);
            cookie = function(text, render) {
              var name, result, _i, _len;

              name = render(text);
              for (_i = 0, _len = cookies.length; _i < _len; _i++) {
                cookie = cookies[_i];
                if (!(cookie.name === name)) {
                  continue;
                }
                result = cookie.value;
                break;
              }
              return result != null ? result : '';
            };
            cookies = ((function() {
              var _i, _len, _ref;

              names = [];
              for (_i = 0, _len = cookies.length; _i < _len; _i++) {
                cookie = cookies[_i];
                if (_ref = cookie.name, __indexOf.call(names, _ref) < 0) {
                  names.push(cookie.name);
                }
              }
              return names;
            })());
            return done(null, {
              cookie: cookie,
              cookies: cookies
            });
          });
        }, function(done) {
          if (isProtectedPage(tab)) {
            return utils.sendMessage('tabs', tab.id, {
              editable: editable,
              id: id,
              link: link,
              shortcut: shortcut,
              url: data.url
            }, function(response) {
              var lastModified, time, _ref, _ref1, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref16, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;

              log.debug('Retrieved the following data from content script...', response);
              lastModified = result.lastModified != null ? (time = Date.parse(result.lastModified), !isNaN(time) ? new Date(time) : void 0) : void 0;
              return done(null, {
                author: (_ref = result.author) != null ? _ref : '',
                characterset: (_ref1 = result.characterSet) != null ? _ref1 : '',
                description: (_ref2 = result.description) != null ? _ref2 : '',
                images: (_ref3 = result.images) != null ? _ref3 : [],
                keywords: (_ref4 = result.keywords) != null ? _ref4 : [],
                lastmodified: function() {
                  return function(text, render) {
                    var _ref5;

                    return (_ref5 = lastModified != null ? lastModified.format(render(text) || void 0) : void 0) != null ? _ref5 : '';
                  };
                },
                linkhtml: (_ref5 = result.linkHTML) != null ? _ref5 : '',
                links: (_ref6 = result.links) != null ? _ref6 : [],
                linktext: (_ref7 = result.linkText) != null ? _ref7 : '',
                pageheight: (_ref8 = result.pageHeight) != null ? _ref8 : '',
                pagewidth: (_ref9 = result.pageWidth) != null ? _ref9 : '',
                referrer: (_ref10 = result.referrer) != null ? _ref10 : '',
                scripts: (_ref11 = result.scripts) != null ? _ref11 : [],
                selectedimages: (_ref12 = result.selectedImages) != null ? _ref12 : [],
                selectedlinks: (_ref13 = result.selectedLinks) != null ? _ref13 : [],
                selection: (_ref14 = result.selection) != null ? _ref14 : '',
                selectionhtml: (_ref15 = result.selectionHTML) != null ? _ref15 : '',
                selectionlinks: function() {
                  return this.selectedlinks;
                },
                stylesheets: (_ref16 = result.styleSheets) != null ? _ref16 : []
              });
            });
          } else {
            return done(null, {});
          }
        }
      ], function(err, results) {
        if (err) {
          log.error(err);
        }
        if (results) {
          $.extend.apply($, [data].concat(__slice.call(results)));
        }
        return callback();
      });
    });
  };

  buildDerivedData = function(tab, onClickData, getCallback) {
    var data, obj;

    log.trace();
    obj = {
      editable: onClickData.editable,
      link: false
    };
    data = {
      title: tab.title,
      url: onClickData.linkUrl ? (obj.link = true, onClickData.linkUrl) : onClickData.srcUrl ? onClickData.srcUrl : onClickData.frameUrl ? onClickData.frameUrl : onClickData.pageUrl
    };
    obj.data = buildStandardData(data, getCallback);
    return obj;
  };

  buildStandardData = function(tab, getCallback) {
    var anchor, bitly, ctab, data, extension, googl, handler, menu, notifications, plugin, prop, results, shortcuts, stats, toolbar, url, value, yourls;

    log.trace();
    ctab = {};
    for (prop in tab) {
      if (!__hasProp.call(tab, prop)) continue;
      value = tab[prop];
      ctab[prop] = value;
    }
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
        return ext.queryUrlShortener(function(shortener) {
          return shortener.name === 'bitly';
        }).oauth.hasAccessToken();
      },
      browser: browser.title,
      browserversion: browser.version,
      capitalise: function() {
        return this.capitalize();
      },
      capitalize: function() {
        return function(text, render) {
          return render(text).capitalize();
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
        return ext.queryUrlShortener(function(shortener) {
          return shortener.name === 'googl';
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
      plugins: ((function() {
        var _i, _len, _ref, _ref1;

        results = [];
        _ref = navigator.plugins;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          plugin = _ref[_i];
          if (_ref1 = plugin.name, __indexOf.call(results, _ref1) < 0) {
            results.push(plugin.name);
          }
        }
        return results.sort();
      })()),
      popular: ext.queryTemplate(function(template) {
        return template.key === stats.popular;
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
      yourls: yourls.enabled,
      yourlsauthentication: yourls.authentication,
      yourlspassword: yourls.password,
      yourlssignature: yourls.signature,
      yourlsurl: yourls.url,
      yourlsusername: yourls.username
    });
    return data;
  };

  runSelectors = function(tab, map, callback) {
    var placeholder;

    log.trace();
    if (isProtectedPage(tab)) {
      for (placeholder in map) {
        if (!__hasProp.call(map, placeholder)) continue;
        map[placeholder] = '';
      }
      return callback();
    } else {
      return utils.sendMessage('tabs', tab.id, {
        selectors: map
      }, function(response) {
        var result, value, _ref;

        log.debug('Retrieved the following data from the content script...', response);
        _ref = response.selectors;
        for (placeholder in _ref) {
          if (!__hasProp.call(_ref, placeholder)) continue;
          value = _ref[placeholder];
          result = value.result || '';
          if ($.isArray(result)) {
            result = result.join('\n');
          }
          if (value.convertTo === 'markdown') {
            result = md(result);
          }
          map[placeholder] = result;
        }
        return callback();
      });
    }
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

  buildPopup = function() {
    var anchor, items, template, _i, _len, _ref;

    log.trace();
    items = $();
    _ref = ext.templates;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      template = _ref[_i];
      if (template.enabled) {
        items = items.add(buildTemplate(template));
      }
    }
    if (items.length === 0) {
      items = items.add($('<li/>', {
        "class": 'empty'
      }).append($('<i/>', {
        "class": 'icon-'
      })).append(" " + (i18n.get('empty'))));
    }
    if (store.get('toolbar.options')) {
      items = items.add($('<li/>', {
        "class": 'divider'
      }));
      anchor = $('<a/>', {
        "class": 'options',
        'data-type': 'options'
      });
      anchor.append($('<i/>', {
        "class": icons.getClass('cog')
      }));
      anchor.append(" " + (i18n.get('options')));
      items = items.add($('<li/>').append(anchor));
    }
    return ext.templatesHtml = $('<div/>').append(items).html();
  };

  buildTemplate = function(template) {
    var anchor, modifiers;

    log.trace();
    log.debug("Creating popup list item for " + template.title);
    anchor = $('<a/>', {
      'data-key': template.key,
      'data-type': 'popup'
    });
    if (template.shortcut && store.get('shortcuts.enabled')) {
      if (ext.isThisPlatform('mac')) {
        modifiers = ext.SHORTCUT_MAC_MODIFIERS;
      } else {
        modifiers = ext.SHORTCUT_MODIFIERS;
      }
      anchor.append($('<span/>', {
        "class": 'pull-right',
        html: "" + modifiers + template.shortcut
      }));
    }
    anchor.append($('<i/>', {
      "class": icons.getClass(template.image)
    }));
    anchor.append(" " + template.title);
    return $('<li/>').append(anchor);
  };

  init_update = function() {
    var updater;

    log.trace();
    if (store.exists('update_progress')) {
      store.modify('updates', function(updates) {
        var namespace, progress, versions, _results;

        progress = store.remove('update_progress');
        _results = [];
        for (namespace in progress) {
          if (!__hasProp.call(progress, namespace)) continue;
          versions = progress[namespace];
          _results.push(updates[namespace] = (versions != null ? versions.length : void 0) ? versions.pop() : '');
        }
        return _results;
      });
    }
    updater = new store.Updater('settings');
    isNewInstall = updater.isNew;
    updater.update('0.1.0.0', function() {
      log.info('Updating general settings for 0.1.0.0');
      store.rename('settingNotification', 'notifications', true);
      store.rename('settingNotificationTimer', 'notificationDuration', 3000);
      store.rename('settingShortcut', 'shortcuts', true);
      store.rename('settingTargetAttr', 'doAnchorTarget', false);
      store.rename('settingTitleAttr', 'doAnchorTitle', false);
      return store.remove('settingIeTabExtract', 'settingIeTabTitle');
    });
    updater.update('1.0.0', function() {
      var optionsActiveTab, _ref, _ref1;

      log.info('Updating general settings for 1.0.0');
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
    return updater.update('1.1.0', function() {
      var _ref;

      log.info('Updating general settings for 1.1.0');
      return store.set('shortcuts', {
        enabled: (_ref = store.get('shortcuts')) != null ? _ref : true
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
    idx = templates.indexOf(utils.query(templates, true, function(tmpl) {
      return tmpl.key === template.key;
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
    updater.rename('templates');
    updater.update('0.1.0.0', function() {
      log.info('Updating template settings for 0.1.0.0');
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
      var i, image, legacy, name, names, oldImg, _i, _len, _ref, _results;

      log.info('Updating template settings for 0.2.0.0');
      names = (_ref = store.get('features')) != null ? _ref : [];
      _results = [];
      for (_i = 0, _len = names.length; _i < _len; _i++) {
        name = names[_i];
        if (!(typeof name === 'string')) {
          continue;
        }
        store.rename("feat_" + name + "_template", "feat_" + name + "_content");
        image = store.get("feat_" + name + "_image");
        if (typeof image === 'string') {
          if (image === '' || image === 'spacer.gif' || image === 'spacer.png') {
            _results.push(store.set("feat_" + name + "_image", 0));
          } else {
            _results.push((function() {
              var _j, _len1, _ref1, _results1;

              _ref1 = icons.LEGACY;
              _results1 = [];
              for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
                legacy = _ref1[i];
                oldImg = legacy.image.replace(/^tmpl/, 'feat');
                if (("" + oldImg + ".png") === image) {
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

      log.info('Updating template settings for 1.0.0');
      names = (_ref = store.remove('features')) != null ? _ref : [];
      templates = [];
      toolbarFeatureName = store.get('toolbarFeatureName');
      for (_i = 0, _len = names.length; _i < _len; _i++) {
        name = names[_i];
        if (!(typeof name === 'string')) {
          continue;
        }
        image = (_ref1 = store.remove("feat_" + name + "_image")) != null ? _ref1 : 0;
        image--;
        image = image >= 0 ? ((_ref2 = icons.fromLegacy(image)) != null ? _ref2.name : void 0) || '' : '';
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
      log.info('Updating template settings for 1.1.0');
      return store.modify('templates', function(templates) {
        var base, template, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _results;

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
            switch (template.key) {
              case 'PREDEFINED.00001':
                _results.push(template.image = template.image === 'tmpl_globe' ? base.image : ((_ref = icons.fromLegacy(template.image)) != null ? _ref.name : void 0) || '');
                break;
              case 'PREDEFINED.00002':
                _results.push(template.image = template.image === 'tmpl_link' ? base.image : ((_ref1 = icons.fromLegacy(template.image)) != null ? _ref1.name : void 0) || '');
                break;
              case 'PREDEFINED.00003':
                _results.push(template.image = template.image === 'tmpl_html' ? base.image : ((_ref2 = icons.fromLegacy(template.image)) != null ? _ref2.name : void 0) || '');
                break;
              case 'PREDEFINED.00004':
                _results.push(template.image = template.image === 'tmpl_component' ? base.image : ((_ref3 = icons.fromLegacy(template.image)) != null ? _ref3.name : void 0) || '');
                break;
              case 'PREDEFINED.00005':
                _results.push(template.image = template.image === 'tmpl_discussion' ? base.image : ((_ref4 = icons.fromLegacy(template.image)) != null ? _ref4.name : void 0) || '');
                break;
              case 'PREDEFINED.00006':
                _results.push(template.image = template.image === 'tmpl_discussion' ? base.image : ((_ref5 = icons.fromLegacy(template.image)) != null ? _ref5.name : void 0) || '');
                break;
              case 'PREDEFINED.00007':
                _results.push(template.image = template.image === 'tmpl_note' ? base.image : ((_ref6 = icons.fromLegacy(template.image)) != null ? _ref6.name : void 0) || '');
                break;
              default:
                _results.push(template.image = base.image);
            }
          } else {
            _results.push(template.image = ((_ref7 = icons.fromLegacy(template.image)) != null ? _ref7.name : void 0) || '');
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
    updater.update('1.0.0', function() {
      log.info('Updating toolbar settings for 1.0.0');
      store.modify('toolbar', function(toolbar) {
        var _ref, _ref1;

        toolbar.popup = (_ref = store.get('toolbarPopup')) != null ? _ref : true;
        return toolbar.style = (_ref1 = store.get('toolbarFeatureDetails')) != null ? _ref1 : false;
      });
      return store.remove('toolbarFeature', 'toolbarFeatureDetails', 'toolbarFeatureName', 'toolbarPopup');
    });
    return updater.update('1.1.0', function() {
      log.info('Updating toolbar settings for 1.1.0');
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
    updater.update('0.1.0.0', function() {
      log.info('Updating URL shortener settings for 0.1.0.0');
      store.rename('bitlyEnabled', 'bitly', true);
      store.rename('bitlyXApiKey', 'bitlyApiKey', '');
      store.rename('bitlyXLogin', 'bitlyUsername', '');
      store.rename('googleEnabled', 'googl', false);
      return store.rename('googleOAuthEnabled', 'googlOAuth', true);
    });
    updater.update('1.0.0', function() {
      var bitly, googl, yourls, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;

      log.info('Updating URL shortener settings for 1.0.0');
      bitly = store.get('bitly');
      store.set('bitly', {
        apiKey: (_ref = store.get('bitlyApiKey')) != null ? _ref : '',
        enabled: typeof bitly === 'boolean' ? bitly : true,
        username: (_ref1 = store.get('bitlyUsername')) != null ? _ref1 : ''
      });
      store.remove('bitlyApiKey', 'bitlyUsername');
      googl = store.get('googl');
      store.set('googl', {
        enabled: typeof googl === 'boolean' ? googl : false
      });
      store.remove('googlOAuth');
      yourls = store.get('yourls');
      store.set('yourls', {
        enabled: typeof yourls === 'boolean' ? yourls : false,
        password: (_ref2 = store.get('yourlsPassword')) != null ? _ref2 : '',
        signature: (_ref3 = store.get('yourlsSignature')) != null ? _ref3 : '',
        url: (_ref4 = store.get('yourlsUrl')) != null ? _ref4 : '',
        username: (_ref5 = store.get('yourlsUsername')) != null ? _ref5 : ''
      });
      return store.remove('yourlsPassword', 'yourlsSignature', 'yourlsUrl', 'yourlsUsername');
    });
    return updater.update('1.0.1', function() {
      store.modify('bitly', function(bitly) {
        delete bitly.apiKey;
        return delete bitly.username;
      });
      store.modify('yourls', function(yourls) {
        return yourls.authentication = yourls.signature ? 'advanced' : yourls.password && yourls.username ? 'basic' : '';
      });
      return store.remove.apply(store, store.search(/^oauth_token.*/));
    });
  };

  callUrlShortener = function(map, callback) {
    var endpoint, service, tasks, title;

    log.trace();
    service = getActiveUrlShortener();
    endpoint = service.url();
    title = service.title;
    if (!endpoint) {
      return callback({
        message: i18n.get('shortener_config_error', title),
        service: service,
        success: false
      });
    }
    tasks = _.each(map, function(url, placeholder) {
      var oauth, _ref;

      oauth = !!((_ref = service.oauth) != null ? _ref.hasAccessToken() : void 0);
      return function(done) {
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
              var message;

              if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                  map[placeholder] = service.output(xhr.responseText);
                  return done(null, {
                    oauth: oauth
                  });
                } else {
                  message = i18n.get('shortener_detailed_error', [title, url]);
                  return done(new Error(message));
                }
              }
            };
            return xhr.send(service.input(url));
          }
        ], done);
      };
    });
    return async.parallel(tasks, function(err, results) {
      var _ref;

      return callback(err, {
        oauth: (_ref = _.last(results)) != null ? _ref.oauth : void 0,
        service: service
      });
    });
  };

  getActiveUrlShortener = function() {
    var shortener;

    log.trace();
    shortener = ext.queryUrlShortener(function(shortener) {
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

    Extension.prototype.templates = [];

    Extension.prototype.templatesHtml = '';

    Extension.prototype.version = '';

    Extension.prototype.copy = function(str, hidden) {
      var sandbox;

      log.trace();
      sandbox = $('#sandbox').val(str).select();
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
      return async.series([
        function(done) {
          return $.getJSON(utils.url('manifest.json'), function(data) {
            _this.version = data.version;
            return done();
          });
        }, function(done) {
          return $.getJSON(utils.url('configuration.json'), function(data) {
            var shortener, _i, _len;

            _this.config = data;
            for (_i = 0, _len = SHORTENERS.length; _i < _len; _i++) {
              shortener = SHORTENERS[_i];
              shortener.oauth = typeof shortener.oauth === "function" ? shortener.oauth() : void 0;
            }
            return done();
          });
        }
      ], function(err) {
        if (err) {
          throw err;
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
        utils.onMessage('extension', false, onMessage);
        utils.onMessage('extension', true, function(msg, sender, cb) {
          var block;

          block = isBlacklisted(sender.id);
          analytics.track('External Requests', 'Started', sender.id, Number(!block));
          if (block) {
            log.debug("Blocking external request from " + sender.id);
            return typeof cb === "function" ? cb() : void 0;
          } else {
            log.debug("Accepting external request from " + sender.id);
            return onMessage(msg, sender, cb);
          }
        });
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
      return navigator.userAgent.toLowerCase().indexOf(os) !== -1;
    };

    Extension.prototype.paste = function() {
      var result, sandbox;

      log.trace();
      result = '';
      sandbox = $('#sandbox').val('').select();
      if (document.execCommand('paste')) {
        result = sandbox.val();
      }
      log.debug('Pasted the following string...', result);
      sandbox.val('');
      return result;
    };

    Extension.prototype.queryTemplate = function(filter, singular) {
      if (singular == null) {
        singular = true;
      }
      log.trace();
      return utils.query(this.templates, singular, filter);
    };

    Extension.prototype.queryTemplates = function(filter) {
      return this.queryTemplate(filter, false);
    };

    Extension.prototype.queryUrlShortener = function(filter, singular) {
      if (singular == null) {
        singular = true;
      }
      log.trace();
      return utils.query(SHORTENERS, singular, filter);
    };

    Extension.prototype.queryUrlShorteners = function(filter) {
      return this.queryUrlShortener(filter, false);
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
        if (menu.enabled) {
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
        }
      });
    };

    Extension.prototype.updateTemplates = function() {
      log.trace();
      this.templates = store.get('templates');
      this.templates.sort(function(a, b) {
        return a.index - b.index;
      });
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

  utils.ready(function() {
    return ext.init();
  });

}).call(this);
