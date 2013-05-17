// [Template](http://template-extension.org)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license:
// <http://template-extension.org/license>
(function() {
  var ACCOUNT, Analytics, SOURCE, analytics, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ACCOUNT = 'UA-28812528-1';

  SOURCE = 'https://ssl.google-analytics.com/ga.js';

  analytics = window.analytics = new (Analytics = (function(_super) {
    __extends(Analytics, _super);

    function Analytics() {
      _ref = Analytics.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Analytics.prototype.add = function() {
      var ga, script, _gaq, _ref1;

      _gaq = (_ref1 = window._gaq) != null ? _ref1 : window._gaq = [];
      _gaq.push(['_setAccount', ACCOUNT]);
      _gaq.push(['_trackPageview']);
      ga = document.createElement('script');
      ga.async = 'async';
      ga.src = SOURCE;
      script = document.getElementsByTagName('script')[0];
      return script.parentNode.insertBefore(ga, script);
    };

    Analytics.prototype.enabled = function() {
      return (typeof store === "undefined" || store === null) || store.get('analytics');
    };

    Analytics.prototype.remove = function() {
      var script, _i, _len, _ref1;

      _ref1 = document.querySelectorAll("script[src='" + SOURCE + "']");
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        script = _ref1[_i];
        script.parentNode.removeChild(script);
      }
      return delete window._gaq;
    };

    Analytics.prototype.track = function(category, action, label, value, nonInteraction) {
      var event, _gaq, _ref1;

      if (!this.enabled()) {
        return;
      }
      event = ['_trackEvent'];
      event.push(category);
      event.push(action);
      if (label != null) {
        event.push(label);
      }
      if (value != null) {
        event.push(value);
      }
      if (nonInteraction != null) {
        event.push(nonInteraction);
      }
      _gaq = (_ref1 = window._gaq) != null ? _ref1 : window._gaq = [];
      return _gaq.push(event);
    };

    return Analytics;

  })(utils.Class));

  if (typeof store !== "undefined" && store !== null) {
    store.init('analytics', true);
  }

}).call(this);
