// [Template](http://neocotic.com/template)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/template>
(function() {
  var Class, Utils, timings, utils, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Class = (function() {
    function Class() {}

    Class.prototype.toString = function() {
      return this.constructor.name;
    };

    return Class;

  })();

  timings = {};

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

    Utils.prototype.trimToLower = function(str) {
      if (str == null) {
        str = '';
      }
      return str.trim().toLowerCase();
    };

    Utils.prototype.trimToUpper = function(str) {
      if (str == null) {
        str = '';
      }
      return str.trim().toUpperCase();
    };

    Utils.prototype.url = function() {
      var _ref1;

      return (_ref1 = chrome.extension).getURL.apply(_ref1, arguments);
    };

    return Utils;

  })(Class));

  utils.Class = Class;

}).call(this);
