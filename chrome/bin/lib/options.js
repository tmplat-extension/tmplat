// [Template](http://neocotic.com/template)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/template>
(function() {
  var ErrorMessage, Message, Options, SuccessMessage, ValidationError, ValidationWarning, WIDGET_SOURCE, WarningMessage, ext, feedback, feedbackAdded, load, loadSaveEvents, loadTab, loadTabs, options, tabs,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  WIDGET_SOURCE = "https://widget.uservoice.com/RSRS5SpMkMxvKOCs27g.js";

  ext = chrome.extension.getBackgroundPage().ext;

  feedbackAdded = false;

  tabs = [];

  feedback = function() {
    var script, uv, uvTabLabel, uvwDialogClose;
    log.trace();
    if (!feedbackAdded) {
      uvwDialogClose = $('#uvw-dialog-close[onclick]');
      uvwDialogClose.live('hover', function() {
        $(this).removeAttr('onclick');
        return uvwDialogClose.die('hover');
      });
      $(uvwDialogClose.selector.replace('[onclick]', '')).live('click', function(e) {
        UserVoice.hidePopupWidget();
        return e.preventDefault();
      });
      uvTabLabel = $('#uvTabLabel[href^="javascript:"]');
      uvTabLabel.live('hover', function() {
        $(this).removeAttr('href');
        return uvTabLabel.die('hover');
      });
      window.uvOptions = {};
      uv = document.createElement('script');
      uv.async = 'async';
      uv.src = WIDGET_SOURCE;
      script = document.getElementsByTagName('script')[0];
      script.parentNode.insertBefore(uv, script);
      return feedbackAdded = true;
    }
  };

  load = function() {
    var level, logger, loggerLevel, option, _i, _len, _ref;
    log.trace();
    logger = store.get('logger');
    if (logger.enabled) {
      $('#loggerEnabled').attr('checked', 'checked');
    }
    loggerLevel = $('#loggerLevel');
    loggerLevel.find('option').remove();
    _ref = log.LEVELS;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      level = _ref[_i];
      option = $('<option/>', {
        text: i18n.get("opt_logger_level_" + level.name + "_text"),
        value: level.value
      });
      if (level.value === logger.level) {
        option.attr('selected', 'selected');
      }
      loggerLevel.append(option);
    }
    if (!loggerLevel.find('option[selected]').length) {
      loggerLevel.find("option[value='" + log.DEBUG + "']").attr('selected', 'selected');
    }
    return loadSaveEvents();
  };

  loadSaveEvents = function() {
    log.trace();
    return options.bindSaveEvent('#loggerEnabled, #loggerLevel', 'change', 'logger', function(key) {
      var value;
      value = key === 'level' ? this.val() : this.is(':checked');
      log.debug("Changing logging " + key + " to '" + value + "'");
      return value;
    }, function(jel, key, value) {
      var logger;
      logger = store.get('logger');
      chrome.extension.getBackgroundPage().log.config = log.config = logger;
      return analytics.track('Logging', 'Changed', key[0].toUpperCase() + key.substr(1), Number(value));
    });
  };

  loadTab = function(tab, callback) {
    log.trace();
    log.info("Loading " + tab.id + " tab resources");
    return $.ajax({
      cache: false,
      success: function(data) {
        $('#tabs').prepend($('<div/>', {
          "class": 'hide tab',
          html: data,
          id: "" + tab.id + "_tab"
        }));
        return callback();
      },
      url: utils.url("pages/options-" + tab.id + ".html")
    });
  };

  loadTabs = function(callback) {
    var cancelBtn, dialog, header, i, message, progressBar, runner, step, steps, tab, _i, _len, _ref;
    log.trace();
    log.info('Loading options tabs');
    cancelBtn = $('#loading_cancel_btn');
    dialog = $('#loading_dialog');
    message = $('#loading_message').text(' ');
    progressBar = $('#loading_progress .bar').css('width', 0);
    cancelBtn.html(i18n.get('opt_wizard_cancel_button')).off('click').click(function() {
      dialog.modal('hide');
      return window.close();
    });
    dialog.find('.modal-header h3').html(i18n.get('opt_loading_header'));
    dialog.modal({
      show: true
    });
    runner = new utils.Runner();
    steps = 100 / ext.config.options.tabs.length;
    _ref = ext.config.options.tabs.slice(0).reverse();
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      tab = _ref[i];
      header = i18n.get(tab.headerKey);
      step = i + 1;
      message.html(i18n.get('opt_loading_text', header));
      progressBar.css('width', "" + (step * steps / 2) + "%");
      $('#navigation').prepend($('<li/>').append($('<a/>', {
        id: "" + tab.id + "_nav",
        tabify: "#" + tab.id + "_tab",
        text: header
      })));
      runner.push(null, loadTab, tab, function() {
        progressBar.css('width', "" + (step * steps) + "%");
        return runner.next();
      });
    }
    return runner.run(function() {
      message.html(i18n.get('opt_loading_completed_text'));
      return callback();
    });
  };

  Message = (function(_super) {

    __extends(Message, _super);

    function Message(block) {
      this.block = block;
      this.className = 'alert-info';
      this.headerKey = 'opt_message_header';
    }

    Message.prototype.hide = function() {
      var _ref;
      return (_ref = this.alert) != null ? _ref.alert('close') : void 0;
    };

    Message.prototype.show = function() {
      if (this.headerKey && !(this.header != null)) {
        this.header = i18n.get(this.headerKey);
      }
      if (this.messageKey && !(this.message != null)) {
        this.message = i18n.get(this.messageKey);
      }
      this.alert = $('<div/>', {
        "class": "alert " + this.className
      });
      if (this.block) {
        this.alert.addClass('alert-block');
      }
      this.alert.append($('<button/>', {
        "class": 'close',
        'data-dismiss': 'alert',
        html: '&times;',
        type: 'button'
      }));
      if (this.header) {
        this.alert.append($("<" + (this.block ? 'h4' : 'strong') + "/>", {
          html: this.header
        }));
      }
      if (this.message) {
        this.alert.append(this.block ? this.message : " " + this.message);
      }
      return this.alert.prependTo($($('#navigation li.active a').attr('tabify')));
    };

    return Message;

  })(utils.Class);

  ErrorMessage = (function(_super) {

    __extends(ErrorMessage, _super);

    function ErrorMessage(block) {
      this.block = block;
      this.className = 'alert-error';
      this.headerKey = 'opt_message_error_header';
    }

    return ErrorMessage;

  })(Message);

  SuccessMessage = (function(_super) {

    __extends(SuccessMessage, _super);

    function SuccessMessage(block) {
      this.block = block;
      this.className = 'alert-success';
      this.headerKey = 'opt_message_success_header';
    }

    return SuccessMessage;

  })(Message);

  WarningMessage = (function(_super) {

    __extends(WarningMessage, _super);

    function WarningMessage(block) {
      this.block = block;
      this.className = '';
      this.headerKey = 'opt_message_warning_header';
    }

    return WarningMessage;

  })(Message);

  ValidationError = (function(_super) {

    __extends(ValidationError, _super);

    function ValidationError(id, key) {
      this.id = id;
      this.key = key;
      this.className = 'error';
    }

    ValidationError.prototype.hide = function() {
      var field;
      field = $("#" + this.id);
      field.parents('.control-group:first').removeClass(this.className);
      return field.parents('.controls:first').find('.help-block').remove();
    };

    ValidationError.prototype.show = function() {
      var field;
      field = $("#" + this.id);
      field.parents('.control-group:first').addClass(this.className);
      return field.parents('.controls:first').append($('<span/>', {
        "class": 'help-block',
        html: i18n.get(this.key)
      }));
    };

    return ValidationError;

  })(utils.Class);

  ValidationWarning = (function(_super) {

    __extends(ValidationWarning, _super);

    function ValidationWarning(id, key) {
      this.id = id;
      this.key = key;
      this.className = 'warning';
    }

    return ValidationWarning;

  })(ValidationError);

  options = window.options = new (Options = (function(_super) {

    __extends(Options, _super);

    function Options() {
      return Options.__super__.constructor.apply(this, arguments);
    }

    Options.prototype.i18nMap = {};

    Options.prototype.activateTooltips = function(selector) {
      var base;
      log.trace();
      base = $(selector || document);
      base.find('[data-original-title]').each(function() {
        var $this;
        $this = $(this);
        $this.tooltip('destroy');
        $this.attr('title', $this.attr('data-original-title'));
        return $this.removeAttr('data-original-title');
      });
      return base.find('[title]').each(function() {
        var $this, placement, _ref;
        $this = $(this);
        placement = $this.attr('data-placement');
        placement = placement != null ? utils.trimToLower(placement) : 'top';
        return $this.tooltip({
          container: (_ref = $this.attr('data-container')) != null ? _ref : 'body',
          placement: placement
        });
      });
    };

    Options.prototype.bindSaveEvent = function(selector, type, option, evaluate, callback) {
      log.trace();
      return $(selector).on(type, function() {
        var $this, key, value;
        $this = $(this);
        key = '';
        value = null;
        store.modify(option, function(data) {
          key = $this.attr('id').match(new RegExp("^" + option + "(\\S*)"))[1];
          key = key[0].toLowerCase() + key.substr(1);
          return data[key] = value = evaluate.call($this, key);
        });
        return typeof callback === "function" ? callback($this, key, value) : void 0;
      });
    };

    Options.prototype.init = function() {
      var _this = this;
      log.trace();
      log.info('Initializing the options page');
      if (store.get('analytics')) {
        analytics.add();
      }
      feedback();
      return loadTabs(function() {
        var id, initialTabChange, navHeight, optionsActiveTab, _i, _len, _ref;
        for (_i = 0, _len = tabs.length; _i < _len; _i++) {
          id = tabs[_i];
          if ((_ref = _this[id]) != null) {
            if (typeof _ref.init === "function") {
              _ref.init();
            }
          }
        }
        i18n.init(_this.i18nMap);
        $('.year-repl').html("" + (new Date().getFullYear()));
        initialTabChange = true;
        $('a[tabify]').click(function() {
          var nav, parent, target;
          target = $(this).attr('tabify');
          nav = $("#navigation a[tabify='" + target + "']");
          parent = nav.parent('li');
          if (!parent.hasClass('active')) {
            parent.siblings().removeClass('active');
            parent.addClass('active');
            $(target).show().siblings('.tab').hide();
            store.set('options_active_tab', id = nav.attr('id'));
            if (!initialTabChange) {
              id = id.match(/(\S*)_nav$/)[1];
              id = id[0].toUpperCase() + id.substr(1);
              log.debug("Changing tab to " + id);
              analytics.track('Tabs', 'Changed', id);
            }
            initialTabChange = false;
            return $(document.body).scrollTop(0);
          }
        });
        store.init('options_active_tab', 'general_nav');
        optionsActiveTab = store.get('options_active_tab');
        $("#" + optionsActiveTab).click();
        log.debug("Initially displaying tab for " + optionsActiveTab);
        $('#tools_nav').click(function() {
          return $('#tools_wizard').modal('show');
        });
        $('.tools_close_btn').click(function() {
          return $('#tools_wizard').modal('hide');
        });
        $('form:not([target="_blank"])').submit(function() {
          return false;
        });
        $('footer a[href*="neocotic.com"]').click(function() {
          return analytics.track('Footer', 'Clicked', 'Homepage');
        });
        $('#donation').submit(function() {
          return analytics.track('Footer', 'Clicked', 'Donate');
        });
        load();
        $('[popover]').each(function() {
          var $this, placement, trigger;
          $this = $(this);
          placement = $this.attr('data-placement');
          placement = placement != null ? utils.trimToLower(placement) : 'right';
          trigger = $this.attr('data-trigger');
          trigger = trigger != null ? utils.trimToLower(trigger) : 'hover';
          $this.popover({
            content: function() {
              return i18n.get($this.attr('popover'));
            },
            html: true,
            placement: placement,
            trigger: trigger
          });
          if (trigger === 'manual') {
            return $this.click(function() {
              return $this.popover('toggle');
            });
          }
        });
        _this.activateTooltips();
        navHeight = $('.navbar').height();
        $('[data-goto]').click(function() {
          var goto, pos, _ref1;
          goto = $($(this).attr('data-goto'));
          pos = ((_ref1 = goto.position()) != null ? _ref1.top : void 0) || 0;
          if (pos && pos >= navHeight) {
            pos -= navHeight;
          }
          log.debug("Relocating view to include '" + goto.selector + "' at " + pos);
          return $(window).scrollTop(pos);
        });
        return $('#loading_dialog').modal('hide');
      });
    };

    Options.prototype.tab = function(id, handler) {
      log.trace();
      log.info("Initializing the " + id + " tab...");
      tabs.push(id);
      return this[id] = {
        init: handler
      };
    };

    return Options;

  })(utils.Class));

  options.Message = Message;

  options.ErrorMessage = ErrorMessage;

  options.SuccessMessage = SuccessMessage;

  options.WarningMessage = WarningMessage;

  options.ValidationError = ValidationError;

  options.ValidationWarning = ValidationWarning;

  utils.ready(function() {
    return options.init();
  });

}).call(this);
