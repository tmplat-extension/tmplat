// [Template](http://template-extension.org)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license:
// <http://template-extension.org/license>
(function() {
  var Store, Updater, dig, store, tryParse, tryStringify, _ref,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  dig = function(root, path, force, parseFirst) {
    var base, basePath, object;

    if (parseFirst == null) {
      parseFirst = true;
    }
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
      return [base, basePath, object, path.shift()];
    } else {
      return [root, path, root, path];
    }
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
        data[key] = JSON.parse(value);
      }
      return encodeURIComponent(JSON.stringify(data));
    };

    Store.prototype.clear = function() {
      localStorage.clear();
      return this.trigger('clear');
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
      var base, parent, path, property, value, _ref1;

      _ref1 = dig(localStorage, key), base = _ref1[0], path = _ref1[1], parent = _ref1[2], property = _ref1[3];
      if (parent) {
        value = parent[property];
        if (parent === localStorage) {
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
        key = keys[0];
        if (this.exists(key)) {
          value = this.get(key);
          delete localStorage[key];
          this.trigger('removed', key);
          this.trigger("removed:" + key, value);
          return value;
        }
      } else {
        _results = [];
        for (_i = 0, _len = keys.length; _i < _len; _i++) {
          key = keys[_i];
          _results.push(this.remove(key));
        }
        return _results;
      }
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
        _results.push(localStorage[key] = JSON.stringify(value));
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
        case 'string':
          oldValue = this.get(keys);
          localStorage[keys] = tryStringify(value);
          this.trigger('changed', keys, value, oldValue);
          this.trigger("changed:" + keys, value, oldValue);
          return oldValue;
      }
    };

    return Store;

  })(utils.Class));

  _.extend(Store.prototype, Backbone.Events);

  store.Updater = Updater = (function(_super) {
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

      this.trigger('remove');
      return store.modify('updates', function(updates) {
        if (_.has(updates, _this.namespace)) {
          delete updates[_this.namespace];
          return _this.trigger('removed');
        }
      });
    };

    Updater.prototype.rename = function(namespace) {
      var old,
        _this = this;

      old = this.namespace;
      this.trigger('rename', namespace, old);
      return store.modify('updates', function(updates) {
        _this.namespace = namespace;
        if (updates[old] != null) {
          updates[namespace] = updates[old];
        }
        delete updates[old];
        return _this.trigger('renamed', namespace, old);
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
          _this.trigger('update', version);
          if (typeof processor === "function") {
            processor(version);
          }
          updates[_this.namespace] = version;
          return _this.trigger('updated', version);
        }
      });
    };

    return Updater;

  })(utils.Class);

  _.extend(Updater.prototype, Backbone.Events);

  store.init('updates', {});

}).call(this);
