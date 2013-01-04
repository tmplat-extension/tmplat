// [Template](http://neocotic.com/template)
// (c) 2012 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/template>
(function() {
  var Notification, analytics, buildContents, ext, log, notification, store, utils, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = chrome.extension.getBackgroundPage(), analytics = _ref.analytics, ext = _ref.ext, log = _ref.log, store = _ref.store, utils = _ref.utils;

  buildContents = function() {
    var data, description, icon, image, title, _ref1;
    log.trace();
    data = (_ref1 = ext.notification) != null ? _ref1 : {};
    log.debug(data);
    if (data.html) {
      return document.body.innerHTML = data.html;
    } else {
      if (data.icon) {
        icon = document.createElement('div');
        icon.id = 'icon';
        if (data.iconStyle) {
          icon.style.cssText = data.iconStyle;
        }
        image = document.createElement('img');
        image.src = data.icon;
        image.width = 32;
        image.height = 32;
        icon.appendChild(image);
        document.body.appendChild(icon);
      }
      if (data.title) {
        title = document.createElement('div');
        title.id = 'title';
        title.innerHTML = data.title;
        if (data.titleStyle) {
          title.style.cssText = data.titleStyle;
        }
        document.body.appendChild(title);
      }
      if (data.description) {
        description = document.createElement('div');
        description.id = 'description';
        description.innerHTML = data.description;
        if (data.descriptionStyle) {
          description.style.cssText = data.descriptionStyle;
        }
        return document.body.appendChild(description);
      }
    }
  };

  notification = window.notification = new (Notification = (function(_super) {

    __extends(Notification, _super);

    function Notification() {
      return Notification.__super__.constructor.apply(this, arguments);
    }

    Notification.prototype.init = function() {
      var duration;
      log.trace();
      log.info('Initializing a notification');
      analytics.track('Frames', 'Displayed', 'Notification');
      buildContents();
      ext.reset();
      duration = store.get('notifications.duration');
      if (duration > 0) {
        return setTimeout((function() {
          return close();
        }), duration);
      }
    };

    return Notification;

  })(utils.Class));

  utils.ready(this, function() {
    return notification.init();
  });

}).call(this);
