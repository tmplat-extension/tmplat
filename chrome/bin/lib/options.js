// [Template](http://neocotic.com/template)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/template>
(function() {
  var Options, R_VALID_KEY, R_VALID_SHORTCUT, WIDGET_SOURCE, activateTooltips, addImportedTemplate, bindSaveEvent, bindTemplateSaveEvent, clearErrors, createExport, createImport, deriveTemplate, ext, feedback, feedbackAdded, fileErrorHandler, getRowKey, isKeyNew, isKeyValid, isShortcutValid, load, loadControlEvents, loadDeveloperTools, loadImages, loadLogger, loadLoggerSaveEvents, loadNotificationSaveEvents, loadNotifications, loadSaveEvents, loadTemplate, loadTemplateControlEvents, loadTemplateExportEvents, loadTemplateImportEvents, loadTemplateNew, loadTemplateSaveEvents, loadTemplates, loadToolbar, loadToolbarControlEvents, loadToolbarSaveEvents, loadUrlShortenerAccounts, loadUrlShortenerControlEvents, loadUrlShortenerSaveEvents, loadUrlShorteners, options, readImport, reorderTemplates, saveTemplates, showErrors, trimToLower, updateImportedTemplate, updateTemplate, updateToolbarTemplates, validateImportedTemplate, validateTemplate,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  R_VALID_KEY = /^[A-Z0-9]*\.[A-Z0-9]*$/i;

  R_VALID_SHORTCUT = /[A-Z0-9]/i;

  WIDGET_SOURCE = "https://widget.uservoice.com/RSRS5SpMkMxvKOCs27g.js";

  ext = chrome.extension.getBackgroundPage().ext;

  feedbackAdded = false;

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

  bindTemplateSaveEvent = function(selector, type, assign, callback) {
    log.trace();
    return $(selector).on(type, function() {
      var $this, key, option, templates;
      $this = $(this);
      key = '';
      templates = $('#templates');
      option = templates.find('option:selected');
      if (option.length && templates.data('quiet') !== 'true') {
        key = $this.attr('id').match(/^template_(\S*)/)[1];
        key = key[0].toLowerCase() + key.substr(1);
        assign.call($this, option, key);
        return typeof callback === "function" ? callback($this, option, key) : void 0;
      }
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
    var shortcutModifiers, template, templates, templatesNew, _i, _len, _ref;
    log.trace();
    templates = $('#templates');
    templatesNew = $('#templatesNew');
    templates.remove('option');
    templatesNew.remove('tbody > tr');
    shortcutModifiers = ext.isThisPlatform('mac') ? ext.SHORTCUT_MAC_MODIFIERS : ext.SHORTCUT_MODIFIERS;
    _ref = ext.templates;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      template = _ref[_i];
      templates.append(loadTemplate(template));
      templatesNew.append(loadTemplateNew(template, shortcutModifiers));
    }
    loadTemplateControlEvents();
    loadTemplateImportEvents();
    loadTemplateExportEvents();
    return loadTemplateSaveEvents();
  };

  loadTemplate = function(template) {
    var option;
    log.trace();
    log.debug('Creating an option for the following template...', template);
    option = $('<option/>', {
      text: template.title,
      value: template.key
    });
    option.data('content', template.content);
    option.data('enabled', "" + template.enabled);
    option.data('image', template.image);
    option.data('readOnly', "" + template.readOnly);
    option.data('shortcut', template.shortcut);
    option.data('usage', "" + template.usage);
    return option;
  };

  loadTemplateNew = function(template, shortcutModifiers) {
    var alignCenter, enabledIcon, row;
    log.trace();
    log.debug('Creating a row for the following template...', template);
    row = $('<tr/>', {
      draggable: true,
      title: i18n.get('opt_template_modify_title', template.title)
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
      html: "<i class=\"" + (icons.getClass(template.image)) + "\"></i> " + template.title
    })));
    row.append($('<td/>', {
      html: "" + shortcutModifiers + template.shortcut
    }));
    enabledIcon = template.enabled ? 'ok' : 'remove';
    row.append($('<td/>', alignCenter).append($('<i/>', {
      'class': "icon-" + enabledIcon
    })));
    row.append($('<td/>').append($('<span/>', {
      text: template.content,
      title: template.content
    })));
    row.append($('<td/>').append($('<span/>', {
      'class': 'muted',
      text: '::::',
      title: i18n.get('opt_template_move_title', template.title)
    })));
    return row;
  };

  loadTemplateControlEvents = function() {
    var dragSource, draggables, selectBoxes, templates, templatesNew;
    log.trace();
    templates = $('#templates');
    templatesNew = $('#templatesNew');
    selectBoxes = templatesNew.find('tbody input[type="checkbox"]');
    selectBoxes.change(function() {
      var $this, messageKey;
      $this = $(this);
      messageKey = 'opt_select_box';
      if ($this.is(':checked')) {
        messageKey += '_checked';
      }
      return $this.attr('data-original-title', i18n.get(messageKey));
    });
    templatesNew.find('thead input[type="checkbox"]').change(function() {
      var $this, checked, messageKey;
      $this = $(this);
      checked = $this.is(':checked');
      messageKey = 'opt_select_all_box';
      if (checked) {
        messageKey += '_checked';
      }
      $this.attr('data-original-title', i18n.get(messageKey));
      return selectBoxes.prop('checked', checked);
    });
    dragSource = null;
    draggables = templatesNew.find('[draggable]');
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
    draggables.on('drop', function(e) {
      var $dragSource, $this;
      $dragSource = $(dragSource);
      e.stopPropagation();
      if (dragSource !== this) {
        $this = $(this);
        $dragSource.html($this.html());
        $this.html(e.originalEvent.dataTransfer.getData('text/html'));
        activateTooltips(templatesNew, true);
        reorderTemplates($dragSource.index(), $this.index());
      }
      return false;
    });
    templates.change(function() {
      var $this, imgOpt, lastSelectedTemplate, opt;
      $this = $(this);
      opt = $this.find('option:selected');
      clearErrors();
      templates.data('quiet', 'true');
      if (opt.length === 0) {
        lastSelectedTemplate = {};
        i18n.content('#add_btn', 'opt_add_button');
        $('#moveUp_btn, #moveDown_btn').attr('disabled', 'disabled');
        $('.toggle-disabled').attr('disabled', 'disabled');
        $('.toggle-readonly').removeAttr('readonly');
        $('#template_content, #template_shortcut, #template_title').val('');
        $('#template_enabled').attr('checked', 'checked');
        $('#template_image option:first-child').attr('selected', 'selected');
        $('#template_image').change();
      } else {
        i18n.content('#add_btn', 'opt_add_new_button');
        if (opt.is(':first-child')) {
          $('#moveUp_btn').attr('disabled', 'disabled');
        } else {
          $('#moveUp_btn').removeAttr('disabled');
        }
        if (opt.is(':last-child')) {
          $('#moveDown_btn').attr('disabled', 'disabled');
        } else {
          $('#moveDown_btn').removeAttr('disabled');
        }
        imgOpt = $("#template_image option[value='" + (opt.data('image')) + "']");
        if (imgOpt.length === 0) {
          $('#template_image option:first-child').attr('selected', 'selected');
        } else {
          imgOpt.attr('selected', 'selected');
        }
        $('#template_content').val(opt.data('content'));
        $('#template_image').change();
        $('#template_shortcut').val(opt.data('shortcut'));
        $('#template_title').val(opt.text());
        if (opt.data('enabled') === 'true') {
          $('#template_enabled').attr('checked', 'checked');
        } else {
          $('#template_enabled').removeAttr('checked');
        }
        if (opt.data('readOnly') === 'true') {
          $('.toggle-disabled').attr('disabled', 'disabled');
          $('.toggle-readonly').attr('readonly', 'readonly');
        } else {
          $('.toggle-disabled').removeAttr('disabled');
          $('.toggle-readonly').removeAttr('readonly');
        }
      }
      return templates.data('quiet', 'false');
    });
    templates.change();
    $('#add_btn').click(function() {
      var errors, opt;
      opt = templates.find('option:selected');
      if (opt.length) {
        templates.val([]).change();
        return $('#template_title').focus();
      } else {
        opt = loadTemplate({
          content: $('#template_content').val(),
          enabled: String($('#template_enabled').is(':checked')),
          image: $('#template_image option:selected').val(),
          key: utils.keyGen(),
          readOnly: false,
          shortcut: $('#template_shortcut').val().trim().toUpperCase(),
          title: $('#template_title').val().trim(),
          usage: 0
        });
        clearErrors();
        errors = validateTemplate(opt, true);
        if (errors.length === 0) {
          log.debug('Adding the following option...', opt);
          templates.append(opt);
          opt.attr('selected', 'selected');
          updateToolbarTemplates();
          templates.change().focus();
          saveTemplates();
          return analytics.track('Templates', 'Added', opt.text());
        } else {
          return showErrors(errors);
        }
      }
    });
    $('#delete_btn').click(function() {
      $('.delete_hdr').html(i18n.get('opt_delete_wizard_header', templates.find('option:selected').text()));
      return $('#delete_con').modal('show');
    });
    $('.delete_no_btn').click(function() {
      return $('#delete_con').modal('hide');
    });
    $('.delete_yes_btn').click(function() {
      var opt, title;
      opt = templates.find('option:selected');
      if (opt.data('readOnly') !== 'true') {
        title = opt.text();
        opt.remove();
        templates.scrollTop(0).change().focus();
        saveTemplates();
        log.debug("Deleted " + title + " template");
        analytics.track('Templates', 'Deleted', title);
      }
      $('#delete_con').modal('hide');
      return updateToolbarTemplates();
    });
    $('#moveDown_btn').click(function() {
      var opt;
      opt = templates.find('option:selected');
      opt.insertAfter(opt.next());
      templates.change().focus();
      return saveTemplates();
    });
    return $('#moveUp_btn').click(function() {
      var opt;
      opt = templates.find('option:selected');
      opt.insertBefore(opt.prev());
      templates.change().focus();
      return saveTemplates();
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

  loadTemplateSaveEvents = function() {
    log.trace();
    bindTemplateSaveEvent('#template_enabled, #template_image', 'change', function(opt, key) {
      var value;
      value = (function() {
        switch (key) {
          case 'enabled':
            return "" + (this.is(':checked'));
          case 'image':
            return this.val();
        }
      }).call(this);
      log.debug("Changing template " + key + " to '" + value + "'");
      return opt.data(key, value);
    }, saveTemplates);
    return bindTemplateSaveEvent("#template_content, #template_shortcut  , #template_title", 'input', function(opt, key) {
      var value;
      switch (key) {
        case 'content':
          return opt.data(key, this.val());
        case 'shortcut':
          value = this.val().toUpperCase().trim();
          if (value && !isShortcutValid(value)) {
            return opt.data('error', i18n.get('opt_template_shortcut_invalid'));
          } else {
            log.debug("Changing template " + key + " to '" + value + "'");
            return opt.data(key, value);
          }
          break;
        case 'title':
          value = this.val().trim();
          if (value.length === 0) {
            return opt.data('error', i18n.get('opt_template_title_invalid'));
          } else {
            return opt.text(value);
          }
      }
    }, function(jel, opt, key) {
      var selector;
      clearErrors(selector = "#" + (jel.attr('id')));
      if (opt.data('error')) {
        showErrors([
          {
            message: opt.data('error'),
            selector: selector
          }
        ]);
        return opt.removeData('error');
      } else {
        return saveTemplates();
      }
    });
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
    _ref = ext.queryUrlShortener((function(shortener) {
      return shortener.oauth != null;
    }), false);
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

  reorderTemplates = function(oldIndex, newIndex) {
    var templates;
    log.trace();
    templates = store.get('templates');
    if ((oldIndex != null) && (newIndex != null)) {
      templates[oldIndex].index = newIndex;
      templates[newIndex].index = oldIndex;
    }
    templates.sort(function(a, b) {
      return a.index - b.index;
    });
    store.set('templates', templates);
    return ext.updateTemplates();
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

  activateTooltips = function(selector, clean) {
    var base;
    base = selector ? $(selector) : $();
    if (clean) {
      base.find('[data-original-title]').each(function() {
        var $this;
        $this = $(this);
        $this.tooltip('destroy');
        $this.attr('title', $this.attr('data-original-title'));
        return $this.removeAttr('data-original-title');
      });
    }
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

  feedback = function() {
    var script, uv, uvTabLabel, uvwDialogClose;
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

  getRowKey = function(row) {
    return $(row).find('input[type="checkbox"]').val();
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

  trimToLower = function(str) {
    if (str == null) {
      str = '';
    }
    return str.trim().toLowerCase();
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
