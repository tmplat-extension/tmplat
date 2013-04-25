// [Template](http://neocotic.com/template)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/template>
(function() {
  var elementBackups, elements, extractAll, getContent, getLink, getMeta, hotkeys, isEditable, parentLink, paste,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty;

  elementBackups = {};

  elements = {
    field: null,
    link: null,
    other: null
  };

  hotkeys = [];

  extractAll = function(array, property) {
    var element, results, _i, _len, _ref;

    results = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      element = array[_i];
      if (element[property] != null) {
        if (_ref = element[property], __indexOf.call(results, _ref) < 0) {
          results.push(element[property]);
        }
      }
    }
    return results;
  };

  getContent = function(info, node) {
    var _ref;

    if (!node) {
      return '';
    }
    if ((_ref = info != null ? info.convertTo : void 0) === 'html' || _ref === 'markdown') {
      return node.innerHTML;
    } else {
      return node.textContent;
    }
  };

  getLink = function(id, url) {
    var _ref;

    if (elementBackups[id] == null) {
      return;
    }
    if (((_ref = elementBackups[id].link) != null ? _ref.href : void 0) === url) {
      return elementBackups[id].link;
    } else {
      return parentLink(elementBackups[id].other);
    }
  };

  getMeta = function(name, csv) {
    var content, results, value, _i, _len, _ref, _ref1, _ref2;

    content = (_ref = document.querySelector("meta[name='" + name + "']")) != null ? (_ref1 = _ref.content) != null ? _ref1.trim() : void 0 : void 0;
    if (csv && (content != null)) {
      results = [];
      _ref2 = content.split(/\s*,\s*/);
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        value = _ref2[_i];
        if (value.length) {
          if (__indexOf.call(results, value) < 0) {
            results.push(value);
          }
        }
      }
      return results;
    } else {
      return content;
    }
  };

  isEditable = function(node) {
    return (node != null) && !node.disabled && !node.readOnly;
  };

  parentLink = function(node) {
    if (node == null) {
      return;
    }
    if (node.nodeName === 'A') {
      return node;
    } else {
      return parentLink(node.parentNode);
    }
  };

  paste = function(node, value) {
    var str;

    if (!((node != null) || value)) {
      return;
    }
    str = node.value.substr(0, node.selectionStart);
    str += value;
    str += node.value.substr(node.selectionEnd, node.value.length);
    return node.value = str;
  };

  chrome.runtime.sendMessage({
    type: 'info'
  }, function(data) {
    var isMac;

    hotkeys = data.hotkeys;
    isMac = navigator.userAgent.toLowerCase().indexOf('mac') !== -1;
    if (document.body.getAttribute(data.id) === data.version) {
      return;
    }
    document.body.setAttribute(data.id, data.version);
    window.addEventListener('contextmenu', function(e) {
      switch (e.target.nodeName) {
        case 'A':
          return elements.link = e.target;
        case 'INPUT':
        case 'TEXTAREA':
          return elements.field = e.target;
        default:
          return elements.other = e.target;
      }
    });
    window.addEventListener('keydown', function(e) {
      var key, _ref;

      if ((!isMac && e.ctrlKey && e.altKey) || (isMac && e.shiftKey && e.altKey)) {
        key = String.fromCharCode(e.keyCode).toUpperCase();
        if (__indexOf.call(hotkeys, key) >= 0) {
          if ((_ref = e.target.nodeName) === 'INPUT' || _ref === 'TEXTAREA') {
            elements.field = e.target;
          } else {
            elements.field = null;
          }
          chrome.runtime.sendMessage({
            data: {
              key: key
            },
            type: 'shortcut'
          });
          return e.preventDefault();
        }
      }
    });
    return chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      var callback, container, contents, href, images, info, key, link, links, node, nodes, result, selection, src, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3;

      callback = function() {
        var args;

        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        if (typeof sendResponse === 'function') {
          sendResponse.apply(null, args);
          return true;
        }
      };
      if (message.hotkeys != null) {
        hotkeys = message.hotkeys;
        return callback();
      }
      if (message.selectors != null) {
        _ref = message.selectors;
        for (key in _ref) {
          if (!__hasProp.call(_ref, key)) continue;
          info = _ref[key];
          if (info.all) {
            nodes = document.querySelectorAll(info.selector);
            result = [];
            if (nodes) {
              for (_i = 0, _len = nodes.length; _i < _len; _i++) {
                node = nodes[_i];
                if (node) {
                  result.push(getContent(info, node));
                }
              }
            }
          } else {
            node = document.querySelector(info.selector);
            if (node) {
              result = getContent(info, node);
            }
          }
          info.result = result;
        }
        return callback({
          selectors: message.selectors
        });
      }
      if (message.id == null) {
        return callback();
      }
      if (message.type === 'paste') {
        if ((message.contents != null) && isEditable((_ref1 = elementBackups[message.id]) != null ? _ref1.field : void 0)) {
          paste(elementBackups[message.id].field, message.contents);
        }
        delete elementBackups[message.id];
        return callback();
      }
      elementBackups[message.id] = {
        field: message.editable || message.shortcut ? elements.field : void 0,
        link: message.link ? elements.link : void 0,
        other: message.link ? elements.other : void 0
      };
      selection = window.getSelection();
      if (!selection.isCollapsed) {
        if (contents = selection.getRangeAt(0).cloneContents()) {
          container = document.createElement('div');
          container.appendChild(contents);
          _ref2 = container.querySelectorAll('[href]');
          for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
            href = _ref2[_j];
            href.href = href.href;
          }
          _ref3 = container.querySelectorAll('[src]');
          for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
            src = _ref3[_k];
            src.src = src.src;
          }
          images = extractAll(container.querySelectorAll('img[src]'), 'src');
          links = extractAll(container.querySelectorAll('a[href]'), 'href');
        }
      }
      link = getLink(message.id, message.url);
      return callback({
        author: getMeta('author'),
        characterSet: document.characterSet,
        description: getMeta('description'),
        images: extractAll(document.images, 'src'),
        keywords: getMeta('keywords', true),
        lastModified: document.lastModified,
        linkHTML: link != null ? link.innerHTML : void 0,
        linkText: link != null ? link.textContent : void 0,
        links: extractAll(document.links, 'href'),
        pageHeight: window.innerHeight,
        pageWidth: window.innerWidth,
        referrer: document.referrer,
        scripts: extractAll(document.scripts, 'src'),
        selectedImages: images,
        selectedLinks: links,
        selection: selection.toString(),
        selectionHTML: container != null ? container.innerHTML : void 0,
        styleSheets: extractAll(document.styleSheets, 'href')
      });
    });
  });

}).call(this);
