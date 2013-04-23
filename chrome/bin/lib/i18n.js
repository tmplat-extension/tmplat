// [Template](http://neocotic.com/template)
// (c) 2012 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/template>
(function() {
  var Internationalization, attributes, handlers, i18n, key, process, selector, subst, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  handlers = {
    'i18n-content': function(element, name, map) {
      var subs;

      subs = subst(element, name, map);
      return element.innerHTML = i18n.get(name, subs);
    },
    'i18n-options': function(element, name, map) {
      var option, subs, value, values, _i, _len, _results;

      subs = subst(element, name, map);
      values = i18n.get(name, subs);
      _results = [];
      for (_i = 0, _len = values.length; _i < _len; _i++) {
        value = values[_i];
        option = document.createElement('option');
        if (typeof value === 'string') {
          option.text = option.value = value;
        } else {
          option.text = value[1];
          option.value = value[0];
        }
        _results.push(element.appendChild(option));
      }
      return _results;
    },
    'i18n-values': function(element, value, map) {
      var obj, part, parts, path, prop, propExpr, propName, propSubs, _i, _len, _results;

      parts = value.replace(/\s/g, '').split(';');
      _results = [];
      for (_i = 0, _len = parts.length; _i < _len; _i++) {
        part = parts[_i];
        prop = part.match(/^([^:]+):(.+)$/);
        if (prop) {
          propName = prop[1];
          propExpr = prop[2];
          propSubs = subst(element, propExpr, map);
          if (propName.indexOf('.') === 0) {
            path = propName.slice(1).split('.');
            obj = element;
            while (obj && path.length > 1) {
              obj = obj[path.shift()];
            }
            if (obj) {
              path = path[0];
              obj[path] = i18n.get(propExpr, propSubs);
              if (path === 'innerHTML') {
                _results.push(process(element, map));
              } else {
                _results.push(void 0);
              }
            } else {
              _results.push(void 0);
            }
          } else {
            _results.push(element.setAttribute(propName, i18n.get(propExpr, propSubs)));
          }
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }
  };

  attributes = (function() {
    var _results;

    _results = [];
    for (key in handlers) {
      if (!__hasProp.call(handlers, key)) continue;
      _results.push(key);
    }
    return _results;
  })();

  selector = "[" + (attributes.join('],[')) + "]";

  process = function(node, map) {
    var attribute, element, name, _i, _len, _ref, _results;

    _ref = node.querySelectorAll(selector);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      element = _ref[_i];
      _results.push((function() {
        var _j, _len1, _results1;

        _results1 = [];
        for (_j = 0, _len1 = attributes.length; _j < _len1; _j++) {
          name = attributes[_j];
          attribute = element.getAttribute(name);
          if (attribute != null) {
            _results1.push(handlers[name](element, attribute, map));
          } else {
            _results1.push(void 0);
          }
        }
        return _results1;
      })());
    }
    return _results;
  };

  subst = function(element, value, map) {
    var map2, prop, prop2, subs, target;

    if (map) {
      for (prop in map) {
        if (!__hasProp.call(map, prop)) continue;
        map2 = map[prop];
        if (!(prop === element.id)) {
          continue;
        }
        for (prop2 in map2) {
          if (!__hasProp.call(map2, prop2)) continue;
          target = map2[prop2];
          if (!(prop2 === value)) {
            continue;
          }
          subs = target;
          break;
        }
        break;
      }
    }
    return subs;
  };

  i18n = window.i18n = new (Internationalization = (function(_super) {
    __extends(Internationalization, _super);

    function Internationalization() {
      _ref = Internationalization.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Internationalization.prototype.manager = {
      get: function(name, substitutions) {
        var i, message, sub, _i, _len;

        if (substitutions == null) {
          substitutions = [];
        }
        message = this.messages[name];
        if ((message != null) && substitutions.length > 0) {
          for (i = _i = 0, _len = substitutions.length; _i < _len; i = ++_i) {
            sub = substitutions[i];
            message = message.replace(new RegExp("\\$" + (i + 1), 'g'), sub);
          }
        }
        return message;
      },
      langs: function() {
        return [];
      },
      locale: function() {
        return navigator.language;
      },
      node: document
    };

    Internationalization.prototype.messages = {};

    Internationalization.prototype.attribute = function(selector, attribute, name, subs) {
      var element, elements, _i, _len, _results;

      elements = this.manager.node.querySelectorAll(selector);
      _results = [];
      for (_i = 0, _len = elements.length; _i < _len; _i++) {
        element = elements[_i];
        _results.push(element.setAttribute(attribute, this.get(name, subs)));
      }
      return _results;
    };

    Internationalization.prototype.content = function(selector, name, subs) {
      var element, elements, _i, _len, _results;

      elements = this.manager.node.querySelectorAll(selector);
      _results = [];
      for (_i = 0, _len = elements.length; _i < _len; _i++) {
        element = elements[_i];
        _results.push(element.innerHTML = this.get(name, subs));
      }
      return _results;
    };

    Internationalization.prototype.options = function(selector, name, subs) {
      var element, elements, option, value, values, _i, _len, _results;

      elements = this.manager.node.querySelectorAll(selector);
      _results = [];
      for (_i = 0, _len = elements.length; _i < _len; _i++) {
        element = elements[_i];
        values = this.get(name, subs);
        _results.push((function() {
          var _j, _len1, _results1;

          _results1 = [];
          for (_j = 0, _len1 = values.length; _j < _len1; _j++) {
            value = values[_j];
            option = document.createElement('option');
            if (typeof value === 'string') {
              option.text = option.value = value;
            } else {
              option.text = value[1];
              option.value = value[0];
            }
            _results1.push(element.appendChild(option));
          }
          return _results1;
        })());
      }
      return _results;
    };

    Internationalization.prototype.get = function() {
      var _ref1;

      return (_ref1 = this.manager).get.apply(_ref1, arguments);
    };

    Internationalization.prototype.init = function(map) {
      return process(this.manager.node, map);
    };

    Internationalization.prototype.langs = function() {
      var _ref1;

      return (_ref1 = this.manager).langs.apply(_ref1, arguments);
    };

    Internationalization.prototype.locale = function() {
      var _ref1;

      return (_ref1 = this.manager).locale.apply(_ref1, arguments);
    };

    return Internationalization;

  })(utils.Class));

  i18n.manager.get = function() {
    var _ref1;

    return (_ref1 = chrome.i18n).getMessage.apply(_ref1, arguments);
  };

  i18n.manager.langs = function() {
    var _ref1;

    return (_ref1 = chrome.i18n).getAcceptLanguages.apply(_ref1, arguments);
  };

  i18n.manager.locale = function() {
    return i18n.get('@@ui_locale').replace('_', '-');
  };

}).call(this);
