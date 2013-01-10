// [Template](http://neocotic.com/template)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/template>
(function() {
  var ErrorMessage, Message, Options, R_CLEAN_QUERY, R_VALID_KEY, R_VALID_SHORTCUT, R_WHITESPACE, SuccessMessage, ValidationError, ValidationWarning, WIDGET_SOURCE, WarningMessage, activateDraggables, activateModifications, activateSelections, activateTooltips, activeTemplate, addImportedTemplate, bindSaveEvent, clearContext, clearErrors, closeWizard, createExport, createImport, deleteTemplates, deriveTemplate, deriveTemplateNew, ext, feedback, feedbackAdded, fileErrorHandler, getSelectedTemplates, isKeyNew, isKeyValid, isShortcutValid, load, loadControlEvents, loadDeveloperTools, loadImages, loadLogger, loadLoggerSaveEvents, loadNotificationSaveEvents, loadNotifications, loadSaveEvents, loadTemplate, loadTemplateControlEvents, loadTemplateExportEvents, loadTemplateImportEvents, loadTemplateRows, loadTemplates, loadToolbar, loadToolbarControlEvents, loadToolbarSaveEvents, loadUrlShortenerAccounts, loadUrlShortenerControlEvents, loadUrlShortenerSaveEvents, loadUrlShorteners, openWizard, options, paginate, readImport, refreshResetButton, refreshSelectButtons, reorderTemplates, resetWizard, saveTemplate, saveTemplates, searchResults, searchTemplates, setContext, showErrors, trimToLower, trimToUpper, updateImportedTemplate, updateTemplate, updateToolbarTemplates, validateImportedTemplate, validateTemplate, validateTemplateNew,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  R_CLEAN_QUERY = /[^\w\s]/g;

  R_VALID_KEY = /^[A-Z0-9]*\.[A-Z0-9]*$/i;

  R_VALID_SHORTCUT = /[A-Z0-9]/i;

  R_WHITESPACE = /\s+/;

  WIDGET_SOURCE = "https://widget.uservoice.com/RSRS5SpMkMxvKOCs27g.js";

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
        key = $this.attr('id').match(new RegExp("^" + option + "(\\S*)"))[1];
        key = key[0].toLowerCase() + key.substr(1);
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
    return $('#shortcutsEnabled').change(function() {
      var groups;
      groups = $('#shortcutsPaste').parents('.control-group').first();
      if ($(this).is(':checked')) {
        return groups.slideDown();
      } else {
        return groups.slideUp();
      }
    }).change();
  };

  loadDeveloperTools = function() {
    log.trace();
    return loadLogger();
  };

  loadImages = function() {
    var image, imagePreview, images, _i, _len, _ref;
    log.trace();
    imagePreview = $('#template_image_preview');
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
    images.change(function() {
      var opt;
      opt = images.find('option:selected');
      return imagePreview.attr('class', icons.getClass(opt.val()));
    });
    return images.change();
  };

  loadLogger = function() {
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
      var logger;
      logger = store.get('logger');
      chrome.extension.getBackgroundPage().log.config = log.config = logger;
      return analytics.track('Logging', 'Changed', key[0].toUpperCase() + key.substr(1), Number(value));
    });
  };

  loadNotifications = function() {
    var notifications;
    log.trace();
    notifications = store.get('notifications');
    if (notifications.enabled) {
      $('#notifications').attr('checked', 'checked');
    }
    $('#notificationDuration').val(notifications.duration > 0 ? notifications.duration * .001 : 0);
    return loadNotificationSaveEvents();
  };

  loadNotificationSaveEvents = function() {
    log.trace();
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
    return $('#notifications').change(function() {
      var _this = this;
      return store.modify('notifications', function(notifications) {
        var enabled;
        enabled = $(_this).is(':checked');
        log.debug("Changing notifications to '" + enabled + "'");
        notifications.enabled = enabled;
        return analytics.track('Notifications', 'Changed', 'Enabled', Number(enabled));
      });
    });
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
    bindSaveEvent('#anchorTarget, #anchorTitle', 'change', 'anchor', function(key) {
      var value;
      value = this.is(':checked');
      log.debug("Changing anchor " + key + " to '" + value + "'");
      return value;
    }, function(jel, key, value) {
      key = key[0].toUpperCase() + key.substr(1);
      return analytics.track('Anchors', 'Changed', key, Number(value));
    });
    bindSaveEvent('#menuEnabled, #menuOptions, #menuPaste', 'change', 'menu', function(key) {
      var value;
      value = this.is(':checked');
      log.debug("Changing context menu " + key + " to '" + value + "'");
      return value;
    }, function(jel, key, value) {
      ext.updateContextMenu();
      key = key[0].toUpperCase() + key.substr(1);
      return analytics.track('Context Menu', 'Changed', key, Number(value));
    });
    return bindSaveEvent('#shortcutsEnabled, #shortcutsPaste', 'change', 'shortcuts', function(key) {
      var value;
      value = this.is(':checked');
      log.debug("Changing keyboard shortcuts " + key + " to '" + value + "'");
      return value;
    }, function(jel, key, value) {
      key = key[0].toUpperCase() + key.substr(1);
      return analytics.track('Keyboard Shortcuts', 'Changed', key, Number(value));
    });
  };

  loadTemplates = function() {
    log.trace();
    loadTemplateRows();
    loadTemplateControlEvents();
    loadTemplateImportEvents();
    return loadTemplateExportEvents();
  };

  loadTemplate = function(template, shortcutModifiers) {
    var alignCenter, enabledIcon, row;
    log.trace();
    log.debug('Creating a row for the following template...', template);
    if (shortcutModifiers == null) {
      shortcutModifiers = ext.isThisPlatform('mac') ? ext.SHORTCUT_MAC_MODIFIERS : ext.SHORTCUT_MODIFIERS;
    }
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
      html: "<i class=\"" + (icons.getClass(template.image)) + "\"></i> " + template.title,
      title: i18n.get('opt_template_modify_title', template.title)
    })));
    row.append($('<td/>', {
      html: "" + shortcutModifiers + template.shortcut
    }));
    enabledIcon = template.enabled ? 'ok' : 'remove';
    row.append($('<td/>', alignCenter).append($('<i/>', {
      "class": "icon-" + enabledIcon
    })));
    row.append($('<td/>').append($('<span/>', {
      text: template.content,
      title: template.content
    })));
    row.append($('<td/>').append($('<span/>', {
      "class": 'muted',
      text: '::::',
      title: i18n.get('opt_template_move_title', template.title)
    })));
    return row;
  };

  loadTemplateControlEvents = function() {
    var selectedTemplates, validationErrors, warningMsg;
    log.trace();
    $('#template_wizard [tabify]').click(function() {
      return closeWizard();
    });
    $('#template_cancel_btn').click(function() {
      return closeWizard();
    });
    $('#template_reset_btn').click(function() {
      return resetWizard();
    });
    $('#template_filter').change(function() {
      return loadTemplateRows(searchResults != null ? searchResults : ext.templates);
    });
    $('#template_search :reset').click(function() {
      $('#template_search :text').val('');
      return searchTemplates();
    });
    $('#template_controls').submit(function() {
      return searchTemplates($('#template_search :text').val());
    });
    $('#template_delete_btn').click(function() {
      deleteTemplates([activeTemplate]);
      return closeWizard();
    });
    validationErrors = [];
    $('#template_wizard').on('hide', function() {
      var error, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = validationErrors.length; _i < _len; _i++) {
        error = validationErrors[_i];
        _results.push(error.hide());
      }
      return _results;
    });
    $('#template_save_btn').click(function() {
      var error, _i, _j, _len, _len1, _results;
      deriveTemplateNew();
      for (_i = 0, _len = validationErrors.length; _i < _len; _i++) {
        error = validationErrors[_i];
        error.hide();
      }
      validationErrors = validateTemplateNew(activeTemplate);
      if (validationErrors.length) {
        _results = [];
        for (_j = 0, _len1 = validationErrors.length; _j < _len1; _j++) {
          error = validationErrors[_j];
          _results.push(error.show());
        }
        return _results;
      } else {
        $.extend(activeTemplate, deriveTemplateNew());
        saveTemplate(activeTemplate);
        return closeWizard();
      }
    });
    $('#add_btn').click(function() {
      return openWizard(null);
    });
    selectedTemplates = [];
    $('#delete_wizard').on('hide', function() {
      selectedTemplates = [];
      return $('#delete_items li').remove();
    });
    warningMsg = null;
    $('#delete_btn').click(function() {
      var deleteItems, div, item, predefinedCount, predefinedTemplates, template, _i, _len;
      deleteItems = $('#delete_items');
      predefinedTemplates = $('<ul/>');
      selectedTemplates = getSelectedTemplates();
      deleteItems.find('li').remove();
      for (_i = 0, _len = selectedTemplates.length; _i < _len; _i++) {
        template = selectedTemplates[_i];
        item = $('<li/>', {
          text: template.title
        });
        if (template.readOnly) {
          predefinedTemplates.append(item);
        } else {
          deleteItems.append(item);
        }
      }
      predefinedCount = predefinedTemplates.find('li').length;
      if (predefinedCount) {
        if (warningMsg != null) {
          warningMsg.hide();
        }
        div = $('<div/>');
        div.append($('<p/>', {
          html: i18n.get(predefinedCount === 1 ? 'opt_template_delete_predefined_error_1' : 'opt_template_delete_multiple_predefined_error_1')
        }));
        div.append(predefinedTemplates);
        div.append($('<p/>', {
          html: i18n.get(predefinedCount === 1 ? 'opt_template_delete_predefined_error_2' : 'opt_template_delete_multiple_predefined_error_2')
        }));
        warningMsg = new WarningMessage(true);
        warningMsg.message = div.html();
        return warningMsg.show();
      } else {
        return $('#delete_wizard').modal('show');
      }
    });
    $('.delete_no_btn').click(function() {
      return $('#delete_wizard').modal('hide');
    });
    return $('.delete_yes_btn').click(function() {
      deleteTemplates(selectedTemplates);
      return $('#delete_wizard').modal('hide');
    });
  };

  loadTemplateExportEvents = function() {
    var templates;
    log.trace();
    templates = $('#templates');
    $('.export_error .close').on('click', function() {
      return $('.export_error').find('span').html('&nbsp').end().hide();
    });
    $('.export_back_btn').click(function() {
      log.info('Going back to previous export stage');
      $('.export_con_stage1').show();
      return $('.export_con_stage2').hide();
    });
    $('#export_btn').click(function() {
      var list;
      log.info('Launching export wizard');
      list = $('.export_con_list');
      list.find('option').remove();
      updateTemplate(templates.find('option:selected'));
      templates.val([]).change();
      $('.export_yes_btn').attr('disabled', 'disabled');
      $('.export_con_stage1').show();
      $('.export_con_stage2').hide();
      $('.export_content').val('');
      $('.export_error').find('span').html('&nbsp;').end().hide();
      templates.find('option').each(function() {
        var opt;
        opt = $(this);
        return list.append($('<option/>', {
          text: opt.text(),
          value: opt.val()
        }));
      });
      return $('#export_con').modal('show');
    });
    $('.export_con_list').change(function() {
      if ($(this).find('option:selected').length > 0) {
        return $('.export_yes_btn').removeAttr('disabled');
      } else {
        return $('.export_yes_btn').attr('disabled', 'disabled');
      }
    });
    $('.export_copy_btn').click(function(event) {
      var $this;
      $this = $(this);
      ext.copy($('.export_content').val(), true);
      $this.text(i18n.get('opt_export_wizard_copy_alt_button'));
      $this.delay(800);
      $this.queue(function() {
        $this.text(i18n.get('opt_export_wizard_copy_button'));
        return $this.dequeue();
      });
      return event.preventDefault();
    });
    $('.export_deselect_all_btn').click(function() {
      $('.export_con_list option').removeAttr('selected').parent().focus();
      return $('.export_yes_btn').attr('disabled', 'disabled');
    });
    $('.export_no_btn, .export_close_btn').click(function(event) {
      $('#export_con').modal('hide');
      return event.preventDefault();
    });
    $('.export_save_btn').click(function() {
      var $this, exportErrorHandler, str;
      $this = $(this);
      str = $this.parents('.export_con_stage2').find('.export_content').val();
      exportErrorHandler = fileErrorHandler(function(message) {
        log.error(message);
        return $('.export_error').find('span').text(message).end().show();
      });
      return window.webkitRequestFileSystem(window.TEMPORARY, 1024 * 1024, function(fs) {
        return fs.root.getFile('export.json', {
          create: true
        }, function(fileEntry) {
          return fileEntry.createWriter(function(fileWriter) {
            var builder, done;
            builder = new WebKitBlobBuilder();
            done = false;
            builder.append(str);
            fileWriter.onerror = exportErrorHandler;
            fileWriter.onwriteend = function() {
              if (done) {
                $('.export_error').find('span').html('&nbsp;').end().hide();
                return window.location.href = fileEntry.toURL();
              } else {
                done = true;
                return fileWriter.write(builder.getBlob('application/json'));
              }
            };
            return fileWriter.truncate(0);
          });
        }, exportErrorHandler);
      }, exportErrorHandler);
    });
    $('.export_select_all_btn').click(function() {
      $('.export_con_list option').attr('selected', 'selected').parent().focus();
      return $('.export_yes_btn').removeAttr('disabled');
    });
    return $('.export_yes_btn').click(function() {
      var $this, items, keys;
      $this = $(this);
      items = $this.parents('.export_con_stage1').find('.export_con_list option');
      keys = [];
      items.filter(':selected').each(function() {
        return keys.push($(this).val());
      });
      $('.export_content').val(createExport(keys));
      $('.export_error').find('span').html('&nbsp;').end().hide();
      $('.export_con_stage1').hide();
      return $('.export_con_stage2').show();
    });
  };

  loadTemplateImportEvents = function() {
    var data, templates;
    log.trace();
    data = null;
    templates = $('#templates');
    $('.import_error .close').on('click', function() {
      return $('.import_error').find('span').html('&nbsp').end().hide();
    });
    $('.import_back_btn').click(function() {
      log.info('Going back to previous import stage');
      $('.import_con_stage1').show();
      return $('.import_con_stage2, .import_con_stage3').hide();
    });
    $('#import_btn').click(function() {
      log.info('Launching import wizard');
      updateTemplate(templates.find('option:selected'));
      templates.val([]).change();
      $('.import_con_stage1').show();
      $('.import_con_stage2, .import_con_stage3').hide();
      $('.import_content').val('');
      $('.import_error').find('span').html('&nbsp;').end().hide();
      $('.import_file_btn').val('');
      return $('#import_con').modal('show');
    });
    $('.import_con_list').change(function() {
      if ($(this).find('option:selected').length > 0) {
        return $('.import_final_btn').removeAttr('disabled');
      } else {
        return $('.import_final_btn').attr('disabled', 'disabled');
      }
    });
    $('.import_deselect_all_btn').click(function() {
      $('.import_con_list option').removeAttr('selected').parent().focus();
      return $('.import_final_btn').attr('disabled', 'disabled');
    });
    $('.import_file_btn').change(function(event) {
      var file, reader;
      file = event.target.files[0];
      reader = new FileReader();
      reader.onerror = fileErrorHandler(function(message) {
        log.error(message);
        return $('.import_error').find('span').text(message).end().show();
      });
      reader.onload = function(evt) {
        var result;
        result = evt.target.result;
        log.debug('Following contents were read from the file...', result);
        $('.import_error').find('span').html('&nbsp;').end().hide();
        return $('.import_content').val(result);
      };
      return reader.readAsText(file);
    });
    $('.import_final_btn').click(function() {
      var $this, list;
      $this = $(this);
      list = $this.parents('.import_con_stage2').find('.import_con_list');
      list.find('option:selected').each(function() {
        var existingOpt, opt;
        opt = $(this);
        existingOpt = templates.find("option[value='" + (opt.val()) + "']");
        opt.removeAttr('selected');
        if (existingOpt.length === 0) {
          return templates.append(opt);
        } else {
          return existingOpt.replaceWith(opt);
        }
      });
      $('#import_con').modal('hide');
      updateToolbarTemplates();
      templates.focus();
      saveTemplates(true);
      if (data != null) {
        return analytics.track('Templates', 'Imported', data.version, data.templates.length);
      }
    });
    $('.import_no_btn, .import_close_btn').click(function() {
      return $('#import_con').modal('hide');
    });
    $('.import_paste_btn').click(function() {
      var $this;
      $this = $(this);
      $('.import_file_btn').val('');
      $('.import_content').val(ext.paste());
      $this.text(i18n.get('opt_import_wizard_paste_alt_button'));
      $this.delay(800);
      return $this.queue(function() {
        $this.text(i18n.get('opt_import_wizard_paste_button'));
        return $this.dequeue();
      });
    });
    $('.import_select_all_btn').click(function() {
      $('.import_con_list option').attr('selected', 'selected').parent().focus();
      return $('.import_final_btn').removeAttr('disabled');
    });
    return $('.import_yes_btn').click(function() {
      var $this, importData, list, str, template, _i, _len, _ref;
      $this = $(this).attr('disabled', 'disabled');
      list = $('.import_con_list');
      str = $this.parents('.import_con_stage1').find('.import_content').val();
      $('.import_error').find('span').html('&nbsp;').end().hide();
      try {
        importData = createImport(str);
      } catch (error) {
        log.error(error);
        $('.import_error').find('span').text(error).end().show();
      }
      if (importData) {
        data = readImport(importData);
        if (data.templates.length === 0) {
          $('.import_con_stage3').show();
          $('.import_con_stage1, .import_con_stage2').hide();
        } else {
          list.find('option').remove();
          $('.import_count').text(data.templates.length);
          _ref = data.templates;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            template = _ref[_i];
            list.append(loadTemplate(template));
          }
          $('.import_final_btn').attr('disabled', 'disabled');
          $('.import_con_stage2').show();
          $('.import_con_stage1, .import_con_stage3').hide();
        }
      }
      return $this.removeAttr('disabled');
    });
  };

  loadTemplateRows = function(templates, pagination) {
    var shortcutModifiers, table, template, _i, _len;
    if (templates == null) {
      templates = ext.templates;
    }
    if (pagination == null) {
      pagination = true;
    }
    log.trace();
    table = $('#templatesNew');
    table.find('tbody tr').remove();
    if (templates.length) {
      shortcutModifiers = ext.isThisPlatform('mac') ? ext.SHORTCUT_MAC_MODIFIERS : ext.SHORTCUT_MODIFIERS;
      for (_i = 0, _len = templates.length; _i < _len; _i++) {
        template = templates[_i];
        table.append(loadTemplate(template, shortcutModifiers));
      }
      if (pagination) {
        paginate(templates);
      }
      activateTooltips(table);
      activateDraggables();
      activateModifications();
      return activateSelections();
    } else {
      return table.find('tbody').append($('<tr/>').append($('<td/>', {
        colspan: table.find('thead th').length,
        html: i18n.get('opt_no_templates_found_text')
      })));
    }
  };

  loadToolbar = function() {
    var toolbar;
    log.trace();
    toolbar = store.get('toolbar');
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
    updateToolbarTemplates();
    loadToolbarControlEvents();
    return loadToolbarSaveEvents();
  };

  loadToolbarControlEvents = function() {
    log.trace();
    return $('#toolbarPopup .btn').click(function() {
      return $("." + ($(this).attr('id'))).show().siblings().hide();
    }).filter('.active').click();
  };

  loadToolbarSaveEvents = function() {
    log.trace();
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
    return bindSaveEvent('#toolbarClose, #toolbarKey, #toolbarOptions', 'change', 'toolbar', function(key) {
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

  loadUrlShorteners = function() {
    var yourls;
    log.trace();
    $('input[name="enabled_shortener"]').each(function() {
      var $this;
      $this = $(this);
      if (store.get("" + ($this.attr('id')) + ".enabled")) {
        $this.attr('checked', 'checked');
      }
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
    var shortener, _i, _len, _ref, _results;
    log.trace();
    _ref = ext.queryUrlShorteners(function(shortener) {
      return shortener.oauth != null;
    });
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      shortener = _ref[_i];
      _results.push((function(shortener) {
        var button;
        button = $("#" + shortener.name + "Account");
        button.click(function() {
          var $this;
          $this = $(this).blur();
          if ($this.data('oauth') !== 'true') {
            $this.tooltip('hide');
            log.debug("Attempting to authorize " + shortener.name);
            return shortener.oauth.authorize(function() {
              var success;
              log.debug("Authorization response for " + shortener.name + "...", arguments);
              if (success = shortener.oauth.hasAccessToken()) {
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
    return $('#yourlsAuthentication button').click(function() {
      return $("." + ($(this).attr('id'))).show().siblings().hide();
    }).filter('.active').click();
  };

  loadUrlShortenerSaveEvents = function() {
    log.trace();
    $('input[name="enabled_shortener"]').change(function() {
      return store.modify('bitly', 'googl', 'yourls', function(data, key) {
        var shortener;
        if (data.enabled = $("#" + key).is(':checked')) {
          shortener = ext.queryUrlShortener(function(shortener) {
            return shortener.name === key;
          });
          log.debug("Enabling " + shortener.title + " URL shortener");
          return analytics.track('Shorteners', 'Enabled', shortener.title);
        }
      });
    });
    $('#yourlsAuthentication button').click(function() {
      var $this, auth;
      $this = $(this);
      auth = $this.attr('id').match(/yourlsAuthentication(.*)/)[1];
      store.modify('yourls', function(yourls) {
        return yourls.authentication = auth === 'None' ? '' : auth.toLowerCase();
      });
      log.debug("YOURLS authentication changed: " + auth);
      return analytics.track('Shorteners', 'Changed', 'YOURLS Authentication', $this.index());
    });
    return bindSaveEvent("#yourlsPassword, #yourlsSignature, #yourlsUrl   , #yourlsUsername", 'input', 'yourls', function() {
      return this.val().trim();
    });
  };

  deleteTemplates = function(templates) {
    var keep, keys, list, template, _i, _len;
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
    if (keys.length) {
      keep = ext.queryTemplates(function(template) {
        var _ref;
        return _ref = template.key, __indexOf.call(keys, _ref) < 0;
      });
      store.set('templates', keep);
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
    }
  };

  reorderTemplates = function(fromIndex, toIndex) {
    var templates;
    log.trace();
    templates = ext.templates;
    if ((fromIndex != null) && (toIndex != null)) {
      templates[fromIndex].index = toIndex;
      templates[toIndex].index = fromIndex;
    }
    store.set('templates', templates);
    return ext.updateTemplates();
  };

  saveTemplate = function(template) {
    var action, i, isNew, temp, templates, _i, _len;
    log.trace();
    log.debug('Saving the following template...', template);
    isNew = !(template.key != null);
    templates = store.get('templates');
    if (isNew) {
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

  saveTemplates = function(updateUI) {
    var errors, templates;
    log.trace();
    errors = [];
    templates = [];
    $('#templates option').each(function() {
      var $this, template;
      $this = $(this);
      template = deriveTemplate($this);
      errors = validateTemplate(template, false);
      if (errors.length === 0) {
        return templates.push(template);
      }
      if (updateUI) {
        $this.attr('selected', 'selected');
        $('#templates').change().focus();
      }
      return false;
    });
    if (errors.length === 0) {
      if (updateUI) {
        clearErrors();
      }
      store.set('templates', templates);
      return ext.updateTemplates();
    } else {
      if (updateUI) {
        return showErrors(errors);
      }
    }
  };

  updateImportedTemplate = function(template, existing) {
    var _ref;
    log.trace();
    log.debug('Updating existing template with the following imported data...', template);
    if (!existing.readOnly) {
      existing.content = template.content;
      if ((0 < (_ref = template.title.length) && _ref <= 32)) {
        existing.title = template.title;
      }
    }
    existing.enabled = template.enabled;
    if (template.image === '' || icons.exists(template.image)) {
      existing.image = template.image;
    }
    if (template.shortcut === '' || isShortcutValid(template.shortcut)) {
      existing.shortcut = template.shortcut;
    }
    existing.usage = template.usage;
    log.debug('Updated the following template...', existing);
    return existing;
  };

  updateTemplate = function(option) {
    log.trace();
    if (option.length) {
      option.data('content', $('#template_content').val());
      option.data('enabled', String($('#template_enabled').is(':checked')));
      option.data('image', $('#template_image option:selected').val());
      option.data('shortcut', $('#template_shortcut').val().trim().toUpperCase());
      option.text($('#template_title').val().trim());
    }
    log.debug('Updated the following option with field values...', option);
    return option;
  };

  updateToolbarTemplates = function() {
    var lastSelectedTemplate, lastSelectedTemplateKey, option, template, templates, toolbarKey, toolbarTemplates, _i, _len, _results;
    log.trace();
    templates = [];
    toolbarKey = store.get('toolbar.key');
    toolbarTemplates = $('#toolbarKey');
    lastSelectedTemplate = toolbarTemplates.find('option:selected');
    lastSelectedTemplateKey = '';
    if (lastSelectedTemplate.length) {
      lastSelectedTemplateKey = lastSelectedTemplate.val();
    }
    toolbarTemplates.find('option').remove();
    $('#templates option').each(function() {
      var $this, template;
      $this = $(this);
      template = {
        key: $this.val(),
        selected: false,
        title: $this.text()
      };
      if (lastSelectedTemplateKey) {
        if (template.key === lastSelectedTemplateKey) {
          template.selected = true;
        }
      } else if (template.key === toolbarKey) {
        template.selected = true;
      }
      return templates.push(template);
    });
    _results = [];
    for (_i = 0, _len = templates.length; _i < _len; _i++) {
      template = templates[_i];
      option = $('<option/>', {
        text: template.title,
        value: template.key
      });
      if (template.selected) {
        option.attr('selected', 'selected');
      }
      _results.push(toolbarTemplates.append(option));
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

  clearErrors = function(selector) {
    var group;
    log.trace();
    if (selector != null) {
      log.debug("Clearing displayed validation errors for '" + selector + "'");
      group = $(selector).parents('.control-group').first();
      return group.removeClass('error').find('.controls .error-message').remove();
    } else {
      log.debug('Clearing all displayed validation errors');
      $('.control-group.error').removeClass('error');
      return $('.error-message').remove();
    }
  };

  isKeyNew = function(key, additionalKeys) {
    var available;
    if (additionalKeys == null) {
      additionalKeys = [];
    }
    log.trace();
    log.debug("Checking if template key '" + key + "' is new");
    available = true;
    $('#templates option').each(function() {
      if ($(this).val() === key) {
        return available = false;
      }
    });
    return available && __indexOf.call(additionalKeys, key) < 0;
  };

  isKeyValid = function(key) {
    log.trace();
    log.debug("Validating template key '" + key + "'");
    return R_VALID_KEY.test(key);
  };

  isShortcutValid = function(shortcut) {
    log.trace();
    log.debug("Validating keyboard shortcut '" + shortcut + "'");
    return R_VALID_SHORTCUT.test(shortcut);
  };

  showErrors = function(errors) {
    var error, group, _i, _len, _results;
    log.trace();
    log.debug('Creating an alert for the following errors...', errors);
    _results = [];
    for (_i = 0, _len = errors.length; _i < _len; _i++) {
      error = errors[_i];
      group = $(error.selector).focus().parents('.control-group').first();
      _results.push(group.addClass('error').find('.controls').append($('<p/>', {
        "class": 'error-message help-block',
        html: error.message
      })));
    }
    return _results;
  };

  validateImportedTemplate = function(template) {
    log.trace();
    log.debug('Validating property types of the following template...', template);
    return 'object' === typeof template && 'string' === typeof template.content && 'boolean' === typeof template.enabled && 'string' === typeof template.image && 'string' === typeof template.key && 'string' === typeof template.shortcut && 'string' === typeof template.title && 'number' === typeof template.usage;
  };

  validateTemplate = function(object, isNew) {
    var errors, template;
    log.trace();
    errors = [];
    template = $.isPlainObject(object) ? object : deriveTemplate(object);
    log.debug('Validating the following template...', template);
    if (!template.readOnly) {
      if (isNew && !isKeyValid(template.key)) {
        errors.push({
          message: i18n.get('opt_template_key_invalid')
        });
      }
      if (template.title.length === 0) {
        errors.push({
          message: i18n.get('opt_template_title_invalid'),
          selector: '#template_title'
        });
      }
    }
    if (template.shortcut && !isShortcutValid(template.shortcut)) {
      errors.push({
        message: i18n.get('opt_template_shortcut_invalid'),
        selector: '#template_shortcut'
      });
    }
    log.debug('Following validation errors were found...', errors);
    return errors;
  };

  validateTemplateNew = function(template) {
    var errors, isNew;
    log.trace();
    isNew = !(template.key != null);
    errors = [];
    log.debug('Validating the following template...', template);
    if (!template.readOnly) {
      if (!template.title) {
        errors.push(new ValidationError('template_title', 'opt_template_title_invalid'));
      }
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
    var dragSource, draggables, templatesNew;
    log.trace();
    templatesNew = $('#templatesNew');
    dragSource = null;
    draggables = templatesNew.find('[draggable]');
    draggables.off('dragstart dragend dragenter dragover drop');
    draggables.on('dragstart', function(e) {
      var $this;
      $this = $(this);
      dragSource = this;
      templatesNew.removeClass('table-hover');
      $this.addClass('dnd-moving');
      $this.find('[data-original-title]').tooltip('hide');
      e.originalEvent.dataTransfer.effectAllowed = 'move';
      return e.originalEvent.dataTransfer.setData('text/html', $this.html());
    });
    draggables.on('dragend', function(e) {
      draggables.removeClass('dnd-moving dnd-over');
      templatesNew.addClass('table-hover');
      return dragSource = null;
    });
    draggables.on('dragenter', function(e) {
      var $this;
      $this = $(this);
      draggables.not($this).removeClass('dnd-over');
      return $this.addClass('dnd-over');
    });
    draggables.on('dragover', function(e) {
      e.preventDefault();
      e.originalEvent.dataTransfer.dropEffect = 'move';
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
        activateTooltips(templatesNew);
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
    return $('#templatesNew tbody tr td:not(:first-child)').off('click').click(function() {
      var activeKey;
      activeKey = $(this).parents('tr:first').find(':checkbox').val();
      return openWizard(ext.queryTemplate(function(template) {
        return template.key === activeKey;
      }));
    });
  };

  activateSelections = function() {
    var selectBoxes, templatesNew;
    log.trace();
    templatesNew = $('#templatesNew');
    selectBoxes = templatesNew.find('tbody :checkbox');
    selectBoxes.off('change').change(function() {
      var $this, messageKey;
      $this = $(this);
      messageKey = 'opt_select_box';
      if ($this.is(':checked')) {
        messageKey += '_checked';
      }
      $this.attr('data-original-title', i18n.get(messageKey));
      return refreshSelectButtons();
    });
    return templatesNew.find('thead :checkbox').off('change').change(function() {
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
  };

  activateTooltips = function(selector) {
    var base;
    log.trace();
    base = selector ? $(selector) : $();
    base.find('[data-original-title]').each(function() {
      var $this;
      $this = $(this);
      $this.tooltip('destroy');
      $this.attr('title', $this.attr('data-original-title'));
      return $this.removeAttr('data-original-title');
    });
    return base.find('[title]').each(function() {
      var $this, placement;
      $this = $(this);
      placement = $this.attr('data-placement');
      placement = placement != null ? trimToLower(placement) : 'top';
      return $this.tooltip({
        placement: placement
      });
    });
  };

  clearContext = function() {
    return setContext(null);
  };

  closeWizard = function() {
    clearContext();
    return $('#template_wizard').modal('hide');
  };

  createExport = function(keys) {
    var data, key, _i, _len;
    log.trace();
    log.debug('Creating an export string for the following keys...', keys);
    data = {
      templates: [],
      version: ext.version
    };
    for (_i = 0, _len = keys.length; _i < _len; _i++) {
      key = keys[_i];
      data.templates.push(deriveTemplate($("#templates option[value='" + key + "']")));
    }
    if (data.templates.length) {
      analytics.track('Templates', 'Exported', ext.version, data.templates.length);
    }
    log.debug('Following export data has been created...', data);
    return JSON.stringify(data);
  };

  createImport = function(str) {
    var data;
    log.trace();
    log.debug('Parsing the following import string...', str);
    try {
      data = JSON.parse(str);
    } catch (error) {
      throw i18n.get('error_import_data');
    }
    if (!$.isArray(data.templates) || data.templates.length === 0 || typeof data.version !== 'string') {
      throw i18n.get('error_import_invalid');
    }
    log.debug('Following data was created from the string...', data);
    return data;
  };

  deriveTemplate = function(option) {
    var template;
    log.trace();
    log.debug('Deriving a template from the following option...', option);
    if (option.length > 0) {
      template = {
        content: option.data('content'),
        enabled: option.data('enabled') === 'true',
        image: option.data('image'),
        index: option.parent().find('option').index(option),
        key: option.val(),
        readOnly: option.data('readOnly') === 'true',
        shortcut: option.data('shortcut'),
        title: option.text(),
        usage: parseInt(option.data('usage'), 10)
      };
    }
    log.debug('Following template was derived from the option...', template);
    return template;
  };

  deriveTemplateNew = function() {
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
      shortcut: trimToUpper($('#template_shortcut').val()),
      title: readOnly ? activeTemplate.title : $('#template_title').val().trim(),
      usage: (_ref2 = activeTemplate.usage) != null ? _ref2 : 0
    };
    log.debug('Following template was derived...', template);
    return template;
  };

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

  fileErrorHandler = function(callback) {
    return function(e) {
      return callback(i18n.get((function() {
        switch (e.code) {
          case FileError.NOT_FOUND_ERR:
            return 'error_file_not_found';
          case FileError.ABORT_ERR:
            return 'error_file_aborted';
          default:
            return 'error_file_default';
        }
      })()));
    };
  };

  getSelectedTemplates = function() {
    var selectedKeys;
    selectedKeys = [];
    $('#templatesNew tbody :checkbox:checked').each(function() {
      return selectedKeys.push($(this).val());
    });
    return ext.queryTemplates(function(template) {
      var _ref;
      return _ref = template.key, __indexOf.call(selectedKeys, _ref) >= 0;
    });
  };

  openWizard = function(template) {
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
          var $this;
          $this = $(this);
          if (page === 1) {
            return $this.addClass('disabled');
          } else {
            return $this.removeClass('disabled');
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
        pagination.find('ul li:first-child').click(function() {
          if (!$(this).hasClass('disabled')) {
            return refreshPagination(pagination.find('ul li.active').index() - 1);
          }
        });
        pagination.find('ul li:not(:first-child, :last-child)').click(function() {
          var $this;
          $this = $(this);
          if (!$this.hasClass('active')) {
            return refreshPagination($this.index());
          }
        });
        pagination.find('ul li:last-child').click(function() {
          if (!$(this).hasClass('disabled')) {
            return refreshPagination(pagination.find('ul li.active').index() + 1);
          }
        });
      }
      refreshPagination();
      return pagination.show();
    } else {
      return pagination.hide().find('ul li').remove();
    }
  };

  readImport = function(importData) {
    var data, existing, i, imported, keys, template, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3;
    log.trace();
    log.debug('Importing the following data...', importData);
    data = {
      templates: []
    };
    keys = [];
    _ref = importData.templates;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      template = _ref[_i];
      existing = {};
      if (importData.version < '1.0.0') {
        template.image = template.image > 0 ? ((_ref1 = icons.fromLegacy(template.image - 1)) != null ? _ref1.name : void 0) || '' : '';
        template.key = ext.getKeyForName(template.name);
        template.usage = 0;
      } else if (importData.version < '1.1.0') {
        template.image = ((_ref2 = icons.fromLegacy(template.image)) != null ? _ref2.name : void 0) || '';
      }
      if (validateImportedTemplate(template)) {
        if (isKeyNew(template.key, keys)) {
          template = addImportedTemplate(template);
          if (template) {
            data.templates.push(template);
            keys.push(template.key);
          }
        } else {
          _ref3 = data.templates;
          for (i = _j = 0, _len1 = _ref3.length; _j < _len1; i = ++_j) {
            imported = _ref3[i];
            if (imported.key === template.key) {
              existing = updateImportedTemplate(template, imported);
              data.templates[i] = existing;
              break;
            }
          }
          if (!existing.key) {
            existing = deriveTemplate($("#templates            option[value='" + template.key + "']"));
            if (existing) {
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
    var selections;
    log.trace();
    selections = $('#templatesNew tbody :checkbox:checked');
    return $('#delete_btn, #export_btn').prop('disabled', selections.length === 0);
  };

  resetWizard = function() {
    var imgOpt, _ref;
    log.trace();
    if (activeTemplate == null) {
      activeTemplate = {};
    }
    $('#template_wizard .modal-header h3').html(activeTemplate.key != null ? i18n.get('opt_template_modify_title', activeTemplate.title) : i18n.get('opt_template_new_header'));
    $('#template_content').val(activeTemplate.content || '');
    $('#template_enabled').prop('checked', (_ref = activeTemplate.enabled) != null ? _ref : true);
    $('#template_shortcut').val(activeTemplate.shortcut || '');
    $('#template_title').val(activeTemplate.title || '');
    imgOpt = $("#template_image option[value='" + activeTemplate.image + "']");
    if (imgOpt.length === 0) {
      $('#template_image option:first-child').attr('selected', 'selected');
    } else {
      imgOpt.attr('selected', 'selected');
    }
    $('#template_image').change();
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
          _results.push(keyword);
        }
        return _results;
      })()).join('|')), "i");
      searchResults = ext.queryTemplates(function(template) {
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
    activeTemplate = {};
    $.extend(activeTemplate, template);
    return resetWizard();
  };

  trimToLower = function(str) {
    if (str == null) {
      str = '';
    }
    return str.trim().toLowerCase();
  };

  trimToUpper = function(str) {
    if (str == null) {
      str = '';
    }
    return str.trim().toUpperCase();
  };

  options = window.options = new (Options = (function(_super) {

    __extends(Options, _super);

    function Options() {
      return Options.__super__.constructor.apply(this, arguments);
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
      $('a[tabify]').click(function() {
        var id, nav, parent, target;
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
      $('#template_shortcut_modifier').html(ext.isThisPlatform('mac') ? ext.SHORTCUT_MAC_MODIFIERS : ext.SHORTCUT_MODIFIERS);
      $('[popover]').each(function() {
        var $this, placement, trigger;
        $this = $(this);
        placement = $this.attr('data-placement');
        placement = placement != null ? trimToLower(placement) : 'right';
        trigger = $this.attr('data-trigger');
        trigger = trigger != null ? trimToLower(trigger) : 'hover';
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
      activateTooltips();
      navHeight = $('.navbar').height();
      return $('[data-goto]').click(function() {
        var goto, pos, _ref;
        goto = $($(this).attr('data-goto'));
        pos = ((_ref = goto.position()) != null ? _ref.top : void 0) || 0;
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
