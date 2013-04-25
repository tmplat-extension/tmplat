// [Template](http://neocotic.com/template)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/template>
(function() {
  var Store, dig, store, tryParse, tryStringify, _ref,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  dig = function(root, path, force, parseFirst) {
    var base, basePath, object, result;

    if (parseFirst == null) {
      parseFirst = true;
    }
    result = [root];
    if (path && __indexOf.call(path, '.') >= 0) {
      path = path.split('.');
      object = base = root[basePath = path.shift()];
      if (parseFirst) {
        object = base = tryParse(object);
      }
      while (object && path.length > 1) {
        object = object[path.shift()];
        if ((object == null) && force) {
          object = {};
        }
      }
      result.push(base, basePath, object, path.shift());
    } else {
      result.push(root, path, root, path);
    }
    return result;
  };

  tryParse = function(value) {
    if (value != null) {
      return JSON.parse(value);
    } else {
      return value;
    }
  };

  tryStringify = function(value) {
    if (value != null) {
      return JSON.stringify(value);
    } else {
      return value;
    }
  };

  store = window.store = new (Store = (function(_super) {
    __extends(Store, _super);

    function Store() {
      _ref = Store.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Store.prototype.backup = function() {
      var data, key, value;

      data = {};
      for (key in localStorage) {
        if (!__hasProp.call(localStorage, key)) continue;
        value = localStorage[key];
        data[key] = value;
      }
      return encodeURIComponent(JSON.stringify(data));
    };

    Store.prototype.clear = function() {
      var key, _results;

      _results = [];
      for (key in localStorage) {
        if (!__hasProp.call(localStorage, key)) continue;
        _results.push(delete localStorage[key]);
      }
      return _results;
    };

    Store.prototype.exists = function() {
      var key, keys, _i, _len;

      keys = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        key = keys[_i];
        if (!_.has(localStorage, key)) {
          return false;
        }
      }
      return true;
    };

    Store.prototype.get = function(key) {
      var parts, value;

      parts = dig(localStorage, key);
      if (parts[3]) {
        value = parts[3][parts[4]];
        if (parts[3] === parts[0]) {
          value = tryParse(value);
        }
      }
      return value;
    };

    Store.prototype.init = function(keys, defaultValue) {
      var key, _ref1, _results;

      switch (typeof keys) {
        case 'object':
          _results = [];
          for (key in keys) {
            if (!__hasProp.call(keys, key)) continue;
            defaultValue = keys[key];
            _results.push(this.init(key, defaultValue));
          }
          return _results;
          break;
        case 'string':
          return this.set(keys, (_ref1 = this.get(keys)) != null ? _ref1 : defaultValue);
      }
    };

    Store.prototype.modify = function() {
      var callback, key, keys, value, _i, _j, _len, _results;

      keys = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
      _results = [];
      for (_j = 0, _len = keys.length; _j < _len; _j++) {
        key = keys[_j];
        value = this.get(key);
        if (typeof callback === "function") {
          callback(value, key);
        }
        _results.push(this.set(key, value));
      }
      return _results;
    };

    Store.prototype.remove = function() {
      var key, keys, value, _i, _len, _results;

      keys = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (keys.length === 1) {
        value = this.get(keys[0]);
        delete localStorage[keys[0]];
        return value;
      }
      _results = [];
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        key = keys[_i];
        _results.push(delete localStorage[key]);
      }
      return _results;
    };

    Store.prototype.rename = function(oldKey, newKey, defaultValue) {
      if (this.exists(oldKey)) {
        this.set(newKey, this.get(oldKey));
        return this.remove(oldKey);
      } else {
        return this.set(newKey, defaultValue);
      }
    };

    Store.prototype.restore = function(str) {
      var data, key, value, _results;

      data = JSON.parse(decodeURIComponent(str));
      _results = [];
      for (key in data) {
        if (!__hasProp.call(data, key)) continue;
        value = data[key];
        _results.push(localStorage[key] = value);
      }
      return _results;
    };

    Store.prototype.search = function(regex) {
      var key, _results;

      _results = [];
      for (key in localStorage) {
        if (!__hasProp.call(localStorage, key)) continue;
        if (regex.test(key)) {
          _results.push(key);
        }
      }
      return _results;
    };

    Store.prototype.set = function(keys, value) {
      var key, oldValue, _results;

      switch (typeof keys) {
        case 'object':
          _results = [];
          for (key in keys) {
            if (!__hasProp.call(keys, key)) continue;
            value = keys[key];
            _results.push(this.set(key, value));
          }
          return _results;
          break;
        case 'string':
          oldValue = this.get(keys);
          localStorage[keys] = tryStringify(value);
          return oldValue;
      }
    };

    return Store;

  })(utils.Class));

  store.Updater = (function(_super) {
    __extends(Updater, _super);

    function Updater(namespace) {
      this.namespace = namespace;
      this.isNew = !this.exists();
    }

    Updater.prototype.exists = function() {
      return store.get("updates." + this.namespace) != null;
    };

    Updater.prototype.remove = function() {
      var _this = this;

      return store.modify('updates', function(updates) {
        return delete updates[_this.namespace];
      });
    };

    Updater.prototype.rename = function(namespace) {
      var _this = this;

      return store.modify('updates', function(updates) {
        if (updates[_this.namespace] != null) {
          updates[namespace] = updates[_this.namespace];
        }
        delete updates[_this.namespace];
        return _this.namespace = namespace;
      });
    };

    Updater.prototype.update = function(version, processor) {
      var _this = this;

      return store.modify('updates', function(updates) {
        var _name, _ref1;

        if ((_ref1 = updates[_name = _this.namespace]) == null) {
          updates[_name] = '';
        }
        if (updates[_this.namespace] < version) {
          if (typeof processor === "function") {
            processor();
          }
          return updates[_this.namespace] = version;
        }
      });
    };

    return Updater;

  })(utils.Class);

  store.init('updates', {});

}).call(this);
