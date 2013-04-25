// [Template](http://neocotic.com/template)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/template>
(function() {
  var Popup, analytics, ext, log, popup, sendMessage, utils, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = chrome.extension.getBackgroundPage(), analytics = _ref.analytics, ext = _ref.ext, log = _ref.log, utils = _ref.utils;

  sendMessage = function() {
    var message;

    log.trace();
    message = {
      data: {
        key: this.getAttribute('data-key')
      },
      type: this.getAttribute('data-type')
    };
    log.debug('Sending the following message to the extension controller', message);
    return chrome.runtime.sendMessage(message);
  };

  popup = window.popup = new (Popup = (function(_super) {
    __extends(Popup, _super);

    function Popup() {
      _ref1 = Popup.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Popup.prototype.init = function() {
      var item, items, width, _i, _j, _k, _len, _len1, _len2;

      log.trace();
      log.info('Initializing the popup');
      analytics.track('Frames', 'Displayed', 'Popup');
      document.getElementById('templates').innerHTML = ext.templatesHtml;
      items = document.querySelectorAll('#templates li > a');
      for (_i = 0, _len = items.length; _i < _len; _i++) {
        item = items[_i];
        item.addEventListener('click', sendMessage);
      }
      for (_j = 0, _len1 = items.length; _j < _len1; _j++) {
        item = items[_j];
        if ((typeof width === "undefined" || width === null) || item.scrollWidth > width) {
          width = item.scrollWidth;
        }
      }
      for (_k = 0, _len2 = items.length; _k < _len2; _k++) {
        item = items[_k];
        item.style.width = "" + width + "px";
      }
      log.debug("Widest textual item in popup is " + width + "px");
      width = document.querySelector('#templates li').scrollWidth;
      return document.getElementById('loading').style.width = "" + (width + 2) + "px";
    };

    return Popup;

  })(utils.Class));

  utils.ready(this, function() {
    return popup.init();
  });

}).call(this);
