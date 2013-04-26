// [Template](http://neocotic.com/template)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/template>
(function() {
  var Class, R_EVENTS, Utils, eventHandler, timings, utils, _ref,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Class = (function() {
    function Class() {}

    Class.prototype.toString = function() {
      return this.constructor.name;
    };

    return Class;

  })();

  R_EVENTS = /\s+/;

  timings = {};

  eventHandler = function() {
    var action, args, callback, key, name, obj, _i, _len, _ref;

    obj = arguments[0], action = arguments[1], name = arguments[2], args = 4 <= arguments.length ? __slice.call(arguments, 3) : [];
    if (!name) {
      return true;
    }
    if (_.isObject) {
      for (key in name) {
        callback = name[key];
        obj[action].apply(obj, [key, callback].concat(__slice.call(args)));
      }
      return false;
    }
    if (R_EVENTS.test(name)) {
      _ref = name.split(R_EVENTS);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        obj[action].apply(obj, [name].concat(__slice.call(args)));
      }
      return false;
    }
    return true;
  };

  utils = window.utils = new (Utils = (function(_super) {
    __extends(Utils, _super);

    function Utils() {
      _ref = Utils.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Utils.prototype.callback = function(fn) {
      return function() {
        var args;

        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        if (_.isFunction(fn)) {
          fn.apply(null, args);
          return true;
        }
      };
    };

    Utils.prototype.capitalize = function(str) {
      if (!str) {
        return str;
      }
      return str.replace(/\w+/g, function(word) {
        return word[0].toUpperCase() + word.slice(1).toLowerCase();
      });
    };

    Utils.prototype.keyGen = function(separator, length, prefix, upperCase) {
      var i, key, max, min, part, parts, _i, _len;

      if (separator == null) {
        separator = '.';
      }
      if (length == null) {
        length = 5;
      }
      if (prefix == null) {
        prefix = '';
      }
      if (upperCase == null) {
        upperCase = true;
      }
      parts = [];
      parts.push(new Date().getTime());
      if (length > 0) {
        min = this.repeat('1', '0', length === 1 ? 1 : length - 1);
        max = this.repeat('f', 'f', length === 1 ? 1 : length - 1);
        min = parseInt(min, 16);
        max = parseInt(max, 16);
        parts.push(_.random(min, max));
      }
      for (i = _i = 0, _len = parts.length; _i < _len; i = ++_i) {
        part = parts[i];
        parts[i] = part.toString(16);
      }
      key = prefix + parts.join(separator);
      if (upperCase) {
        return key.toUpperCase();
      } else {
        return key.toLowerCase();
      }
    };

    Utils.prototype.query = function(entities, singular, filter) {
      var entity, _i, _j, _len, _len1, _results;

      if (singular) {
        for (_i = 0, _len = entities.length; _i < _len; _i++) {
          entity = entities[_i];
          if (filter(entity)) {
            return entity;
          }
        }
      } else {
        _results = [];
        for (_j = 0, _len1 = entities.length; _j < _len1; _j++) {
          entity = entities[_j];
          if (filter(entity)) {
            _results.push(entity);
          }
        }
        return _results;
      }
    };

    Utils.prototype.ready = function(context, handler) {
      if (handler == null) {
        handler = context;
        context = window;
      }
      if (context.jQuery != null) {
        return context.jQuery(handler);
      } else {
        return context.document.addEventListener('DOMContentLoaded', handler);
      }
    };

    Utils.prototype.repeat = function(str, repeatStr, count) {
      var i, _i, _j, _ref1;

      if (str == null) {
        str = '';
      }
      if (repeatStr == null) {
        repeatStr = str;
      }
      if (count == null) {
        count = 1;
      }
      if (count !== 0) {
        if (count > 0) {
          for (i = _i = 1; 1 <= count ? _i <= count : _i >= count; i = 1 <= count ? ++_i : --_i) {
            str += repeatStr;
          }
        }
        if (count < 0) {
          for (i = _j = 1, _ref1 = count * -1; 1 <= _ref1 ? _j <= _ref1 : _j >= _ref1; i = 1 <= _ref1 ? ++_j : --_j) {
            str = repeatStr + str;
          }
        }
      }
      return str;
    };

    Utils.prototype.time = function(key) {
      if (_.has(timings, key)) {
        return new Date().getTime() - timings[key];
      } else {
        return timings[key] = new Date().getTime();
      }
    };

    Utils.prototype.timeEnd = function(key) {
      var start;

      if (_.has(timings, key)) {
        start = timings[key];
        delete timings[key];
        return new Date().getTime() - start;
      } else {
        return 0;
      }
    };

    Utils.prototype.url = function() {
      var _ref1;

      return (_ref1 = chrome.runtime).getURL.apply(_ref1, arguments);
    };

    return Utils;

  })(Class));

  utils.Events = (function(_super) {
    __extends(Events, _super);

    function Events() {
      this._events = {};
    }

    Events.prototype.off = function(name, callback, context) {
      var events, evt, names, retain, _i, _j, _len, _len1;

      if (_.isEmpty(this._events || !eventHandler(this, 'off', name, callback, context))) {
        return this;
      }
      if (!(name || callback || context)) {
        this._events = {};
        return this;
      }
      names = name ? [name] : _.keys(this._events);
      for (_i = 0, _len = names.length; _i < _len; _i++) {
        name = names[_i];
        if (!(events = this._events[name])) {
          continue;
        }
        this._events[name] = retain = [];
        if (callback || context) {
          for (_j = 0, _len1 = events.length; _j < _len1; _j++) {
            evt = events[_j];
            if ((callback && callback !== evt.callback && callback !== evt.callback._callback) || (context && context !== evt.context)) {
              retain.push(evt);
            }
          }
        }
        if (_.isEmpty(retain)) {
          delete this._events[name];
        }
      }
      return this;
    };

    Events.prototype.on = function(name, callback, context) {
      var events, _base;

      if (!eventHandler(this, 'on', name, callback, context) || !callback) {
        return this;
      }
      if (context == null) {
        context = this;
      }
      events = (_base = this._events)[name] || (_base[name] = []);
      events.push({
        callback: callback,
        context: context
      });
      return this;
    };

    Events.prototype.once = function(name, callback, context) {
      var once, self;

      if (!eventHandler(this, 'once', name, callback, context) || !callback) {
        return this;
      }
      self = this;
      once = _.once(function() {
        self.off(name, once);
        return callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    };

    Events.prototype.trigger = function() {
      var args, evt, name, _i, _j, _len, _len1, _ref1, _ref2, _ref3, _ref4;

      name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (_.isEmpty(this._events || !eventHandler.apply(null, [this, 'trigger', name].concat(__slice.call(args))))) {
        return this;
      }
      _ref2 = (_ref1 = this._events[name]) != null ? _ref1 : [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        evt = _ref2[_i];
        evt.callback.apply(evt.context, args);
      }
      _ref4 = (_ref3 = this._events.all) != null ? _ref3 : [];
      for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
        evt = _ref4[_j];
        evt.callback.apply(evt.context, [name].concat(args));
      }
      return this;
    };

    return Events;

  })(Class);

  utils.Class = Class;

}).call(this);
