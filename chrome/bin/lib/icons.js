// [Template](http://neocotic.com/template)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/template>
(function() {
  var Icon, Icons, icons, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Icon = (function(_super) {
    __extends(Icon, _super);

    function Icon(name) {
      this.name = name;
    }

    Icon.prototype.getClass = function() {
      return icons.getClass(this);
    };

    Icon.prototype.getMessage = function() {
      return icons.getMessage(this);
    };

    return Icon;

  })(utils.Class);

  icons = window.icons = new (Icons = (function(_super) {
    __extends(Icons, _super);

    function Icons() {
      _ref = Icons.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Icons.prototype.ICONS = [new Icon('adjust'), new Icon('align-center'), new Icon('align-justify'), new Icon('align-left'), new Icon('align-right'), new Icon('arrow-down'), new Icon('arrow-left'), new Icon('arrow-right'), new Icon('arrow-up'), new Icon('asterisk'), new Icon('backward'), new Icon('ban-circle'), new Icon('barcode'), new Icon('bell'), new Icon('bold'), new Icon('book'), new Icon('bookmark'), new Icon('briefcase'), new Icon('bullhorn'), new Icon('calendar'), new Icon('camera'), new Icon('certificate'), new Icon('check'), new Icon('chevron-down'), new Icon('chevron-left'), new Icon('chevron-right'), new Icon('chevron-up'), new Icon('circle-arrow-down'), new Icon('circle-arrow-left'), new Icon('circle-arrow-right'), new Icon('circle-arrow-up'), new Icon('cog'), new Icon('comment'), new Icon('download'), new Icon('download-alt'), new Icon('edit'), new Icon('eject'), new Icon('envelope'), new Icon('exclamation-sign'), new Icon('eye-close'), new Icon('eye-open'), new Icon('facetime-video'), new Icon('fast-backward'), new Icon('fast-forward'), new Icon('file'), new Icon('film'), new Icon('filter'), new Icon('fire'), new Icon('flag'), new Icon('folder-close'), new Icon('folder-open'), new Icon('font'), new Icon('forward'), new Icon('fullscreen'), new Icon('gift'), new Icon('glass'), new Icon('globe'), new Icon('hand-down'), new Icon('hand-left'), new Icon('hand-right'), new Icon('hand-up'), new Icon('hdd'), new Icon('headphones'), new Icon('heart'), new Icon('home'), new Icon('inbox'), new Icon('indent-left'), new Icon('indent-right'), new Icon('info-sign'), new Icon('italic'), new Icon('leaf'), new Icon('list'), new Icon('list-alt'), new Icon('lock'), new Icon('magnet'), new Icon('map-marker'), new Icon('minus'), new Icon('minus-sign'), new Icon('move'), new Icon('music'), new Icon('off'), new Icon('ok'), new Icon('ok-circle'), new Icon('ok-sign'), new Icon('pause'), new Icon('pencil'), new Icon('picture'), new Icon('plane'), new Icon('play'), new Icon('play-circle'), new Icon('plus'), new Icon('plus-sign'), new Icon('print'), new Icon('qrcode'), new Icon('question-sign'), new Icon('random'), new Icon('refresh'), new Icon('remove'), new Icon('remove-circle'), new Icon('remove-sign'), new Icon('repeat'), new Icon('resize-full'), new Icon('resize-horizontal'), new Icon('resize-small'), new Icon('resize-vertical'), new Icon('retweet'), new Icon('road'), new Icon('screenshot'), new Icon('search'), new Icon('share'), new Icon('share-alt'), new Icon('shopping-cart'), new Icon('signal'), new Icon('star'), new Icon('star-empty'), new Icon('step-backward'), new Icon('step-forward'), new Icon('stop'), new Icon('tag'), new Icon('tags'), new Icon('tasks'), new Icon('text-height'), new Icon('text-width'), new Icon('th'), new Icon('th-large'), new Icon('th-list'), new Icon('thumbs-down'), new Icon('thumbs-up'), new Icon('time'), new Icon('tint'), new Icon('trash'), new Icon('upload'), new Icon('user'), new Icon('volume-down'), new Icon('volume-off'), new Icon('volume-up'), new Icon('warning-sign'), new Icon('wrench'), new Icon('zoom-in'), new Icon('zoom-out')];

    Icons.prototype.LEGACY = [
      {
        image: 'tmpl_auction',
        icon: 'shopping-cart'
      }, {
        image: 'tmpl_bug',
        icon: 'wrench'
      }, {
        image: 'tmpl_clipboard',
        icon: 'folder-open'
      }, {
        image: 'tmpl_clipboard_empty',
        icon: 'folder-close'
      }, {
        image: 'tmpl_component',
        icon: 'th-large'
      }, {
        image: 'tmpl_cookies',
        icon: 'certificate'
      }, {
        image: 'tmpl_discussion',
        icon: 'comment'
      }, {
        image: 'tmpl_globe',
        icon: 'globe'
      }, {
        image: 'tmpl_google',
        icon: 'briefcase'
      }, {
        image: 'tmpl_heart',
        icon: 'heart'
      }, {
        image: 'tmpl_html',
        icon: 'font'
      }, {
        image: 'tmpl_key',
        icon: 'lock'
      }, {
        image: 'tmpl_lightbulb',
        icon: 'star-empty'
      }, {
        image: 'tmpl_lighthouse',
        icon: 'road'
      }, {
        image: 'tmpl_lightning',
        icon: 'star'
      }, {
        image: 'tmpl_link',
        icon: 'tag'
      }, {
        image: 'tmpl_linux',
        icon: 'briefcase'
      }, {
        image: 'tmpl_mail',
        icon: 'envelope'
      }, {
        image: 'tmpl_newspaper',
        icon: 'bullhorn'
      }, {
        image: 'tmpl_note',
        icon: 'inbox'
      }, {
        image: 'tmpl_page',
        icon: 'file'
      }, {
        image: 'tmpl_plugin',
        icon: 'leaf'
      }, {
        image: 'tmpl_rss',
        icon: 'signal'
      }, {
        image: 'tmpl_script',
        icon: 'file'
      }, {
        image: 'tmpl_scull',
        icon: 'fire'
      }, {
        image: 'tmpl_sign',
        icon: 'briefcase'
      }, {
        image: 'tmpl_siren',
        icon: 'bell'
      }, {
        image: 'tmpl_star',
        icon: 'star'
      }, {
        image: 'tmpl_support',
        icon: 'question-sign'
      }, {
        image: 'tmpl_tag',
        icon: 'tag'
      }, {
        image: 'tmpl_tags',
        icon: 'tags'
      }, {
        image: 'tmpl_thumb_down',
        icon: 'thumbs-down'
      }, {
        image: 'tmpl_thumb_up',
        icon: 'thumbs-up'
      }, {
        image: 'tmpl_tools',
        icon: 'wrench'
      }
    ];

    Icons.prototype.exists = function(name) {
      var icon, _i, _len, _ref1;

      _ref1 = this.ICONS;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        icon = _ref1[_i];
        if (icon.name === name) {
          return true;
        }
      }
      return false;
    };

    Icons.prototype.fromLegacy = function(value) {
      var icon, old;

      icon = this.getIcon((function() {
        var _i, _len, _ref1;

        switch (typeof value) {
          case 'number':
            return this.LEGACY[value];
          case 'string':
            _ref1 = this.LEGACY;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              old = _ref1[_i];
              if (old.image === value) {
                return old;
              }
            }
        }
      }).call(this));
      return icon != null ? icon.icon : void 0;
    };

    Icons.prototype.getClass = function(icon) {
      if (_.isObject(icon)) {
        icon = icon.name;
      }
      return "icon-" + (icon || '');
    };

    Icons.prototype.getIcon = function(name) {
      var icon, _i, _len, _ref1;

      _ref1 = this.ICONS;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        icon = _ref1[_i];
        if (icon.name === name) {
          return icon;
        }
      }
    };

    Icons.prototype.getMessage = function(icon) {
      if (_.isObject(icon)) {
        icon = icon.name;
      }
      return i18n.get("icon_" + ((icon != null ? icon.replace(/-/g, '_') : void 0) || 'none'));
    };

    return Icons;

  })(utils.Class));

}).call(this);
