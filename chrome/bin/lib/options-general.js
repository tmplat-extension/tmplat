// [Template](http://neocotic.com/template)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/template>
(function() {
  var ext, load, loadControlEvents, loadSaveEvents, updateTemplates;

  ext = chrome.extension.getBackgroundPage().ext;

  load = function() {
    var anchor, menu, notifications, shortcuts, toolbar;
    log.trace();
    anchor = store.get('anchor');
    menu = store.get('menu');
    notifications = store.get('notifications');
    shortcuts = store.get('shortcuts');
    toolbar = store.get('toolbar');
    if (store.get('analytics')) {
      $('#analytics').attr('checked', 'checked');
    }
    if (anchor.target) {
      $('#anchorTarget').attr('checked', 'checked');
    }
    if (anchor.title) {
      $('#anchorTitle').attr('checked', 'checked');
    }
    if (menu.enabled) {
      $('#menuEnabled').attr('checked', 'checked');
    }
    if (menu.options) {
      $('#menuOptions').attr('checked', 'checked');
    }
    if (menu.paste) {
      $('#menuPaste').attr('checked', 'checked');
    }
    if (shortcuts.enabled) {
      $('#shortcutsEnabled').attr('checked', 'checked');
    }
    if (shortcuts.paste) {
      $('#shortcutsPaste').attr('checked', 'checked');
    }
    if (notifications.enabled) {
      $('#notifications').attr('checked', 'checked');
    }
    $('#notificationDuration').val(notifications.duration > 0 ? notifications.duration * .001 : 0);
    if (toolbar.popup) {
      $('#toolbarPopupYes').addClass('active');
    } else {
      $('#toolbarPopupNo').addClass('active');
    }
    if (toolbar.close) {
      $('#toolbarClose').attr('checked', 'checked');
    }
    if (toolbar.options) {
      $('#toolbarOptions').attr('checked', 'checked');
    }
    loadControlEvents();
    loadSaveEvents();
    return updateTemplates();
  };

  loadControlEvents = function() {
    log.trace();
    $('#menuEnabled').change(function() {
      var groups;
      groups = $('#menuOptions').parents('.control-group').first();
      groups = groups.add($('#menuPaste').parents('.control-group').first());
      if ($(this).is(':checked')) {
        return groups.slideDown();
      } else {
        return groups.slideUp();
      }
    }).change();
    $('#shortcutsEnabled').change(function() {
      var groups;
      groups = $('#shortcutsPaste').parents('.control-group').first();
      if ($(this).is(':checked')) {
        return groups.slideDown();
      } else {
        return groups.slideUp();
      }
    }).change();
    return $('#toolbarPopup .btn').click(function() {
      return $("." + ($(this).attr('id'))).show().siblings().hide();
    }).filter('.active').click();
  };

  loadSaveEvents = function() {
    log.trace();
    $('#analytics').change(function() {
      var enabled;
      enabled = $(this).is(':checked');
      log.debug("Changing analytics to '" + enabled + "'");
      if (enabled) {
        store.set('analytics', true);
        chrome.extension.getBackgroundPage().analytics.add();
        analytics.add();
        return analytics.track('General', 'Changed', 'Analytics', 1);
      } else {
        analytics.track('General', 'Changed', 'Analytics', 0);
        analytics.remove();
        chrome.extension.getBackgroundPage().analytics.remove();
        return store.set('analytics', false);
      }
    });
    options.bindSaveEvent('#anchorTarget, #anchorTitle', 'change', 'anchor', function(key) {
      var value;
      value = this.is(':checked');
      log.debug("Changing anchor " + key + " to '" + value + "'");
      return value;
    }, function(jel, key, value) {
      key = key[0].toUpperCase() + key.substr(1);
      return analytics.track('Anchors', 'Changed', key, Number(value));
    });
    options.bindSaveEvent('#menuEnabled, #menuOptions, #menuPaste', 'change', 'menu', function(key) {
      var value;
      value = this.is(':checked');
      log.debug("Changing context menu " + key + " to '" + value + "'");
      return value;
    }, function(jel, key, value) {
      ext.updateContextMenu();
      key = key[0].toUpperCase() + key.substr(1);
      return analytics.track('Context Menu', 'Changed', key, Number(value));
    });
    options.bindSaveEvent('#shortcutsEnabled, #shortcutsPaste', 'change', 'shortcuts', function(key) {
      var value;
      value = this.is(':checked');
      log.debug("Changing keyboard shortcuts " + key + " to '" + value + "'");
      return value;
    }, function(jel, key, value) {
      key = key[0].toUpperCase() + key.substr(1);
      return analytics.track('Keyboard Shortcuts', 'Changed', key, Number(value));
    });
    $('#notificationDuration').on('input', function() {
      var _this = this;
      return store.modify('notifications', function(notifications) {
        var ms;
        ms = $(_this).val();
        ms = ms != null ? parseInt(ms, 10) * 1000 : 0;
        log.debug("Changing notification duration to " + ms + " milliseconds");
        notifications.duration = ms;
        return analytics.track('Notifications', 'Changed', 'Duration', ms);
      });
    });
    $('#notifications').change(function() {
      var _this = this;
      return store.modify('notifications', function(notifications) {
        var enabled;
        enabled = $(_this).is(':checked');
        log.debug("Changing notifications to '" + enabled + "'");
        notifications.enabled = enabled;
        return analytics.track('Notifications', 'Changed', 'Enabled', Number(enabled));
      });
    });
    $('#toolbarPopup .btn').click(function() {
      var popup;
      popup = !$('#toolbarPopupYes').hasClass('active');
      store.modify('toolbar', function(toolbar) {
        return toolbar.popup = popup;
      });
      ext.updateToolbar();
      log.debug("Toolbar popup enabled: " + popup);
      return analytics.track('Toolbars', 'Changed', 'Behaviour', Number(popup));
    });
    return options.bindSaveEvent('#toolbarClose, #toolbarKey, #toolbarOptions', 'change', 'toolbar', function(key) {
      var value;
      value = key === 'key' ? this.val() : this.is(':checked');
      log.debug("Changing toolbar " + key + " to '" + value + "'");
      return value;
    }, function(jel, key, value) {
      ext.updateToolbar();
      key = key[0].toUpperCase() + key.substr(1);
      if (key === 'Key') {
        return analytics.track('Toolbars', 'Changed', key);
      } else {
        return analytics.track('Toolbars', 'Changed', key, Number(value));
      }
    });
  };

  updateTemplates = function() {
    var lastSelectedTemplate, lastSelectedTemplateKey, opt, template, toolbarKey, toolbarTemplates, _i, _len, _ref, _ref1, _results;
    log.trace();
    toolbarKey = store.get('toolbar.key');
    toolbarTemplates = $('#toolbarKey');
    lastSelectedTemplate = toolbarTemplates.find('option:selected');
    lastSelectedTemplateKey = '';
    if (lastSelectedTemplate.length) {
      lastSelectedTemplateKey = lastSelectedTemplate.val();
    }
    toolbarTemplates.find('option').remove();
    _ref = ext.templates;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      template = _ref[_i];
      opt = $('<option/>', {
        text: template.title,
        value: template.key
      });
      opt.prop('selected', (_ref1 = template.key) === lastSelectedTemplateKey || _ref1 === toolbarKey);
      _results.push(toolbarTemplates.append(opt));
    }
    return _results;
  };

  options.tab('general', function() {
    log.trace();
    log.info('Initializing the general tab');
    $.extend(options.i18nMap, {
      version_definition: {
        opt_guide_standard_version_text: ext.version
      }
    });
    load();
    return this.updateTemplates = updateTemplates;
  });

}).call(this);
