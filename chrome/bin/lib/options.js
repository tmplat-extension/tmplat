// [Template](http://neocotic.com/template)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/template>
(function() {
  var ErrorMessage, Message, Options, R_CLEAN_QUERY, R_VALID_KEY, R_VALID_SHORTCUT, R_WHITESPACE, SuccessMessage, ValidationError, ValidationWarning, WarningMessage, activateDraggables, activateModifications, activateSelections, activateTooltips, activeTemplate, addImportedTemplate, bindSaveEvent, clearContext, closeWizard, createExport, createImport, deleteTemplates, deriveTemplate, enableTemplates, ext, feedback, feedbackAdded, getSelectedTemplates, isKeyValid, isShortcutValid, load, loadControlEvents, loadDeveloperTools, loadImages, loadLogger, loadLoggerSaveEvents, loadNotificationSaveEvents, loadNotifications, loadSaveEvents, loadTemplate, loadTemplateControlEvents, loadTemplateExportEvents, loadTemplateImportEvents, loadTemplateRows, loadTemplates, loadToolbar, loadToolbarControlEvents, loadToolbarSaveEvents, loadUrlShortenerAccounts, loadUrlShortenerControlEvents, loadUrlShortenerSaveEvents, loadUrlShorteners, openWizard, options, paginate, readImport, refreshResetButton, refreshSelectButtons, reorderTemplates, resetWizard, saveTemplate, searchResults, searchTemplates, setContext, updateImportedTemplate, updateToolbarTemplates, validateImportedTemplate, validateTemplate, _ref,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  R_CLEAN_QUERY = /[^\w\s]/g;

  R_VALID_KEY = /^[A-Z0-9]*\.[A-Z0-9]*$/i;

  R_VALID_SHORTCUT = /[A-Z0-9]/i;

  R_WHITESPACE = /\s+/;

  activeTemplate = null;

  ext = chrome.extension.getBackgroundPage().ext;

  feedbackAdded = false;

  searchResults = null;

  bindSaveEvent = function(selector, type, option, evaluate, callback) {
    log.trace();
    return $(selector).on(type, function() {
      var $this, key, value;

      $this = $(this);
      key = '';
      value = null;
      store.modify(option, function(data) {
        key = utils.capitalize($this.attr('id').match(new RegExp("^" + option + "(\\S*)"))[1]);
        return data[key] = value = evaluate.call($this, key);
      });
      return typeof callback === "function" ? callback($this, key, value) : void 0;
    });
  };

  load = function() {
    var anchor, menu, shortcuts;

    log.trace();
    anchor = store.get('anchor');
    menu = store.get('menu');
    shortcuts = store.get('shortcuts');
    $('#analytics').prop('checked', store.get('analytics'));
    $('#anchorTarget').prop('checked', anchor.target);
    $('#anchorTitle').prop('checked', anchor.title);
    $('#menuEnabled').prop('checked', menu.enabled);
    $('#menuOptions').prop('checked', menu.options);
    $('#menuPaste').prop('checked', menu.paste);
    $('#shortcutsEnabled').prop('checked', shortcuts.enabled);
    $('#shortcutsPaste').prop('checked', shortcuts.paste);
    loadControlEvents();
    loadSaveEvents();
    loadImages();
    loadTemplates();
    loadNotifications();
    loadToolbar();
    loadUrlShorteners();
    return loadDeveloperTools();
  };

  loadControlEvents = function() {
    log.trace();
    $('#menuEnabled').on('change', function() {
      var groups;

      groups = $('#menuOptions').parents('.control-group').first();
      groups = groups.add($('#menuPaste').parents('.control-group').first());
      if ($(this).is(':checked')) {
        return groups.slideDown();
      } else {
        return groups.slideUp();
      }
    }).trigger('change');
    return $('#shortcutsEnabled').on('change', function() {
      var groups;

      groups = $('#shortcutsPaste').parents('.control-group').first();
      if ($(this).is(':checked')) {
        return groups.slideDown();
      } else {
        return groups.slideUp();
      }
    }).trigger('change');
  };

  loadDeveloperTools = function() {
    log.trace();
    return loadLogger();
  };

  loadImages = function() {
    var image, images, _i, _len, _ref;

    log.trace();
    images = $('#template_image');
    images.append($('<option/>', {
      text: icons.getMessage(),
      value: ''
    }));
    images.append($('<option/>', {
      disabled: 'disabled',
      text: '---------------'
    }));
    _ref = icons.ICONS;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      image = _ref[_i];
      images.append($('<option/>', {
        text: image.getMessage(),
        value: image.name
      }));
    }
    return images.on('change', function() {
      return $('#template_image_preview').attr('class', icons.getClass($(this).find('option:selected').val()));
    }).trigger('change');
  };

  loadLogger = function() {
    var level, logger, loggerLevel, option, _i, _len, _ref;

    log.trace();
    logger = store.get('logger');
    $('#loggerEnabled').prop('checked', logger.enabled);
    loggerLevel = $('#loggerLevel');
    loggerLevel.find('option').remove();
    _ref = log.LEVELS;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      level = _ref[_i];
      option = $('<option/>', {
        text: i18n.get("opt_logger_level_" + level.name + "_text"),
        value: level.value
      });
      option.prop('selected', level.value === logger.level);
      loggerLevel.append(option);
    }
    if (!loggerLevel.find('option[selected]').length) {
      loggerLevel.find("option[value='" + log.DEBUG + "']").prop('selected', true);
    }
    return loadLoggerSaveEvents();
  };

  loadLoggerSaveEvents = function() {
    log.trace();
    return bindSaveEvent('#loggerEnabled, #loggerLevel', 'change', 'logger', function(key) {
      var value;

      value = key === 'level' ? this.val() : this.is(':checked');
      log.debug("Changing logging " + key + " to '" + value + "'");
      return value;
    }, function(jel, key, value) {
      chrome.extension.getBackgroundPage().log.config = log.config = store.get('logger');
      return analytics.track('Logging', 'Changed', utils.capitalize(key), Number(value));
    });
  };

  loadNotifications = function() {
    var duration, enabled, _ref;

    log.trace();
    _ref = store.get('notifications'), duration = _ref.duration, enabled = _ref.enabled;
    $('#notifications').prop('checked', enabled);
    $('#notificationDuration').val(duration > 0 ? duration * .001 : 0);
    return loadNotificationSaveEvents();
  };

  loadNotificationSaveEvents = function() {
    log.trace();
    $('#notificationDuration').on('input', function() {
      var ms;

      ms = $(this).val();
      ms = ms != null ? parseInt(ms, 10) * 1000 : 0;
      log.debug("Changing notification duration to " + ms + " milliseconds");
      return store.modify('notifications', function(notifications) {
        notifications.duration = ms;
        return analytics.track('Notifications', 'Changed', 'Duration', ms);
      });
    });
    return $('#notifications').on('change', function() {
      var enabled;

      enabled = $(this).is(':checked');
      log.debug("Changing notifications to '" + enabled + "'");
      return store.modify('notifications', function(notifications) {
        notifications.enabled = enabled;
        return analytics.track('Notifications', 'Changed', 'Enabled', Number(enabled));
      });
    });
  };

  loadSaveEvents = function() {
    log.trace();
    $('#analytics').on('change', function() {
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
    bindSaveEvent('#anchorTarget, #anchorTitle', 'change', 'anchor', function(key) {
      var value;

      value = this.is(':checked');
      log.debug("Changing anchor " + key + " to '" + value + "'");
      return value;
    }, function(jel, key, value) {
      return analytics.track('Anchors', 'Changed', utils.capitalize(key), Number(value));
    });
    bindSaveEvent('#menuEnabled, #menuOptions, #menuPaste', 'change', 'menu', function(key) {
      var value;

      value = this.is(':checked');
      log.debug("Changing context menu " + key + " to '" + value + "'");
      return value;
    }, function(jel, key, value) {
      ext.updateContextMenu();
      return analytics.track('Context Menu', 'Changed', utils.capitalize(key), Number(value));
    });
    return bindSaveEvent('#shortcutsEnabled, #shortcutsPaste', 'change', 'shortcuts', function(key) {
      var value;

      value = this.is(':checked');
      log.debug("Changing keyboard shortcuts " + key + " to '" + value + "'");
      return value;
    }, function(jel, key, value) {
      return analytics.track('Keyboard Shortcuts', 'Changed', utils.capitalize(key), Number(value));
    });
  };

  loadTemplates = function() {
    log.trace();
    loadTemplateControlEvents();
    loadTemplateImportEvents();
    loadTemplateExportEvents();
    return loadTemplateRows();
  };

  loadTemplate = function(template, modifiers) {
    var alignCenter, row;

    log.trace();
    if (modifiers == null) {
      modifiers = ext.modifiers();
    }
    log.debug('Creating a row for the following template...', template);
    row = $('<tr/>', {
      draggable: true
    });
    alignCenter = {
      css: {
        'text-align': 'center'
      }
    };
    row.append($('<td/>', alignCenter).append($('<input/>', {
      title: i18n.get('opt_select_box'),
      type: 'checkbox',
      value: template.key
    })));
    row.append($('<td/>').append($('<span/>', {
      html: "<i class=",
      title: i18n.get('opt_template_modify_title', template.title)
    })));
    row.append($('<td/>', {
      html: template.shortcut ? "" + modifiers + template.shortcut : '&nbsp;'
    }));
    row.append($('<td/>', alignCenter).append($('<i/>', {
      "class": "icon-" + (template.enabled ? 'ok' : 'remove')
    })));
    row.append($('<td/>').append($('<span/>', {
      text: template.content,
      title: template.content
    })));
    return row.append($('<td/>').append($('<span/>', {
      "class": 'muted',
      text: '::::',
      title: i18n.get('opt_template_move_title', template.title)
    })));
  };

  loadTemplateControlEvents = function() {
    var filter, limit, selectedTemplates, validationErrors, warningMsg, _i, _len, _ref;

    log.trace();
    $('#template_wizard [tabify], #template_cancel_btn').on('click', function() {
      return closeWizard();
    });
    $('#template_reset_btn').on('click', function() {
      return resetWizard();
    });
    filter = $('#template_filter');
    filter.find('option').remove();
    _ref = ext.config.options.limits;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      limit = _ref[_i];
      filter.append($('<option/>', {
        text: limit
      }));
    }
    filter.append($('<option/>', {
      disabled: 'disabled',
      text: '-----'
    }));
    filter.append($('<option/>', {
      text: i18n.get('opt_show_all_text'),
      value: 0
    }));
    store.init('options_limit', parseInt($('#template_filter').val()));
    limit = store.get('options_limit');
    $('#template_filter option').each(function() {
      var $this;

      $this = $(this);
      return $this.prop('selected', limit === parseInt($this.val()));
    });
    $('#template_filter').on('change', function() {
      store.set('options_limit', parseInt($(this).val()));
      return loadTemplateRows(searchResults != null ? searchResults : ext.templates);
    });
    $('#template_search :reset').on('click', function() {
      $('#template_search :text').val('');
      return searchTemplates();
    });
    $('#template_controls').on('submit', function() {
      return searchTemplates($('#template_search :text').val());
    });
    $('#template_delete_btn').on('click', function() {
      $(this).hide();
      return $('#template_confirm_delete').css('display', 'inline-block');
    });
    $('#template_undo_delete_btn').on('click', function() {
      $('#template_confirm_delete').hide();
      return $('#template_delete_btn').show();
    });
    $('#template_confirm_delete_btn').on('click', function() {
      $('#template_confirm_delete').hide();
      $('#template_delete_btn').show();
      deleteTemplates([activeTemplate]);
      return closeWizard();
    });
    validationErrors = [];
    $('#template_wizard').on('hide', function() {
      var error, _j, _len1, _results;

      _results = [];
      for (_j = 0, _len1 = validationErrors.length; _j < _len1; _j++) {
        error = validationErrors[_j];
        _results.push(error.hide());
      }
      return _results;
    });
    $('#template_save_btn').on('click', function() {
      var error, template, _j, _k, _len1, _len2, _results;

      template = deriveTemplate();
      for (_j = 0, _len1 = validationErrors.length; _j < _len1; _j++) {
        error = validationErrors[_j];
        error.hide();
      }
      validationErrors = validateTemplate(template);
      if (validationErrors.length) {
        _results = [];
        for (_k = 0, _len2 = validationErrors.length; _k < _len2; _k++) {
          error = validationErrors[_k];
          _results.push(error.show());
        }
        return _results;
      } else {
        saveTemplate($.extend(activeTemplate, template));
        $('#template_search :reset').hide();
        $('#template_search :text').val('');
        return closeWizard();
      }
    });
    $('#disable_btn, #enable_btn').on('click', function() {
      return enableTemplates(getSelectedTemplates(), $(this).is('#enable_btn'));
    });
    $('#add_btn').on('click', function() {
      return openWizard(null);
    });
    selectedTemplates = [];
    $('#delete_wizard').on('hide', function() {
      selectedTemplates = [];
      return $('#delete_items li').remove();
    });
    warningMsg = null;
    $('#delete_btn').on('click', function() {
      var deleteItems, div, list, predefinedCount, predefinedTemplates, template, _j, _len1;

      if (warningMsg != null) {
        warningMsg.hide();
      }
      deleteItems = $('#delete_items');
      predefinedTemplates = $('<ul/>');
      selectedTemplates = getSelectedTemplates();
      deleteItems.find('li').remove();
      for (_j = 0, _len1 = selectedTemplates.length; _j < _len1; _j++) {
        template = selectedTemplates[_j];
        list = template.readOnly ? predefinedTemplates : deleteItems;
        list.append($('<li/>', {
          text: template.title
        }));
      }
      predefinedCount = predefinedTemplates.find('li').length;
      if (predefinedCount) {
        div = $('<div/>');
        if (predefinedCount === 1) {
          div.append($('<p/>', {
            html: i18n.get('opt_template_delete_predefined_error_1')
          }));
          div.append(predefinedTemplates);
          div.append($('<p/>', {
            html: i18n.get('opt_template_delete_predefined_error_2')
          }));
        } else {
          div.append($('<p/>', {
            html: i18n.get('opt_template_delete_multiple_predefined_error_1')
          }));
          div.append(predefinedTemplates);
          div.append($('<p/>', {
            html: i18n.get('opt_template_delete_multiple_predefined_error_2')
          }));
        }
        warningMsg = new WarningMessage(true);
        warningMsg.message = div.html();
        return warningMsg.show();
      } else if (selectedTemplates.length) {
        return $('#delete_wizard').modal('show');
      }
    });
    $('#delete_cancel_btn, #delete_no_btn').on('click', function() {
      return $('#delete_wizard').modal('hide');
    });
    return $('#delete_yes_btn').on('click', function() {
      deleteTemplates(selectedTemplates);
      return $('#delete_wizard').modal('hide');
    });
  };

  loadTemplateExportEvents = function() {
    log.trace();
    $('#export_error .close').on('click', function() {
      return $(this).next().html('&nbsp').parent().hide();
    });
    $('#export_wizard').on('hide', function() {
      $('#export_content').val('');
      $('#export_save_btn').attr('href', '#');
      return $('#export_error').find('span').html('&nbsp;').end().hide();
    });
    $('#export_btn').on('click', function() {
      var URL, blob, selectedTemplates, str;

      selectedTemplates = getSelectedTemplates();
      if (selectedTemplates.length) {
        log.info('Launching export wizard');
        str = createExport(selectedTemplates);
        $('#export_content').val(str);
        blob = new Blob([str], {
          type: 'application/json'
        });
        URL = window.URL || window.webkitURL;
        $('#export_save_btn').attr('href', URL.createObjectURL(blob));
        return $('#export_wizard').modal('show');
      }
    });
    $('#export_close_btn').on('click', function() {
      return $('#export_wizard').modal('hide');
    });
    return $('#export_copy_btn').on('click', function() {
      ext.copy($('#export_content').val(), true);
      return $(this).text(i18n.get('opt_export_wizard_copy_alt_button')).delay(800).queue(function() {
        return $(this).text(i18n.get('opt_export_wizard_copy_button')).dequeue();
      });
    });
  };

  loadTemplateImportEvents = function() {
    var data;

    log.trace();
    data = null;
    $('#import_error .close').on('click', function() {
      return $(this).next().html('&nbsp').parent().hide();
    });
    $('#import_wizard').on('hide', function() {
      data = null;
      $('#import_final_btn').prop('disabled', true);
      $('#import_wizard_stage2, #import_back_btn, #import_final_btn').hide();
      $('#import_wizard_stage1, #import_continue_btn').show();
      $('#import_content, #import_file_btn').val('');
      $('#import_file_btn').val('');
      return $('#import_error').find('span').html('&nbsp;').end().hide();
    });
    $('#import_back_btn').on('click', function() {
      log.info('Going back to previous import stage');
      $('#import_wizard_stage2, #import_back_btn, #import_final_btn').hide();
      return $('#import_wizard_stage1, #import_continue_btn').show();
    });
    $('#import_btn').on('click', function() {
      log.info('Launching import wizard');
      return $('#import_wizard').modal('show');
    });
    $('#import_items').on('change', function() {
      return $('#import_final_btn').prop('disabled', !$(this).find(':selected').length);
    });
    $('#import_select_all_btn').on('click', function() {
      $('#import_items option').prop('selected', true).parent().focus();
      return $('#import_final_btn').prop('disabled', false);
    });
    $('#import_deselect_all_btn').on('click', function() {
      $('#import_items option').prop('selected', false).parent().focus();
      return $('#import_final_btn').prop('disabled', true);
    });
    $('#import_file_btn').on('change', function(e) {
      var file, reader;

      file = e.target.files[0];
      reader = new FileReader();
      reader.onerror = function(err) {
        var message;

        message = i18n.get((function() {
          switch (err.code) {
            case FileError.NOT_FOUND_ERR:
              return 'error_file_not_found';
            case FileError.ABORT_ERR:
              return 'error_file_aborted';
            default:
              return 'error_file_default';
          }
        })());
        log.warn('The following error was caught when loading the imported file...', err);
        return $('#import_error').find('span').text(message).end().show();
      };
      reader.onload = function(e) {
        var result;

        result = e.target.result;
        log.debug('The following contents were read from the file...', result);
        $('#import_error').find('span').html('&nbsp;').end().hide();
        return $('#import_content').val(result);
      };
      return reader.readAsText(file);
    });
    $('#import_final_btn').on('click', function() {
      var existing, index, matched, template, _i, _j, _len, _len1, _ref, _ref1;

      if (data == null) {
        return;
      }
      _ref = data.templates;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        template = _ref[_i];
        if (!$("#import_items option[value='" + template.key + "']").is(':selected')) {
          continue;
        }
        matched = false;
        _ref1 = ext.templates;
        for (index = _j = 0, _len1 = _ref1.length; _j < _len1; index = ++_j) {
          existing = _ref1[index];
          if (!(existing.key === template.key)) {
            continue;
          }
          matched = true;
          template.index = index;
          ext.templates[index] = template;
        }
        if (!matched) {
          template.index = ext.templates.length;
          ext.templates.push(template);
        }
      }
      store.set('templates', ext.templates);
      ext.updateTemplates();
      loadTemplateRows();
      updateToolbarTemplates();
      analytics.track('Templates', 'Imported', data.version, data.templates.length);
      $('#import_wizard').modal('hide');
      $('#template_search :reset').hide();
      return $('#template_search :text').val('');
    });
    $('#import_close_btn').on('click', function() {
      return $('#import_wizard').modal('hide');
    });
    $('#import_paste_btn').on('click', function() {
      $('#import_file_btn').val('');
      $('#import_content').val(ext.paste());
      return $(this).text(i18n.get('opt_import_wizard_paste_alt_button')).delay(800).queue(function() {
        return $(this).text(i18n.get('opt_import_wizard_paste_button')).dequeue();
      });
    });
    return $('#import_continue_btn').on('click', function() {
      var $this, error, list, str, template, _i, _len, _ref;

      $this = $(this).prop('disabled', true);
      data = null;
      list = $('#import_items');
      str = $('#import_content').val();
      $('#import_error').find('span').html('&nbsp;').end().hide();
      list.find('option').remove();
      try {
        data = readImport(createImport(str));
        if (data.templates.length) {
          $('#import_count').text(data.templates.length);
          _ref = data.templates;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            template = _ref[_i];
            list.append($('<option/>', {
              text: template.title,
              value: template.key
            }));
          }
          $('#import_final_btn').prop('disabled', true);
          $('#import_wizard_stage1, #import_continue_btn').hide();
          $('#import_wizard_stage2, #import_back_btn, #import_final_btn').show();
        }
      } catch (_error) {
        error = _error;
        log.warn('The following error occurred when parsing the imported data', error);
        $('#import_error').find('span').text(error).end().show();
      }
      return $this.prop('disabled', false);
    });
  };

  loadTemplateRows = function(templates, pagination) {
    var modifiers, table, template, _i, _len;

    if (templates == null) {
      templates = ext.templates;
    }
    if (pagination == null) {
      pagination = true;
    }
    log.trace();
    table = $('#templates');
    table.find('tbody tr').remove();
    if (templates.length) {
      modifiers = ext.modifiers();
      for (_i = 0, _len = templates.length; _i < _len; _i++) {
        template = templates[_i];
        table.append(loadTemplate(template, modifiers));
      }
      if (pagination) {
        paginate(templates);
      }
      activateTooltips(table);
      activateDraggables();
      activateModifications();
    } else {
      table.find('tbody').append($('<tr/>').append($('<td/>', {
        colspan: table.find('thead th').length,
        html: i18n.get('opt_no_templates_found_text')
      })));
    }
    return activateSelections();
  };

  loadToolbar = function() {
    var close, options, popup, _ref;

    log.trace();
    _ref = store.get('toolbar'), close = _ref.close, popup = _ref.popup, options = _ref.options;
    if (popup) {
      $('#toolbarPopupYes').addClass('active');
    } else {
      $('#toolbarPopupNo').addClass('active');
    }
    $('#toolbarClose').prop('checked', close);
    $('#toolbarOptions').prop('checked', options);
    updateToolbarTemplates();
    loadToolbarControlEvents();
    return loadToolbarSaveEvents();
  };

  loadToolbarControlEvents = function() {
    log.trace();
    return $('#toolbarPopup .btn').on('click', function() {
      return $("." + ($(this).attr('id'))).show().siblings().hide();
    }).filter('.active').trigger('click');
  };

  loadToolbarSaveEvents = function() {
    log.trace();
    $('#toolbarPopup .btn').on('click', function() {
      var popup;

      popup = !$('#toolbarPopupYes').hasClass('active');
      store.modify('toolbar', function(toolbar) {
        return toolbar.popup = popup;
      });
      ext.updateToolbar();
      log.debug("Toolbar popup enabled: " + popup);
      return analytics.track('Toolbars', 'Changed', 'Behaviour', Number(popup));
    });
    return bindSaveEvent('#toolbarClose, #toolbarKey, #toolbarOptions', 'change', 'toolbar', function(key) {
      var value;

      value = key === 'key' ? this.val() : this.is(':checked');
      log.debug("Changing toolbar " + key + " to '" + value + "'");
      return value;
    }, function(jel, key, value) {
      ext.updateToolbar();
      return analytics.track('Toolbars', 'Change', utils.capitalize(key), key === 'key' ? Number(value) : void 0);
    });
  };

  loadUrlShorteners = function() {
    var yourls;

    log.trace();
    $('input[name="enabled_shortener"]').each(function() {
      var $this;

      $this = $(this);
      $this.prop('checked', store.get("" + ($this.attr('id')) + ".enabled"));
      return true;
    });
    yourls = store.get('yourls');
    $('#yourlsAuthentication' + ((function() {
      switch (yourls.authentication) {
        case 'advanced':
          return 'Advanced';
        case 'basic':
          return 'Basic';
        default:
          return 'None';
      }
    })())).addClass('active');
    $('#yourlsPassword').val(yourls.password);
    $('#yourlsSignature').val(yourls.signature);
    $('#yourlsUrl').val(yourls.url);
    $('#yourlsUsername').val(yourls.username);
    loadUrlShortenerAccounts();
    loadUrlShortenerControlEvents();
    return loadUrlShortenerSaveEvents();
  };

  loadUrlShortenerAccounts = function() {
    var shortener, shorteners, _i, _len, _results;

    log.trace();
    shorteners = _.filter(ext.shorteners, function(shortener) {
      return shortener.oauth != null;
    });
    _results = [];
    for (_i = 0, _len = shorteners.length; _i < _len; _i++) {
      shortener = shorteners[_i];
      _results.push((function(shortener) {
        var button;

        button = $("#" + shortener.name + "Account");
        button.on('click', function() {
          var $this;

          $this = $(this).blur();
          if ($this.data('oauth') !== 'true') {
            $this.tooltip('hide');
            log.debug("Attempting to authorize " + shortener.name);
            return shortener.oauth.authorize(function() {
              var success;

              log.debug("Authorization response for " + shortener.name + "...", arguments);
              success = shortener.oauth.hasAccessToken();
              if (success) {
                $this.addClass('btn-danger').removeClass('btn-success');
                $this.data('oauth', 'true');
                $this.html(i18n.get('opt_url_shortener_logout_button'));
              }
              return analytics.track('Shorteners', 'Login', shortener.title, Number(success));
            });
          } else {
            log.debug("Removing authorization for " + shortener.name);
            shortener.oauth.clearAccessToken();
            if ($this.attr('id') === 'bitlyAccount') {
              shortener.oauth.clear('apiKey');
              shortener.oauth.clear('login');
            }
            $this.addClass('btn-success').removeClass('btn-danger');
            $this.data('oauth', 'false');
            $this.html(i18n.get('opt_url_shortener_login_button'));
            return analytics.track('Shorteners', 'Logout', shortener.title);
          }
        });
        if (shortener.oauth.hasAccessToken()) {
          button.addClass('btn-danger').removeClass('btn-success');
          button.data('oauth', 'true');
          return button.html(i18n.get('opt_url_shortener_logout_button'));
        } else {
          button.addClass('btn-success').removeClass('btn-danger');
          button.data('oauth', 'false');
          return button.html(i18n.get('opt_url_shortener_login_button'));
        }
      })(shortener));
    }
    return _results;
  };

  loadUrlShortenerControlEvents = function() {
    log.trace();
    return $('#yourlsAuthentication button').on('click', function() {
      return $("." + ($(this).attr('id'))).show().siblings().hide();
    }).filter('.active').trigger('click');
  };

  loadUrlShortenerSaveEvents = function() {
    var yourlsFields;

    log.trace();
    $('input[name="enabled_shortener"]').on('change', function() {
      return store.modify('bitly', 'googl', 'yourls', function(data, key) {
        var enabled, shortener;

        enabled = data.enabled = $("#" + key).is(':checked');
        if (enabled) {
          shortener = _.findWhere(ext.shorteners, {
            name: key
          });
          log.debug("Enabling " + shortener.title + " URL shortener");
          return analytics.track('Shorteners', 'Enabled', shortener.title);
        }
      });
    });
    $('#yourlsAuthentication button').on('click', function() {
      var $this, auth;

      $this = $(this);
      auth = $this.attr('id').match(/yourlsAuthentication(.*)/)[1];
      store.modify('yourls', function(yourls) {
        return yourls.authentication = auth === 'None' ? '' : auth.toLowerCase();
      });
      log.debug("YOURLS authentication changed: " + auth);
      return analytics.track('Shorteners', 'Changed', 'YOURLS Authentication', $this.index());
    });
    yourlsFields = '#yourlsPassword, #yourlsSignature, #yourlsUrl, #yourlsUsername';
    return bindSaveEvent(yourlsFields, 'input', 'yourls', function() {
      return this.val().trim();
    });
  };

  deleteTemplates = function(templates) {
    var i, keys, list, retain, template, _i, _j, _len, _len1, _ref, _ref1;

    log.trace();
    keys = [];
    list = [];
    for (_i = 0, _len = templates.length; _i < _len; _i++) {
      template = templates[_i];
      if (!(!template.readOnly)) {
        continue;
      }
      keys.push(template.key);
      list.push(template);
    }
    if (!keys.length) {
      return;
    }
    retain = [];
    _ref = ext.templates;
    for (i = _j = 0, _len1 = _ref.length; _j < _len1; i = ++_j) {
      template = _ref[i];
      if (!(_ref1 = template.key, __indexOf.call(keys, _ref1) < 0)) {
        continue;
      }
      template.index = retain.length;
      retain.push(template);
    }
    store.set('templates', retain);
    ext.updateTemplates();
    if (keys.length > 1) {
      log.debug("Deleted " + keys.length + " templates");
      analytics.track('Templates', 'Deleted', "Count[" + keys.length + "]");
    } else {
      template = list[0];
      log.debug("Deleted " + template.title + " template");
      analytics.track('Templates', 'Deleted', template.title);
    }
    loadTemplateRows(searchResults != null ? searchResults : ext.templates);
    return updateToolbarTemplates();
  };

  enableTemplates = function(templates, enable) {
    var action, keys, template, _i, _len, _ref, _ref1;

    if (enable == null) {
      enable = true;
    }
    log.trace();
    keys = _.pluck(templates, 'key');
    if (!keys.length) {
      return;
    }
    _ref = ext.templates;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      template = _ref[_i];
      if (_ref1 = template.key, __indexOf.call(keys, _ref1) >= 0) {
        template.enabled = enable;
      }
    }
    store.set('templates', ext.templates);
    ext.updateTemplates();
    action = enable ? 'Enabled' : 'Disabled';
    if (keys.length > 1) {
      log.debug("" + action + " " + keys.length + " templates");
      analytics.track('Templates', action, "Count[" + keys.length + "]");
    } else {
      template = templates[0];
      log.debug("" + action + " " + template.title + " template");
      analytics.track('Templates', action, template.title);
    }
    return loadTemplateRows(searchResults != null ? searchResults : ext.templates);
  };

  reorderTemplates = function(fromIndex, toIndex) {
    log.trace();
    if ((fromIndex != null) && (toIndex != null)) {
      ext.templates[fromIndex].index = toIndex;
      ext.templates[toIndex].index = fromIndex;
    }
    store.set('templates', ext.templates);
    ext.updateTemplates();
    return updateToolbarTemplates();
  };

  saveTemplate = function(template) {
    var action, i, isNew, temp, templates, _i, _len;

    log.trace();
    log.debug('Saving the following template...', template);
    isNew = template.key == null;
    templates = store.get('templates');
    if (isNew) {
      template.index = templates.length;
      template.key = utils.keyGen();
      templates.push(template);
    } else {
      for (i = _i = 0, _len = templates.length; _i < _len; i = ++_i) {
        temp = templates[i];
        if (!(temp.key === template.key)) {
          continue;
        }
        templates[i] = template;
        break;
      }
    }
    store.set('templates', templates);
    ext.updateTemplates();
    loadTemplateRows();
    updateToolbarTemplates();
    action = isNew ? 'Added' : 'Saved';
    analytics.track('Templates', action, template.title);
    return template;
  };

  updateImportedTemplate = function(template, existing) {
    var _ref;

    log.trace();
    log.debug('Updating an existing template with the following imported data...', template);
    existing.enabled = template.enabled;
    existing.usage = template.usage;
    if (!existing.readOnly) {
      existing.content = template.content;
      if ((0 < (_ref = template.title.length) && _ref <= 32)) {
        existing.title = template.title;
      }
    }
    if (template.image === '' || icons.exists(template.image)) {
      existing.image = template.image;
    }
    if (template.shortcut === '' || isShortcutValid(template.shortcut)) {
      existing.shortcut = template.shortcut;
    }
    log.debug('Updated the following template...', existing);
    return existing;
  };

  updateToolbarTemplates = function() {
    var lastSelectedTemplate, lastSelectedTemplateKey, opt, template, toolbarKey, toolbarTemplates, _i, _len, _ref, _ref1, _results;

    log.trace();
    toolbarKey = store.get('toolbar.key');
    toolbarTemplates = $('#toolbarKey');
    lastSelectedTemplate = toolbarTemplates.find('option:selected');
    lastSelectedTemplateKey = lastSelectedTemplate.length ? lastSelectedTemplate.val() : '';
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

  isKeyValid = function(key) {
    log.trace();
    return R_VALID_KEY.test(key);
  };

  isShortcutValid = function(shortcut) {
    log.trace();
    return R_VALID_SHORTCUT.test(shortcut);
  };

  validateImportedTemplate = function(template) {
    log.trace();
    log.debug('Validating property types of the following imported template...', template);
    return 'object' === typeof template && 'string' === typeof template.content && 'boolean' === typeof template.enabled && 'string' === typeof template.image && 'string' === typeof template.key && 'string' === typeof template.shortcut && 'string' === typeof template.title && 'number' === typeof template.usage;
  };

  validateTemplate = function(template) {
    var errors, isNew;

    log.trace();
    isNew = template.key == null;
    errors = [];
    log.debug('Validating the following template...', template);
    if (!template.readOnly && !template.title) {
      errors.push(new ValidationError('template_title', 'opt_template_title_invalid'));
    }
    if (template.shortcut && !isShortcutValid(template.shortcut)) {
      errors.push(new ValidationError('template_shortcut', 'opt_template_shortcut_invalid'));
    }
    log.debug('Following validation errors were found...', errors);
    return errors;
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
      if (this.headerKey && (this.header == null)) {
        this.header = i18n.get(this.headerKey);
      }
      if (this.messageKey && (this.message == null)) {
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

  addImportedTemplate = function(template) {
    var newTemplate, _ref;

    log.trace();
    log.debug('Creating a new template with the following details...', template);
    if (isKeyValid(template.key)) {
      newTemplate = {
        content: template.content,
        enabled: template.enabled,
        image: '',
        key: template.key,
        readOnly: false,
        shortcut: '',
        title: i18n.get('untitled'),
        usage: template.usage
      };
      if (icons.exists(template.image)) {
        newTemplate.image = template.image;
      }
      if (isShortcutValid(template.shortcut)) {
        newTemplate.shortcut = template.shortcut;
      }
      if ((0 < (_ref = template.title.length) && _ref <= 32)) {
        newTemplate.title = template.title;
      }
    }
    log.debug('Following template was created...', newTemplate);
    return newTemplate;
  };

  activateDraggables = function() {
    var dragSource, draggables, table;

    log.trace();
    table = $('#templates');
    dragSource = null;
    draggables = table.find('[draggable]');
    draggables.off('dragstart dragend dragenter dragover drop');
    draggables.on('dragstart', function(e) {
      var $this;

      $this = $(this);
      dragSource = this;
      table.removeClass('table-hover');
      $this.addClass('dnd-moving');
      $this.find('[data-original-title]').tooltip('hide');
      e.originalEvent.dataTransfer.effectAllowed = 'move';
      return e.originalEvent.dataTransfer.setData('text/html', $this.html());
    });
    draggables.on('dragend', function(e) {
      dragSource = null;
      draggables.removeClass('dnd-moving dnd-over');
      return table.addClass('table-hover');
    });
    draggables.on('dragenter', function(e) {
      var $this;

      $this = $(this);
      draggables.not($this).removeClass('dnd-over');
      return $this.addClass('dnd-over');
    });
    draggables.on('dragover', function(e) {
      e.originalEvent.dataTransfer.dropEffect = 'move';
      e.preventDefault();
      return false;
    });
    return draggables.on('drop', function(e) {
      var $dragSource, $this, fromIndex, toIndex;

      $dragSource = $(dragSource);
      e.stopPropagation();
      if (dragSource !== this) {
        $this = $(this);
        $dragSource.html($this.html());
        $this.html(e.originalEvent.dataTransfer.getData('text/html'));
        activateTooltips(table);
        activateModifications();
        activateSelections();
        fromIndex = $dragSource.index();
        toIndex = $this.index();
        if (searchResults != null) {
          fromIndex = searchResults[fromIndex].index;
          toIndex = searchResults[toIndex].index;
        }
        reorderTemplates(fromIndex, toIndex);
      }
      return false;
    });
  };

  activateModifications = function() {
    log.trace();
    return $('#templates tbody tr td:not(:first-child)').off('click').on('click', function() {
      var key;

      key = $(this).parents('tr:first').find(':checkbox').val();
      return openWizard(_.findWhere(ext.templates, {
        key: key
      }));
    });
  };

  activateSelections = function() {
    var selectBoxes, table;

    log.trace();
    table = $('#templates');
    selectBoxes = table.find('tbody :checkbox');
    selectBoxes.off('change').on('change', function() {
      var $this, messageKey;

      $this = $(this);
      messageKey = 'opt_select_box';
      if ($this.is(':checked')) {
        messageKey += '_checked';
      }
      $this.attr('data-original-title', i18n.get(messageKey));
      return refreshSelectButtons();
    });
    table.find('thead :checkbox').off('change').on('change', function() {
      var $this, checked, messageKey;

      $this = $(this);
      checked = $this.is(':checked');
      messageKey = 'opt_select_all_box';
      if (checked) {
        messageKey += '_checked';
      }
      $this.attr('data-original-title', i18n.get(messageKey));
      selectBoxes.prop('checked', checked);
      return refreshSelectButtons();
    });
    return refreshSelectButtons();
  };

  activateTooltips = function(selector) {
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

  clearContext = function() {
    log.trace();
    return setContext(null);
  };

  closeWizard = function() {
    log.trace();
    clearContext();
    return $('#template_wizard').modal('hide');
  };

  createExport = function(templates) {
    var data, template, _i, _len, _ref;

    log.trace();
    log.debug('Creating an export string for the following templates...', templates);
    data = {
      templates: templates.slice(0),
      version: ext.version
    };
    _ref = data.templates;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      template = _ref[_i];
      delete template.menuId;
    }
    if (data.templates.length) {
      analytics.track('Templates', 'Exported', ext.version, data.templates.length);
    }
    log.debug('Following export data has been created...', data);
    return JSON.stringify(data);
  };

  createImport = function(str) {
    var data, error;

    log.trace();
    log.debug('Parsing the following import string...', str);
    try {
      data = JSON.parse(str);
    } catch (_error) {
      error = _error;
      throw i18n.get('error_import_data');
    }
    if (!_.isArray(data.templates) || _.isEmpty(data.templates) || !_.isString(data.version)) {
      throw i18n.get('error_import_invalid');
    }
    log.debug('Following data was created from the string...', data);
    return data;
  };

  deriveTemplate = function() {
    var readOnly, template, _ref, _ref1, _ref2;

    log.trace();
    readOnly = (_ref = activeTemplate.readOnly) != null ? _ref : false;
    template = {
      content: readOnly ? activeTemplate.content : $('#template_content').val(),
      enabled: $('#template_enabled').is(':checked'),
      image: $('#template_image').val(),
      index: (_ref1 = activeTemplate.index) != null ? _ref1 : ext.templates.length,
      key: activeTemplate.key,
      readOnly: readOnly,
      shortcut: utils.trimToUpper($('#template_shortcut').val()),
      title: readOnly ? activeTemplate.title : $('#template_title').val().trim(),
      usage: (_ref2 = activeTemplate.usage) != null ? _ref2 : 0
    };
    log.debug('Following template was derived...', template);
    return template;
  };

  feedback = function() {
    var UserVoice, script, uv;

    log.trace();
    if (feedbackAdded) {
      return;
    }
    uv = document.createElement('script');
    uv.async = 'async';
    uv.src = "https://widget.uservoice.com/" + ext.config.options.userVoice.id + ".js";
    script = document.getElementsByTagName('script')[0];
    script.parentNode.insertBefore(uv, script);
    UserVoice = window.UserVoice || (window.UserVoice = []);
    UserVoice.push([
      'showTab', 'classic_widget', {
        mode: 'full',
        primary_color: '#333',
        link_color: '#08c',
        default_mode: 'feedback',
        forum_id: ext.config.options.userVoice.forum,
        tab_label: i18n.get('opt_feedback_button'),
        tab_color: '#333',
        tab_position: 'middle-left',
        tab_inverted: true
      }
    ]);
    return feedbackAdded = true;
  };

  getSelectedTemplates = function() {
    var keys;

    log.trace();
    keys = [];
    $('#templates tbody :checkbox:checked').each(function() {
      return keys.push($(this).val());
    });
    return _.filter(ext.templates, function(template) {
      var _ref;

      return _ref = template.key, __indexOf.call(keys, _ref) >= 0;
    });
  };

  openWizard = function(template) {
    log.trace();
    if (arguments.length) {
      setContext(template);
    }
    return $('#template_wizard').modal('show');
  };

  paginate = function(templates) {
    var children, limit, list, page, pages, pagination, refreshPagination, _i;

    log.trace();
    limit = parseInt($('#template_filter').val());
    pagination = $('#pagination');
    if ((templates.length > limit && limit > 0)) {
      children = pagination.find('ul li');
      pages = Math.ceil(templates.length / limit);
      refreshPagination = function(page) {
        var end, start;

        if (page == null) {
          page = 1;
        }
        start = limit * (page - 1);
        end = start + limit;
        loadTemplateRows(templates.slice(start, end), false);
        pagination.find('ul li:first-child').each(function() {
          if (page === 1) {
            return $(this).addClass('disabled');
          } else {
            return $(this).removeClass('disabled');
          }
        });
        pagination.find('ul li:not(:first-child, :last-child)').each(function() {
          var $this;

          $this = $(this);
          if (page === parseInt($this.text())) {
            return $this.addClass('active');
          } else {
            return $this.removeClass('active');
          }
        });
        return pagination.find('ul li:last-child').each(function() {
          var $this;

          $this = $(this);
          if (page === pages) {
            return $this.addClass('disabled');
          } else {
            return $this.removeClass('disabled');
          }
        });
      };
      if (pages !== children.length - 2) {
        children.remove();
        list = pagination.find('ul');
        list.append($('<li/>').append($('<a>&laquo;</a>')));
        for (page = _i = 1; 1 <= pages ? _i <= pages : _i >= pages; page = 1 <= pages ? ++_i : --_i) {
          list.append($('<li/>').append($("<a>" + page + "</a>")));
        }
        list.append($('<li/>').append($('<a>&raquo;</a>')));
      }
      pagination.find('ul li').off('click');
      pagination.find('ul li:first-child').on('click', function() {
        if (!$(this).hasClass('disabled')) {
          return refreshPagination(pagination.find('ul li.active').index() - 1);
        }
      });
      pagination.find('ul li:not(:first-child, :last-child)').on('click', function() {
        var $this;

        $this = $(this);
        if (!$this.hasClass('active')) {
          return refreshPagination($this.index());
        }
      });
      pagination.find('ul li:last-child').on('click', function() {
        if (!$(this).hasClass('disabled')) {
          return refreshPagination(pagination.find('ul li.active').index() + 1);
        }
      });
      refreshPagination();
      return pagination.show();
    } else {
      return pagination.hide().find('ul li').remove();
    }
  };

  readImport = function(importData) {
    var data, existing, i, imported, keys, storedKeys, template, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;

    log.trace();
    log.debug('Importing the following data...', importData);
    data = {
      templates: []
    };
    keys = [];
    storedKeys = _.pluck(ext.templates, 'key');
    _ref = importData.templates;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      template = _ref[_i];
      existing = {};
      if (importData.version < '1.0.0') {
        template.key = ext.getKeyForName(template.name);
        template.usage = 0;
        template.image = template.image > 0 ? ((_ref1 = icons.fromLegacy(template.image - 1)) != null ? _ref1.name : void 0) || '' : '';
      } else if (importData.version < '1.1.0') {
        template.image = ((_ref2 = icons.fromLegacy(template.image)) != null ? _ref2.name : void 0) || '';
      }
      if (validateImportedTemplate(template)) {
        if ((_ref3 = template.key, __indexOf.call(storedKeys, _ref3) < 0) && (_ref4 = template.key, __indexOf.call(keys, _ref4) < 0)) {
          template = addImportedTemplate(template);
          if (template) {
            template.index = storedKeys.length + keys.length;
            data.templates.push(template);
            keys.push(template.key);
          }
        } else {
          _ref5 = data.templates;
          for (i = _j = 0, _len1 = _ref5.length; _j < _len1; i = ++_j) {
            imported = _ref5[i];
            if (!(imported.key === template.key)) {
              continue;
            }
            existing = updateImportedTemplate(template, imported);
            data.templates[i] = existing;
            break;
          }
          if (!existing.key) {
            existing = $.extend(true, {}, _.findWhere(ext.templates, {
              key: template.key
            }));
            if (existing && !_.isEmpty(existing)) {
              existing = updateImportedTemplate(template, existing);
              data.templates.push(existing);
              keys.push(existing.key);
            }
          }
        }
      }
    }
    log.debug('Following data was derived from that imported...', data);
    return data;
  };

  refreshResetButton = function() {
    var container, resetBtn;

    log.trace();
    container = $('#template_search');
    resetBtn = container.find(':reset');
    if (container.find(':text').val()) {
      container.addClass('input-prepend');
      return resetBtn.show();
    } else {
      resetBtn.hide();
      return container.removeClass('input-prepend');
    }
  };

  refreshSelectButtons = function() {
    var buttons, selections;

    log.trace();
    buttons = $('#delete_btn, #disable_btn, #enable_btn, #export_btn');
    selections = $('#templates tbody :checkbox:checked');
    return buttons.prop('disabled', !selections.length);
  };

  resetWizard = function() {
    var imgOpt, _ref;

    log.trace();
    if (activeTemplate == null) {
      activeTemplate = {};
    }
    $('#template_wizard .modal-header h3').html(activeTemplate.key != null ? i18n.get('opt_template_modify_title', activeTemplate.title) : i18n.get('opt_template_new_header'));
    $('#template_enabled').prop('checked', (_ref = activeTemplate.enabled) != null ? _ref : true);
    $('#template_content').val(activeTemplate.content || '');
    $('#template_shortcut').val(activeTemplate.shortcut || '');
    $('#template_title').val(activeTemplate.title || '');
    imgOpt = $("#template_image option[value='" + activeTemplate.image + "']");
    if (imgOpt.length === 0) {
      $('#template_image option:first-child').attr('selected', 'selected');
    } else {
      imgOpt.prop('selected', true);
    }
    $('#template_image').trigger('change');
    $('#template_content, #template_title').prop('disabled', !!activeTemplate.readOnly);
    return $('#template_delete_btn').each(function() {
      var $this;

      $this = $(this);
      $this.prop('disabled', !!activeTemplate.readOnly);
      if (activeTemplate.key != null) {
        return $this.show();
      } else {
        return $this.hide();
      }
    });
  };

  searchTemplates = function(query) {
    var expression, keyword, keywords;

    if (query == null) {
      query = '';
    }
    log.trace();
    keywords = query.replace(R_CLEAN_QUERY, '').split(R_WHITESPACE);
    if (keywords.length) {
      expression = RegExp("" + (((function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = keywords.length; _i < _len; _i++) {
          keyword = keywords[_i];
          if (keyword) {
            _results.push(keyword);
          }
        }
        return _results;
      })()).join('|')), "i");
      searchResults = _.filter(ext.templates, function(template) {
        return expression.test("" + template.content + " " + template.title);
      });
    } else {
      searchResults = null;
    }
    loadTemplateRows(searchResults != null ? searchResults : ext.templates);
    return refreshResetButton();
  };

  setContext = function(template) {
    if (template == null) {
      template = {};
    }
    log.trace();
    activeTemplate = $.extend({}, template);
    return resetWizard();
  };

  options = window.options = new (Options = (function(_super) {
    __extends(Options, _super);

    function Options() {
      _ref = Options.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Options.prototype.init = function() {
      var initialTabChange, navHeight, optionsActiveTab;

      log.trace();
      log.info('Initializing the options page');
      if (store.get('analytics')) {
        analytics.add();
      }
      feedback();
      i18n.init({
        bitlyAccount: {
          opt_url_shortener_account_title: i18n.get('shortener_bitly')
        },
        googlAccount: {
          opt_url_shortener_account_title: i18n.get('shortener_googl')
        },
        version_definition: {
          opt_guide_standard_version_text: ext.version
        }
      });
      $('.year-repl').html("" + (new Date().getFullYear()));
      initialTabChange = true;
      $('a[tabify]').on('click', function() {
        var id, nav, parent, target;

        target = $(this).attr('tabify');
        nav = $("#navigation a[tabify='" + target + "']");
        parent = nav.parent('li');
        if (!parent.hasClass('active')) {
          parent.addClass('active').siblings().removeClass('active');
          $(target).show().siblings('.tab').hide();
          id = nav.attr('id');
          store.set('options_active_tab', id);
          if (!initialTabChange) {
            id = utils.capitalize(id.match(/(\S*)_nav$/)[1]);
            log.debug("Changing tab to " + id);
            analytics.track('Tabs', 'Changed', id);
          }
          initialTabChange = false;
          return $(document.body).scrollTop(0);
        }
      });
      store.init('options_active_tab', 'general_nav');
      optionsActiveTab = store.get('options_active_tab');
      $("#" + optionsActiveTab).trigger('click');
      log.debug("Initially displaying tab for " + optionsActiveTab);
      $('#tools_nav').on('click', function() {
        return $('#tools_wizard').modal('show');
      });
      $('.tools_close_btn').on('click', function() {
        return $('#tools_wizard').modal('hide');
      });
      $('form:not([target="_blank"])').on('submit', function() {
        return false;
      });
      $('footer a[href*="neocotic.com"]').on('click', function() {
        return analytics.track('Footer', 'Clicked', 'Homepage');
      });
      $('#donation input[name="hosted_button_id"]').val(ext.config.options.payPal);
      $('#donation').on('submit', function() {
        return analytics.track('Footer', 'Clicked', 'Donate');
      });
      load();
      $('.modal').on('shown', function() {
        return $(this).find(':input:enabled:first').focus();
      });
      $('#template_shortcut_modifier').html(ext.modifiers());
      $('[popover]').each(function() {
        var $this, placement, trigger;

        $this = $(this);
        placement = $this.attr('data-placement');
        placement = placement != null ? utils.trimToLower(placement) : 'right';
        trigger = $this.attr('data-trigger');
        trigger = trigger != null ? utils.trimToLower(trigger) : 'hover';
        $this.popover({
          placement: placement,
          trigger: trigger,
          html: true,
          content: function() {
            return i18n.get($this.attr('popover'));
          }
        });
        if (trigger === 'manual') {
          return $this.on('click', function() {
            return $this.popover('toggle');
          });
        }
      });
      activateTooltips();
      navHeight = $('.navbar').height();
      return $('[data-goto]').on('click', function() {
        var goto, pos, _ref1;

        goto = $($(this).attr('data-goto'));
        pos = ((_ref1 = goto.position()) != null ? _ref1.top : void 0) || 0;
        if (pos && pos >= navHeight) {
          pos -= navHeight;
        }
        log.debug("Relocating view to include '" + goto.selector + "' at " + pos);
        return $(window).scrollTop(pos);
      });
    };

    return Options;

  })(utils.Class));

  utils.ready(function() {
    return options.init();
  });

}).call(this);
