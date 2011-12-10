/* Copyright (C) 2011 Alasdair Mercer, http://neocotic.com/
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy  
 * of this software and associated documentation files (the "Software"), to deal  
 * in the Software without restriction, including without limitation the rights  
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell  
 * copies of the Software, and to permit persons to whom the Software is  
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all  
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR  
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE  
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER  
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,  
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE  
 * SOFTWARE.
 */

/**
 * <p>Responsible for the options page.</p>
 * @author <a href="http://neocotic.com">Alasdair Mercer</a>
 * @since 0.0.2.1
 * @requires jQuery
 * @namespace
 */
var options = {

    /**
     * <p>The default locale to use if none were found matching in
     * {@link options.locales}.</p>
     * @since 0.1.0.0
     * @private
     * @type String
     */
    defaultLocale: 'en',

    /**
     * <p>The locales supported by this extension.</p>
     * @since 0.1.0.0
     * @private
     * @type Array
     */
    locales: ['en'],

    /**
     * <p>The regular expression used to validate feature name inputs.</p>
     * @see options.isNameValid
     * @since 0.1.0.0
     * @private
     * @type RegExp
     */
    rValidName: /^[A-Za-z0-9]+$/,

    /**
     * <p>The regular expression used to validate keyboard shortcut inputs.</p>
     * @see options.isShortcutValid
     * @since 0.1.0.0
     * @private
     * @type RegExp
     */
    rValidShortcut: /[A-Z0-9]/,

    /**
     * <p>The partial URL of Chrome extensions on the web store.</p>
     * @since 0.1.0.0
     * @private
     * @type String
     */
    webstoreUrl: 'https://chrome.google.com/webstore/detail/',

    /**
     * <p>Creates a feature from the information from the provided feature.</p>
     * <p>The feature provided is not altered in any way and the new feature is
     * only created if the feature has a valid name.</p>
     * <p>Other than the name, any invalid fields will not be copied to the new
     * feature which will instead use the preferred default value for those
     * fields.</p>
     * @param {Object} feature The imported feature on which the newly created
     * feature should be based on.
     * @returns {Object} The newly created feature based on that provided or
     * <code>undefined</code> if the feature's name is invalid.
     * @since 0.2.0.0
     * @private
     */
    addImportedFeature: function (feature) {
        var bg = chrome.extension.getBackgroundPage(),
            newFeature;
        if (options.isNameValid(feature.name) && feature.name.length <= 32) {
            newFeature = {
                content: feature.content,
                enabled: feature.enabled,
                image: 0,
                name: feature.name,
                readOnly: false,
                shortcut: '',
                title: chrome.i18n.getMessage('untitled')
            };
            // Only uses image if identifier exists
            for (var i = 0; i < bg.ext.images.length; i++) {
                if (bg.ext.images[i].id === feature.image) {
                    newFeature.image = feature.image;
                    break;
                }
            }
            // Only uses valid shortcuts
            if (options.isShortcutValid(feature.shortcut)) {
                newFeature.shortcut = feature.shortcut;
            }
            // Only uses valid titles
            if (feature.title.length > 0 && feature.title.length <= 32) {
                newFeature.title = feature.title;
            }
        }
        return newFeature;
    },

    /**
     * <p>Creates a JSON string to export the features with the specified
     * names.</p>
     * @param {String[]} names The names of the features to export.
     * @returns {String} The JSON string generated containing the exported
     * values.
     * @since 0.2.0.0
     * @private
     */
    createExport: function (names) {
        var bg = chrome.extension.getBackgroundPage(),
            data = {
                templates: [],
                version: bg.ext.version
            },
            opt = {};
        for (var i = 0; i < names.length; i++) {
            opt = $('#features option[value="' + names[i] + '"]');
            data.templates.push({
                content: opt.data('content'),
                enabled: opt.data('enabled') === 'true',
                image: parseInt(opt.data('image'), 10),
                name: opt.val(),
                shortcut: opt.data('shortcut'),
                title: opt.text()
            });
        }
        return JSON.stringify(data);
    },

    /**
     * <p>Creates a JSON object from the imported string specified.</p>
     * @param {String} str The imported string to be parsed.
     * @returns {Object} The object created from the parsed string.
     * @throws {String} If a problem occurs while parsing the string.
     * @throws {String} If the resulting object doesn't contain the required
     * fields.
     * @since 0.2.0.0
     * @private
     */
    createImport: function (str) {
        var data = {};
        try {
            data = JSON.parse(str);
        } catch (e) {
            throw chrome.i18n.getMessage('error_import_data');
        }
        if (!$.isArray(data.templates) || data.templates.length === 0 ||
                $.type(data.version) !== 'string') {
            throw chrome.i18n.getMessage('error_import_invalid');
        }
        return data;
    },

    /**
     * <p>Creates a feature with the information derived from the specified
     * <code>&lt;option/&gt;</code> element.</p>
     * @param {jQuery} option The <code>&lt;option/&gt;</code> element in a
     * jQuery wrapper.
     * @return {Object} The feature created from the jQuery object or
     * <code>undefined</code> if the jQuery object contained no elements.
     * @since 0.2.0.0
     * @private
     */
    deriveFeature: function (option) {
        var feature;
        if (option.length > 0) {
            feature = {
                content: option.data('content'),
                enabled: option.data('enabled') === 'true',
                image: parseInt(option.data('image'), 10),
                index: option.parent().find('option').index(option),
                name: option.val(),
                readOnly: option.data('readOnly') === 'true',
                shortcut: option.data('shortcut'),
                title: option.text()
            };
        }
        return feature;
    },

    /**
     * <p>Returns the information for the icon in the specified array with the
     * smallest dimensions.</p>
     * @param {Array} icons The icons to be queried.
     * @returns {IconInfo} The details of the smallest icon within the array
     * provided.
     * @since 0.1.0.0
     * @private
     */
    getSmallestIcon: function (icons) {
        var icon;
        for (var i = 0; i < icons.length; i++) {
            if (!icon || icons[i].size < icon.size) {
                icon = icons[i];
            }
        }
        return icon;
    },

    /**
     * <p>Replaces the value of the specified attribute of the selected
     * element(s) to the localized String looked up from Chrome.</p>
     * @param {String} selector A String containing a jQuery selector
     * expression to select the element(s) to be modified.
     * @param {String} attribute The name of the attribute to be modified.
     * @param {String} name The name of the localized message to be retrieved.
     * @param {String|String[]} [sub] The String(s) to substituted in the
     * returned message (where applicable).
     * @returns {jQuery} The modified element(s) wrapped in jQuery.
     * @since 0.1.0.0
     * @private
     */
    i18nAttribute: function (selector, attribute, name, sub) {
        if (typeof sub === 'string') {
            sub = [sub];
        }
        return $(selector).attr(attribute, chrome.i18n.getMessage(name, sub));
    },

    /**
     * <p>Replaces the inner HTML of the selected element(s) with the localized
     * String looked up from Chrome.</p>
     * @param {String} selector A String containing a jQuery selector
     * expression to select the element(s) to be modified.
     * @param {String} name The name of the localized message to be retrieved.
     * @param {String|String[]} [sub] The String(s) to substituted in the
     * returned message (where applicable).
     * @returns {jQuery} The modified element(s) wrapped in jQuery.
     * @since 0.1.0.0 - Previously located in {@link utils}.
     * @private
     */
    i18nReplace: function (selector, name, sub) {
        if (typeof sub === 'string') {
            sub = [sub];
        }
        return $(selector).html(chrome.i18n.getMessage(name, sub));
    },

    /**
     * <p>Initializes the options page.</p>
     * <p>This involves inserting and configuring the UI elements as well as
     * the insertion of localized Strings and most importantly loading the
     * current settings.</p>
     */
    init: function () {
        // Inserts localized Strings
        options.i18nReplace('title', 'name');
        options.i18nReplace('#errors_hdr', 'opt_errors_header');
        options.i18nReplace('#add_btn', 'opt_add_button');
        options.i18nReplace('#delete_btn', 'opt_delete_button');
        options.i18nReplace('#import_btn', 'opt_import_button');
        options.i18nReplace('#export_btn', 'opt_export_button');
        options.i18nReplace('.import_con_stage1', 'confirm_import_stage1');
        options.i18nReplace('.import_con_stage2', 'confirm_import_stage2');
        options.i18nReplace('.import_con_stage3', 'confirm_import_stage3');
        options.i18nReplace('.export_con_stage1', 'confirm_export_stage1');
        options.i18nReplace('.export_con_stage2', 'confirm_export_stage2');
        options.i18nReplace('#features_hdr, #features_nav',
                'opt_feature_header');
        options.i18nReplace('#feature_name_txt', 'opt_feature_name_text');
        options.i18nReplace('#feature_title_txt', 'opt_feature_title_text');
        options.i18nReplace('#feature_image_txt', 'opt_feature_image_text');
        options.i18nAttribute('a[rel=facebox]', 'title', 'opt_help_text');
        options.i18nAttribute('#feature_template', 'placeholder',
                'opt_feature_template_text');
        options.i18nReplace('#template_help_lnk', 'opt_feature_template_help');
        options.i18nReplace('#feature_enabled_txt',
                'opt_feature_enabled_text');
        options.i18nReplace('#shorteners_hdr, #shorteners_nav',
                'opt_url_shortener_header');
        options.i18nReplace('#shorteners_name_hdr',
                'opt_url_shortener_name_header');
        options.i18nReplace('#shorteners_enabled_hdr',
                'opt_url_shortener_enabled_header');
        options.i18nReplace('#shorteners_config_hdr',
                'opt_url_shortener_config_header');
        options.i18nReplace('#bitlyUsername_txt',
                'opt_url_shortener_username_text');
        options.i18nReplace('#bitlyApiKey_txt',
                'opt_url_shortener_api_key_text');
        options.i18nReplace('#googlOAuth_txt',
                'opt_url_shortener_oauth_enable_text');
        options.i18nReplace('#yourlsUrl_txt', 'opt_url_shortener_url_text');
        options.i18nReplace('#yourlsUsername_txt',
                'opt_url_shortener_username_text');
        options.i18nReplace('#yourlsPassword_txt',
                'opt_url_shortener_password_text');
        options.i18nReplace('#yourls_or_txt', 'opt_or_text');
        options.i18nReplace('#yourlsSignature_txt',
                'opt_url_shortener_signature_text');
        options.i18nReplace('#general_hdr, #general_nav',
                'opt_general_header');
        options.i18nReplace('#contextMenu_txt', 'opt_context_menu_text');
        options.i18nReplace('#shortcuts_txt', 'opt_shortcut_text');
        options.i18nReplace('#anchors_hdr', 'opt_anchor_header');
        options.i18nReplace('#doAnchorTarget_txt', 'opt_anchor_target_text');
        options.i18nReplace('#doAnchorTitle_txt', 'opt_anchor_title_text');
        options.i18nReplace('#notifications_hdr', 'opt_notification_header');
        options.i18nReplace('#notifications_txt', 'opt_notification_text');
        options.i18nReplace('#notificationDuration_txt1',
                'opt_notification_timer_text1');
        options.i18nReplace('#notificationDuration_txt2',
                'opt_notification_timer_text2');
        options.i18nReplace('.save-btn', 'opt_save_button');
        options.i18nReplace('#footer', 'opt_footer',
                String(new Date().getFullYear()));
        // Inserts localized help/confirmation sections
        options.i18nReplace('#contextMenu_help', 'help_contextMenu');
        options.i18nReplace('#shortcuts_help', 'help_shortcuts');
        options.i18nReplace('#notifications_help', 'help_notifications');
        options.i18nReplace('#notificationDuration_help',
                'help_notificationDuration');
        options.i18nReplace('#doAnchorTitle_help', 'help_doAnchorTitle');
        options.i18nReplace('#doAnchorTarget_help', 'help_doAnchorTarget');
        options.i18nReplace('#feature_enabled_help', 'help_feature_enabled');
        options.i18nReplace('#feature_image_help', 'help_feature_image');
        options.i18nReplace('#feature_name_help', 'help_feature_name');
        options.i18nReplace('#feature_shortcut_help', 'help_feature_shortcut');
        options.i18nReplace('#feature_title_help', 'help_feature_title');
        options.i18nReplace('#delete_con', 'confirm_delete');
        options.i18nReplace('#bitlyUsername_help', 'help_bitlyUsername');
        options.i18nReplace('#bitlyApiKey_help', 'help_bitlyApiKey');
        options.i18nReplace('#googlOAuth_help', 'help_googlOAuth');
        options.i18nReplace('#yourlsUrl_help', 'help_yourlsUrl');
        options.i18nReplace('#yourlsCredentials_help',
                'help_yourlsCredentials');
        options.i18nReplace('#yourlsSignature_help', 'help_yourlsSignature');
        // Binds tab selection event to tabs
        $('#navigation li').click(function (event) {
            var $this = $(this);
            if (!$this.hasClass('selected')) {
                $this.siblings().removeClass('selected');
                $this.addClass('selected');
                $($this.attr('data-href')).show().siblings('.tab').hide();
                utils.set('options_active_tab', $this.attr('id'));
            }
        });
        // Reflects persisted tab
        utils.init('options_active_tab', 'general_nav');
        $('#' + utils.get('options_active_tab')).click();
        // Binds options:saveAndClose event to button
        $('.save-btn').click(options.saveAndClose);
        // Binds options:toggleTemplateSection to template section items
        $('.template-section').live('click', options.toggleTemplateSection);
        // Loads template section from locale-specific file
        var locale = options.defaultLocale,
            uiLocale = chrome.i18n.getMessage('@@ui_locale');
        for (var i = 0; i < options.locales.length; i++) {
            if (uiLocale === options.locales[i]) {
                locale = uiLocale;
                break;
            }
        }
        $('#template_help').load(chrome.extension.getURL('pages/templates_' +
                locale + '.html'), function () {
            $('.template-section:first-child').click();
        });
        // Loads current option values
        options.load();
        var bg = chrome.extension.getBackgroundPage(),
            keyMods = '';
        if (bg.ext.isThisPlatform('mac')) {
            keyMods = bg.ext.shortcutMacModifiers;
        } else {
            keyMods = bg.ext.shortcutModifiers;
        }
        $('#feature_shortcut_txt').html(keyMods);
        // Initialize facebox
        $('a[rel*=facebox]').facebox();
    },

    /**
     * <p>Returns whether or not the specified name is available for use as a
     * feature.</p>
     * @param {String} name The name to be queried.
     * @param {String[]} [additionalNames] A list of additional names to be
     * checked.
     * @returns {Boolean} <code>true</code> if the name is not already in use;
     * otherwise <code>false</code>.
     * @since 0.1.0.0
     * @private
     */
    isNameAvailable: function (name, additionalNames) {
        var available = true;
        $('#features option').each(function () {
            if ($(this).val() === name) {
                available = false;
                // Breaks out of $.each
                return false;
            }
        });
        if (available && $.isArray(additionalNames)) {
            available = additionalNames.indexOf(name) === -1;
        }
        return available;
    },

    /**
     * <p>Returns whether or not the specified name is valid for use as a
     * feature.</p>
     * @param {String} name The name to be tested.
     * @returns {Boolean} <code>true</code> if the name is valid; otherwise
     * <code>false</code>.
     * @since 0.1.0.0
     * @private
     */
    isNameValid: function (name) {
        return name.search(options.rValidName) !== -1;
    },

    /**
     * <p>Returns whether or not the specified keyboard shortcut is valid to
     * assign to a feature.</p>
     * @param {String} shortcut The keyboard shortcut to be tested.
     * @returns {Boolean} <code>true</code> if the shortcut is valid; otherwise
     * <code>false</code>.
     * @since 0.1.0.0
     * @private
     */
    isShortcutValid: function (shortcut) {
        return shortcut.search(options.rValidShortcut) !== -1;
    },

    /**
     * <p>Updates the options page with the values of the current settings.</p>
     */
    load: function () {
        options.loadImages();
        options.loadFeatures();
        options.loadNotifications();
        options.loadUrlShorteners();
        if (utils.get('contextMenu')) {
            $('#contextMenu').attr('checked', 'checked');
        } else {
            $('#contextMenu').removeAttr('checked');
        }
        if (utils.get('shortcuts')) {
            $('#shortcuts').attr('checked', 'checked');
        } else {
            $('#shortcuts').removeAttr('checked');
        }
        if (utils.get('doAnchorTarget')) {
            $('#doAnchorTarget').attr('checked', 'checked');
        } else {
            $('#doAnchorTarget').removeAttr('checked');
        }
        if (utils.get('doAnchorTitle')) {
            $('#doAnchorTitle').attr('checked', 'checked');
        } else {
            $('#doAnchorTitle').removeAttr('checked');
        }
    },

    /**
     * <p>Creates a <code>&lt;option/&gt;</code> representing the feature
     * provided.</p>
     * <p>This is to be inserted in to the <code>&lt;select/&gt;</code>
     * managing features on the options page.</p>
     * @param {Object} feature The information of the feature to be used.
     * @returns {jQuery} The <code>&lt;option/&gt;</code> element in a jQuery
     * wrapper.
     * @since 0.1.0.0
     * @private
     */
    loadFeature: function (feature) {
        var opt = $('<option/>', {
            text: feature.title,
            value: feature.name
        });
        opt.data('content', feature.content);
        opt.data('enabled', String(feature.enabled));
        opt.data('image', String(feature.image));
        opt.data('readOnly', String(feature.readOnly));
        opt.data('shortcut', feature.shortcut);
        return opt;
    },

    /**
     * <p>Binds the event handlers required for controlling the features.</p>
     * @since 0.2.0.0
     * @private
     */
    loadFeatureControlEvents: function () {
        var features = $('#features'),
            lastSelectedFeature = {};
        /*
         * Whenever the selected option changes we want all the controls to
         * represent the current selection (where possible).
         */
        features.change(function (event) {
            var $this = $(this),
                opt = $this.find('option:selected');
            if (lastSelectedFeature.length) {
                options.updateFeature(lastSelectedFeature);
            }
            // Disables all the controls as no option is selected
            if (opt.length === 0) {
                lastSelectedFeature = {};
                options.i18nReplace('#add_btn', 'opt_add_button');
                $('#moveUp_btn, #moveDown_btn, .toggle-feature')
                        .attr('disabled', 'disabled');
                $('.read-only, .read-only-always').removeAttr('disabled');
                $('.read-only, .read-only-always').removeAttr('readonly');
                $('#delete_btn').attr('disabled', 'disabled');
                $('#feature_enabled').attr('checked', 'checked');
                $('#feature_image option').first().attr('selected',
                        'selected');
                $('#feature_image').change();
                $('#feature_name').val('');
                $('#feature_shortcut').val('');
                $('#feature_template').val('');
                $('#feature_title').val('');
            } else {
                lastSelectedFeature = opt;
                options.i18nReplace('#add_btn', 'opt_add_new_button');
                $('.read-only-always').attr('disabled', 'disabled');
                $('.read-only-always').attr('readonly', 'readonly');
                $('.toggle-feature').removeAttr('disabled');
                // Disables 'up' control as option is at top of the list
                if (opt.is(':first-child')) {
                    $('#moveUp_btn').attr('disabled', 'disabled');
                } else {
                    $('#moveUp_btn').removeAttr('disabled');
                }
                // Disables 'down' control as option is at bottom of the list
                if (opt.is(':last-child')) {
                    $('#moveDown_btn').attr('disabled', 'disabled');
                } else {
                    $('#moveDown_btn').removeAttr('disabled');
                }
                // Updates fields and controls to reflect selected feature
                var imgOpt = $('#feature_image option[value="' +
                        opt.data('image') + '"]');
                if (imgOpt.length === 0) {
                    $('#feature_image option').first().attr('selected',
                            'selected');
                } else {
                    imgOpt.attr('selected', 'selected');
                }
                $('#feature_image').change();
                $('#feature_name').val(opt.val());
                $('#feature_shortcut').val(opt.data('shortcut'));
                $('#feature_template').val(opt.data('content'));
                $('#feature_title').val(opt.text());
                if (opt.data('enabled') === 'true') {
                    $('#feature_enabled').attr('checked', 'checked');
                } else {
                    $('#feature_enabled').removeAttr('checked');
                }
                if (opt.data('readOnly') === 'true') {
                    $('.read-only').attr('disabled', 'disabled');
                    $('.read-only').attr('readonly', 'readonly');
                } else {
                    $('.read-only').removeAttr('disabled');
                    $('.read-only').removeAttr('readonly');
                }
            }
            /*
             * Ensures correct arrows display in 'up'/'down' controls depending
             * on whether or not the controls are disabled.
             */
            $('#moveDown_btn:not([disabled]) img').attr('src',
                    '../images/move_down.gif');
            $('#moveUp_btn:not([disabled]) img').attr('src',
                    '../images/move_up.gif');
            $('#moveDown_btn[disabled] img').attr('src',
                    '../images/move_down_disabled.gif');
            $('#moveUp_btn[disabled] img').attr('src',
                    '../images/move_up_disabled.gif');
        }).change();
        // Adds a new feature to options based on the input values
        $('#add_btn').click(function (event) {
            var opt = features.find('option:selected');
            if (opt.length) {
                features.val([]).change();
                $('#feature_name').focus();
            } else {
                var name = $('#feature_name').val().trim(),
                    title = $('#feature_title').val().trim();
                $('#errors').find('li').remove();
                opt = options.loadFeature({
                    content: $('#feature_template').val(),
                    enabled: String($('#feature_enabled').is(':checked')),
                    image: parseInt($('#feature_image option:selected').val(),
                            10),
                    name: name,
                    readOnly: false,
                    shortcut: $('#feature_shortcut').val().trim()
                            .toUpperCase(),
                    title: title
                });
                if (options.validateFeature(opt, true)) {
                    features.append(opt);
                    opt.attr('selected', 'selected');
                    features.change().focus();
                } else {
                    $.facebox({div: '#message'});
                }
            }
        });
        // Prompts user to confirm removal of selected feature
        $('#delete_btn').click(function (event) {
            $.facebox({div: '#delete_con'});
        });
        // Cancels feature removal process
        $('.delete_no_btn').live('click', function (event) {
            $(document).trigger('close.facebox');
        });
        // Finalizes feature removal
        $('.delete_yes_btn').live('click', function (event) {
            var opt = features.find('option:selected');
            if (opt.data('readOnly') !== 'true') {
                opt.remove();
                features.change().focus();
            }
            $(document).trigger('close.facebox');
        });
        /*
         * Moves the selected option down one when the 'down' control is
         * clicked.
         */
        $('#moveDown_btn').click(function (event) {
            var opt = features.find('option:selected');
            opt.insertAfter(opt.next());
            features.change().focus();
        });
        // Moves the selected option up one when the 'up' control is clicked
        $('#moveUp_btn').click(function (event) {
            var opt = features.find('option:selected');
            opt.insertBefore(opt.prev());
            features.change().focus();
        });
    },

    /**
     * <p>Binds the event handlers required for exporting features.</p>
     * @since 0.2.0.0
     * @private
     */
    loadFeatureExportEvents: function () {
        var bg = chrome.extension.getBackgroundPage(),
            features = $('#features');
        // Prompts the user to selected the features to be imported
        $('#export_btn').click(function (event) {
            var list = $('.export_con_list');
            list.find('option').remove();
            options.updateFeature(features.find('option:selected'));
            features.val([]).change();
            $('.export_yes_btn').attr('disabled', 'disabled');
            $('.export_con_stage1').show();
            $('.export_con_stage2').hide();
            $('.export_content').val('');
            features.find('option').each(function () {
                var opt = $(this);
                $('<option/>', {
                    text: opt.text(),
                    value: opt.val()
                }).appendTo(list);
            });
            $.facebox({div: '#export_con'});
        });
        /*
         * Enables/disables the continue button depending on whether or not any
         * features are selected.
         */
        $('.export_con_list').live('change', function (event) {
            if ($(this).find('option:selected').length > 0) {
                $('.export_yes_btn').removeAttr('disabled');
            } else {
                $('.export_yes_btn').attr('disabled', 'disabled');
            }
        });
        // Copies the text area contents to the system clipboard
        $('.export_copy_btn').live('click', function (event) {
            bg.ext.copy($('.export_content').val(), true);
            $(this).text(chrome.i18n.getMessage('copied'));
            event.preventDefault();
        }).live('mouseover', function (event) {
            $(this).text(chrome.i18n.getMessage('copy'));
        });
        // Deselects all features in the list
        $('.export_deselect_all_btn').live('click', function (event) {
            $('.export_con_list option').removeAttr('selected').parent()
                    .focus();
            $('.export_yes_btn').attr('disabled', 'disabled');
        });
        // Cancels the export process
        $('.export_no_btn, .export_close_btn').live('click', function (event) {
            $(document).trigger('close.facebox');
            event.preventDefault();
        });
        // Prompts the user to select a file location to save the exported data
        $('.export_save_btn').live('click', function (event) {
            var $this = $(this),
                str = $this.parents('.export_con_stage2')
                        .find('.export_content').val();
            /*
             * Writes the contents of the text area in to a file and before
             * allowing the user to download it.
             */
            window.webkitRequestFileSystem(window.TEMPORARY, 1024 * 1024,
                function (fs) {
                    fs.root.getFile('export.json', {create: true},
                        function (fileEntry) {
                            fileEntry.createWriter(function (fileWriter) {
                                var builder = new WebKitBlobBuilder();
                                fileWriter.onerror = function (e) {
                                    console.log(e);
                                };
                                fileWriter.onwriteend  = function () {
                                    window.location.href = fileEntry.toURL();
                                };
                                builder.append(str);
                                fileWriter.write(
                                    builder.getBlob('application/json')
                                );
                            });
                        });
                });
        });
        // Selects all features in the list
        $('.export_select_all_btn').live('click', function (event) {
            $('.export_con_list option').attr('selected', 'selected').parent()
                    .focus();
            $('.export_yes_btn').removeAttr('disabled');
        });
        // Creates the exported data based on the selected features
        $('.export_yes_btn').live('click', function (event) {
            var $this = $(this).attr('disabled', 'disabled'),
                items = $this.parents('.export_con_stage1')
                        .find('.export_con_list option'),
                names = [];
            items.filter(':selected').each(function () {
                names.push($(this).val());
            });
            $('.export_content').val(options.createExport(names));
            $('.export_con_stage1').hide();
            $('.export_con_stage2').show();
        });
    },

    /**
     * <p>Binds the event handlers required for importing features.</p>
     * @since 0.2.0.0
     * @private
     */
    loadFeatureImportEvents: function () {
        var bg = chrome.extension.getBackgroundPage(),
            features = $('#features');
        // Restores the previous view in the import process
        $('.import_back_btn').live('click', function (event) {
            $('.import_con_stage1').show();
            $('.import_con_stage2, .import_con_stage3').hide();
        });
        // Prompts the user to input/load the data to be imported
        $('#import_btn').click(function (event) {
            options.updateFeature(features.find('option:selected'));
            features.val([]).change();
            $('.import_con_stage1').show();
            $('.import_con_stage2, .import_con_stage3').hide();
            $('.import_content').val('');
            $('.import_error').html('&nbsp;');
            $.facebox({div: '#import_con'});
        });
        /*
         * Enables/disables the finalize button depending on whether or not any
         * features are selected.
         */
        $('.import_con_list').live('change', function (event) {
            if ($(this).find('option:selected').length > 0) {
                $('.import_final_btn').removeAttr('disabled');
            } else {
                $('.import_final_btn').attr('disabled', 'disabled');
            }
        });
        // Deselects all features in the list
        $('.import_deselect_all_btn').live('click', function (event) {
            $('.import_con_list option').removeAttr('selected').parent()
                    .focus();
            $('.import_final_btn').attr('disabled', 'disabled');
        });
        /*
         * Reads the contents of the loaded file in to the text area and
         * performs simple error handling.
         */
        $('.import_file_btn').live('change', function (event) {
            var $this = $(this),
                file = event.target.files[0],
                reader = new FileReader();
            reader.onerror = function (evt) {
                var message = '';
                switch (evt.target.error.code) {
                case evt.target.error.NOT_FOUND_ERR:
                    message = chrome.i18n.getMessage('error_file_not_found');
                    break;
                case evt.target.error.ABORT_ERR:
                    message = chrome.i18n.getMessage('error_file_aborted');
                    break;
                default:
                    message = chrome.i18n.getMessage('error_file_default');
                }
                $('.import_error').text(message);
            };
            reader.onload = function (evt) {
                $('.import_content').val(evt.target.result);
                $('.import_error').html('&nbsp;');
            };
            reader.readAsText(file);
        });
        // Finalizes the import process
        $('.import_final_btn').live('click', function (event) {
            var $this = $(this),
                list = $this.parents('.import_con_stage2')
                        .find('.import_con_list');
            list.find('option:selected').each(function () {
                var opt = $(this),
                    existingOpt = features.find('option[value="' + opt.val() +
                            '"]');
                opt.removeAttr('selected');
                if (existingOpt.length === 0) {
                    features.append(opt);
                } else {
                    existingOpt.replaceWith(opt);
                }
            });
            $(document).trigger('close.facebox');
            features.focus();
        });
        // Cancels the import process
        $('.import_no_btn, .import_close_btn').live('click', function (event) {
            $(document).trigger('close.facebox');
        });
        // Pastes the system clipboard contents in to the text area
        $('.import_paste_btn').live('click', function (event) {
            $('.import_file_btn').val('');
            $('.import_content').val(bg.ext.paste());
            $(this).text(chrome.i18n.getMessage('pasted'));
        }).live('mouseover', function (event) {
            $(this).text(chrome.i18n.getMessage('paste'));
        });
        // Selects all features in the list
        $('.import_select_all_btn').live('click', function (event) {
            $('.import_con_list option').attr('selected', 'selected').parent()
                    .focus();
            $('.import_final_btn').removeAttr('disabled');
        });
        /*
         * Reads the imported data and attempts to extract any valid features
         * and list the changes to user for them to check and finalize.
         */
        $('.import_yes_btn').live('click', function (event) {
            var $this = $(this).attr('disabled', 'disabled'),
                data,
                importData,
                list = $('.import_con_list'),
                str = $this.parents('.import_con_stage1')
                        .find('.import_content').val();
            $('.import_error').html('&nbsp;');
            try {
                importData = options.createImport(str);
            } catch (e) {
                $('.import_error').text(e);
            }
            if (importData) {
                data = options.readImport(importData);
                if (data.features.length === 0) {
                    $('.import_con_stage3').show();
                    $('.import_con_stage1, .import_con_stage2').hide();
                } else {
                    list.find('option').remove();
                    $('.import_count').text(data.features.length);
                    for (var i = 0; i < data.features.length; i++) {
                        list.append(options.loadFeature(data.features[i]));
                    }
                    $('.import_final_btn').attr('disabled', 'disabled');
                    $('.import_con_stage2').show();
                    $('.import_con_stage1, .import_con_stage3').hide();
                }
            }
            $this.removeAttr('disabled');
        });
    },

    /**
     * <p>Updates the feature section of the options page with the current
     * settings.</p>
     * @private
     */
    loadFeatures: function () {
        var bg = chrome.extension.getBackgroundPage(),
            features = $('#features');
        // Ensures clean slate
        features.find('option').remove();
        // Creates and inserts options representing features
        for (var i = 0; i < bg.ext.features.length; i++) {
            features.append(options.loadFeature(bg.ext.features[i]));
        }
        // Loads all event handlers required for managing features
        options.loadFeatureControlEvents();
        options.loadFeatureImportEvents();
        options.loadFeatureExportEvents();
    },

    /**
     * <p>Creates a <code>&lt;option/&gt;</code> for each image available for
     * features.</p>
     * <p>This is to be inserted in to the <code>&lt;select/&gt;</code>
     * containing feature images on the options page.</p>
     * @since 0.1.0.0
     * @private
     */
    loadImages: function () {
        var bg = chrome.extension.getBackgroundPage(),
            imagePreview = $('#feature_image_preview'),
            images = $('#feature_image');
        for (var i = 0; i < bg.ext.images.length; i++) {
            opt = $('<option/>', {
                text: bg.ext.images[i].name,
                value: bg.ext.images[i].id
            }).appendTo(images).data('file', bg.ext.images[i].file);
            if (bg.ext.images[i].separate) {
                images.append(
                    $('<option/>', {
                        disabled: 'disabled',
                        text: '---------------'
                    })
                );
            }
        }
        images.change(function () {
            var opt = images.find('option:selected');
            imagePreview.attr({
                src: '../images/' + opt.data('file'),
                title: opt.text()
            });
        }).change();
    },

    /**
     * <p>Updates the notification section of the options page with the current
     * settings.</p>
     * @private
     */
    loadNotifications: function () {
        if (utils.get('notifications')) {
            $('#notifications').attr('checked', 'checked');
        } else {
            $('#notifications').removeAttr('checked');
        }
        var timeInSecs = 0;
        if (utils.get('notificationDuration') > timeInSecs) {
            timeInSecs = utils.get('notificationDuration') / 1000;
        }
        $('#notificationDuration').val(timeInSecs);
    },

    /**
     * <p>Updates the URL shorteners section of the options page with the
     * current settings.</p>
     * @private
     */
    loadUrlShorteners: function () {
        $('input[name="enabled_shortener"]').each(function () {
            var radio = $(this);
            if (utils.get(radio.attr('id'))) {
                radio.attr('checked', 'checked');
            }
        });
        $('#bitlyApiKey').val(utils.get('bitlyApiKey'));
        $('#bitlyUsername').val(utils.get('bitlyUsername'));
        if (utils.get('googlOAuth')) {
            $('#googlOAuth').attr('checked', 'checked');
        } else {
            $('#googlOAuth').removeAttr('checked');
        }
        $('#yourlsPassword').val(utils.get('yourlsPassword'));
        $('#yourlsSignature').val(utils.get('yourlsSignature'));
        $('#yourlsUrl').val(utils.get('yourlsUrl'));
        $('#yourlsUsername').val(utils.get('yourlsUsername'));
    },

    /**
     * <p>Reads the imported data created by {@link options.createImport} and
     * extracts all valid imported features.</p>
     * <p>Where the feature will overwrite an existing feature, only fields
     * with valid values will be accepted with exception to protected fields
     * (i.e. on read-only features).</p>
     * <p>Where the feature is new default values will replace any fields with
     * invalid values assigned to them.</p>
     * @param {Object} importData The data parsed from the imported string.
     * @param {Object[]} importData.templates The features to be extracted and
     * validated.
     * @param {String} importData.version The version of this extension used to
     * export the data currently being imported.
     * @returns {Object} An object containing the list of features extracted
     * from the imported data, if any.
     * @since 0.2.0.0
     * @private
     */
    readImport: function (importData) {
        var data = {
                features: []
            },
            existing = {},
            feature = {},
            names = [];
        for (var i = 0; i < importData.templates.length; i++) {
            existing = {};
            feature = importData.templates[i];
            if (options.validateImportedFeature(feature)) {
                if (options.isNameAvailable(feature.name, names)) {
                    // Attempts to create and add new feature
                    feature = options.addImportedFeature(feature);
                    if (feature) {
                        data.features.push(feature);
                        names.push(feature.name);
                    }
                } else {
                    // Attempts to update previously imported feature
                    for (var j = 0; j < data.features.length; j++) {
                        if (data.features[j].name === feature.name) {
                            existing = options.updateImportedFeature(feature,
                                    data.features[j]);
                            data.features[j] = existing;
                            break;
                        }
                    }
                    if (!existing.name) {
                        // Attempts to derive existing feature from options
                        existing = options.deriveFeature(
                                $('#features option[value="' + feature.name +
                                '"]'));
                        // Attempts to update derived feature
                        if (existing) {
                            existing = options.updateImportedFeature(feature,
                                    existing);
                            data.features.push(existing);
                            names.push(existing.name);
                        }
                    }
                }
            }
        }
        return data;
    },

    /**
     * <p>Updates the settings with the values from the options page.</p>
     */
    save: function () {
        utils.set('contextMenu', $('#contextMenu').is(':checked'));
        utils.set('shortcuts', $('#shortcuts').is(':checked'));
        utils.set('doAnchorTarget', $('#doAnchorTarget').is(':checked'));
        utils.set('doAnchorTitle', $('#doAnchorTitle').is(':checked'));
        options.saveFeatures();
        options.saveNotifications();
        options.saveUrlShorteners();
    },

    /**
     * <p>Updates the settings with the values from the options page and closes
     * the current tab.</p>
     * @param {Event} [event] The event triggered.
     * @event
     * @requies jQuery
     * @private
     */
    saveAndClose: function (event) {
        options.updateFeature($('#features option:selected'));
        if (options.validateFeatures()) {
            options.save();
            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.remove(tab.id);
            });
        } else {
            $.facebox({div: '#message'});
        }
    },

    /**
     * <p>Updates the settings with the values from the feature section of the
     * options page.</p>
     * @private
     */
    saveFeatures: function () {
        var bg = chrome.extension.getBackgroundPage(),
            features = [];
        /*
         * Updates each individual feature settings based on their
         * corresponding options.
         */
        $('#features option').each(function () {
            features.push(options.deriveFeature($(this)));
        });
        // Ensures features data reflects the updated settings
        bg.ext.saveFeatures(features);
        bg.ext.updateFeatures();
    },

    /**
     * <p>Updates the settings with the values from the notification section of
     * the options page.</p>
     * @private
     */
    saveNotifications: function () {
        utils.set('notifications', $('#notifications').is(':checked'));
        var timeInSecs = $('#notificationDuration').val();
        timeInSecs = (timeInSecs) ? parseInt(timeInSecs, 10) * 1000 : 0;
        utils.set('notificationDuration', timeInSecs);
    },

    /**
     * <p>Updates the settings with the values from the URL shorteners section
     * of the options page.</p>
     * @private
     */
    saveUrlShorteners: function () {
        $('input[name="enabled_shortener"]').each(function () {
            var $this = $(this);
            utils.set($this.attr('id'), $this.is(':checked'));
        });
        utils.set('bitlyApiKey', $('#bitlyApiKey').val().trim());
        utils.set('bitlyUsername', $('#bitlyUsername').val().trim());
        utils.set('googlOAuth', $('#googlOAuth').is(':checked'));
        utils.set('yourlsPassword', $('#yourlsPassword').val());
        utils.set('yourlsSignature', $('#yourlsSignature').val().trim());
        utils.set('yourlsUrl', $('#yourlsUrl').val().trim());
        utils.set('yourlsUsername', $('#yourlsUsername').val().trim());
    },

    /**
     * <p>Toggles the visibility of the content of the template section that
     * triggered the event.</p>
     * @param {Event} [event] The event triggered.
     * @event
     * @since 0.1.0.0
     * @private
     */
    toggleTemplateSection: function (event) {
        var $this = $(this),
            table = $this.parents('.template-table');
        table.find('.template-section.selected').removeClass('selected');
        table.find('.template-display').html($this.addClass('selected')
                .next('.template-content').html()).scrollTop(0);
    },

    /**
     * <p>Updates the specified &lt;option&gt; element that represents a
     * feature with values taken from the available fields.</p>
     * @param {jQuery} opt The jQuery wrapped &lt;option&gt; to be
     * updated.
     * @since 0.1.0.3
     * @private
     */
    updateFeature: function (opt) {
        if (opt.length) {
            opt.data('content', $('#feature_template').val());
            opt.data('enabled', String($('#feature_enabled').is(':checked')));
            opt.data('image', $('#feature_image option:selected').val());
            opt.data('shortcut',
                    $('#feature_shortcut').val().trim().toUpperCase());
            opt.text($('#feature_title').val().trim());
            opt.val($('#feature_name').val().trim());
            return opt;
        }
    },

    /**
     * <p>Updates the existing feature with information extracted from the
     * imported feature provided.</p>
     * <p>The feature provided is not altered in anyw way and the fields of the
     * existing feature are only changed if the new values are valid.</p>
     * <p>Protected fields are only updated if the existing feature is not
     * read-only and the new value is valid.</p>
     * @param {Object} feature The imported feature on which the existing
     * feature should be modified to reflect.
     * @param {Object} existing The existing feature which should be modified
     * so that its fields reflect that of the import feature.
     * @returns {Object} The existing feature with the modified fields.
     * @since 0.2.0.0
     * @private
     */
    updateImportedFeature: function (feature, existing) {
        var bg = chrome.extension.getBackgroundPage();
        // Ensures read-only templates are protected
        if (!existing.readOnly) {
            existing.content = feature.content;
            // Only updates valid titles
            if (feature.title.length > 0 && feature.title.length <= 32) {
                existing.title = feature.title;
            }
        }
        existing.enabled = feature.enabled;
        // Only updates image if identifier exists
        for (var i = 0; i < bg.ext.images.length; i++) {
            if (bg.ext.images[i].id === feature.image) {
                existing.image = feature.image;
                break;
            }
        }
        // Only updates valid shortcuts
        if (options.isShortcutValid(feature.shortcut)) {
            existing.shortcut = feature.shortcut;
        }
        return existing;
    },

    /**
     * <p>Validates the specified &lt;option&gt; element that represents a
     * feature.</p>
     * <p>If an array of keyboard shortcuts is also provided then this function
     * will validate whether or not the shortcut of the feature being validated
     * is already in use.</p>
     * <p>This function adds any validation errors it encounters to a unordered
     * list which should be displayed to the user at some point if
     * <code>true</code> is returned.</p>
     * @param {jQuery} feature The jQuery wrapped &lt;option&gt; to be
     * validated.
     * @param {Boolean} isNew <code>true</code> if the feature has yet to be
     * added; otherwise <code>false</code>.
     * @param {Array} [usedShortcuts] The array of keyboard shortcuts already
     * in use.
     * @returns {Boolean} <code>true</code> if validation errors were
     * encountered; otherwise <code>false</code>.
     * @since 0.1.0.0
     * @private
     */
    validateFeature: function (feature, isNew, usedShortcuts) {
        var enabled = feature.data('enabled') === 'true',
            errors = $('#errors'),
            name = feature.val().trim(),
            shortcut = feature.data('shortcut').trim(),
            title = feature.text().trim();
        function createError(name) {
            return $('<li/>', {
                html: chrome.i18n.getMessage(name)
            }).appendTo(errors);
        }
        if (feature.data('readOnly') !== 'true') {
            if (isNew) {
                if (!options.isNameValid(name)) {
                    createError('opt_feature_name_invalid');
                } else if (!options.isNameAvailable(name)) {
                    createError('opt_feature_name_unavailable');
                }
            }
            if (title.length === 0) {
                createError('opt_feature_title_invalid');
            }
        }
        if (shortcut && typeof usedShortcuts !== 'undefined') {
            if (!options.isShortcutValid(shortcut)) {
                createError('opt_feature_shortcut_invalid');
            } else if (enabled && usedShortcuts.indexOf(shortcut) !== -1) {
                createError('opt_feature_shortcut_unavailable');
            }
        }
        return errors.find('li').length === 0;
    },

    /**
     * <p>Validates all &lt;option&gt; elements that represent features that
     * are to be stored in localStorage.</p>
     * <p>This function adds any validation errors it encounters to a unordered
     * list which should be displayed to the user at some point if
     * <code>true</code> is returned.</p>
     * @returns {Boolean} <code>true</code> if validation errors were
     * encountered; otherwise <code>false</code>.
     * @since 0.1.0.0
     * @private
     */
    validateFeatures: function () {
        var errors = $('#errors'),
            features = $('#features option'),
            shortcut = '',
            usedShortcuts = [];
        errors.find('li').remove();
        features.each(function () {
            var $this = $(this);
            if (options.validateFeature($this, false, usedShortcuts)) {
                shortcut = $this.data('shortcut').trim();
                // Only stores shortcut if used and feature is enabled
                if ($this.data('enabled') === 'true' && shortcut) {
                    usedShortcuts.push(shortcut);
                }
            } else {
                $this.attr('selected', 'selected');
                $('#features').change().focus();
                return false;
            }
        });
        return errors.find('li').length === 0;
    },

    /**
     * <p>Returns whether or not the feature provided contains the required
     * fields of the correct types.</p>
     * <p>This is a soft validation and doesn't validate the values themselves,
     * only that they exist.</p>
     * @param {Object} feature The feature to be validated.
     * @returns {Boolean} <code>true</code> if the feature is an object and it
     * contains the required fields; otherwise <code>false</code>.
     * @since 0.2.0.0
     * @private
     */
    validateImportedFeature: function (feature) {
        return (typeof feature === 'object' &&
                typeof feature.content === 'string' &&
                typeof feature.enabled === 'boolean' &&
                typeof feature.image === 'number' &&
                typeof feature.name === 'string' &&
                typeof feature.shortcut === 'string' &&
                typeof feature.title === 'string');
    }

};