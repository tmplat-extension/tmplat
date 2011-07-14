/**
 * <p>Responsible for the options page.</p>
 * @author <a href="http://github.com/neocotic">Alasdair Mercer</a>
 * @since 0.0.2.1
 * @namespace
 */
var options = {

    /**
     * <p>The regular expression used to validate feature name inputs.</p>
     * @see options.isNameValid
     * @since 0.1.0.0
     * @private
     * @type RegExp
     */
    rValidName: /^[A-Za-z0-9]+$/,

    /**
     * <p>Collapses the contents of all sections.</p>
     * @param {Event} [event] The event triggered.
     * @event
     * @requies jQuery
     * @private
     */
    collapseAll: function (event) {
        $('.section h4').addClass('toggle-expand')
                .removeClass('toggle-collapse').next('.content').slideUp();
    },

    /**
     * <p>Detects installed extensions that are supported by this extension.</p>
     * <p>For each supported extension found this function calls the callback
     * function with the information for that extension.</p>
     * @param {function} callback The function to be called with each extensions
     * details.
     * @since 0.1.0.0
     * @private
     */
    detectExtensions: function (callback) {
        var bg = chrome.extension.getBackgroundPage();
        chrome.management.get(bg.ietab.extensionId, callback);
    },

    /**
     * <p>Expands the contents of all sections.</p>
     * @param {Event} [event] The event triggered.
     * @event
     * @requies jQuery
     * @private
     */
    expandAll: function (event) {
        $('.section h4').addClass('toggle-collapse')
                .removeClass('toggle-expand').next('.content').slideDown();
    },

    /**
     * <p>Replaces the value of the specified attribute of the selected
     * element(s) to the localized String looked up from Chrome.</p>
     * @param {String} selector A String containing a jQuery selector expression
     * to select the element(s) to be modified.
     * @param {String} attribute The name of the attribute to be modified.
     * @param {String} name The name of the localized message to be retrieved.
     * @param {String|String[]} [sub] The String(s) to substituted in the
     * returned message (where applicable).
     * @returns {jQuery} The modified element(s) wrapped in jQuery.
     * @since 0.1.0.0
     * @requires jQuery
     * @private
     */
    i18nAttribute: function (selector, attribute, name, sub) {
        return $(selector).attr(attribute, chrome.i18n.getMessage(name, sub));
    },

    /**
     * <p>Replaces the inner HTML of the selected element(s) with the localized
     * String looked up from Chrome.</p>
     * @param {String} selector A String containing a jQuery selector expression
     * to select the element(s) to be modified.
     * @param {String} name The name of the localized message to be retrieved.
     * @param {String|String[]} [sub] The String(s) to substituted in the
     * returned message (where applicable).
     * @returns {jQuery} The modified element(s) wrapped in jQuery.
     * @since 0.1.0.0 - Previously located in {@link utils}.
     * @requires jQuery
     * @private
     */
    i18nReplace: function (selector, name, sub) {
        return $(selector).html(chrome.i18n.getMessage(name, sub));
    },

    /**
     * <p>Initializes the options page.</p>
     * <p>This involves inserting and configuring the UI elements as well as
     * the insertion of localized Strings and most importantly loading the
     * current settings.</p>
     * @requires jQuery
     */
    init: function () {
        // Inserts localized Strings
        options.i18nReplace('title, #options_hdr', 'opt_title');
        options.i18nReplace('#features_hdr', 'opt_feature_header');
        // TODO: Remove ID selector
        options.i18nReplace('#feature_enabled_txt, .feature_enabled_txt',
                'opt_feature_enabled_text');
        options.i18nReplace('#shorteners_hdr', 'opt_url_shortener_header');
        options.i18nReplace('#shorteners_name_hdr',
                'opt_url_shortener_name_header');
        options.i18nReplace('#shorteners_enabled_hdr',
                'opt_url_shortener_enabled_header');
        options.i18nReplace('#shorteners_config_hdr',
                'opt_url_shortener_config_header');
        options.i18nReplace('#bitly_xlogin_txt',
                'opt_url_shortener_username_text');
        options.i18nReplace('#bitly_xapi_key_txt',
                'opt_url_shortener_api_key_text');
        options.i18nReplace('#googl_oauth_enabled_txt',
                'opt_url_shortener_oauth_enable_text');
        options.i18nReplace('#anchors_hdr', 'opt_anchor_header');
        options.i18nReplace('#doAnchorTarget_txt', 'opt_anchor_target_text');
        options.i18nReplace('#doAnchorTitle_txt', 'opt_anchor_title_text');
        options.i18nReplace('#notifications_hdr', 'opt_notification_header');
        options.i18nReplace('#notifications_txt', 'opt_notification_text');
        options.i18nReplace('#notificationDuration_txt1',
                'opt_notification_timer_text1');
        options.i18nReplace('#notificationDuration_txt2',
                'opt_notification_timer_text2');
        options.i18nReplace('#shortcuts_hdr', 'opt_shortcut_header');
        options.i18nReplace('#shortcuts_txt', 'opt_shortcut_text');
        options.i18nReplace('#saveAndClose_btn', 'opt_save_button');
        options.i18nReplace('#expandAll_lnk', 'opt_expand_all');
        options.i18nReplace('#collapseAll_lnk', 'opt_collapse_all');
        options.i18nReplace('#footer', 'opt_footer',
                String(new Date().getFullYear()));
        // Binds options:collapseAll and options:expandAll events to the links
        $('#collapseAll_lnk').click(options.collapseAll);
        $('#expandAll_lnk').click(options.expandAll);
        // Binds options:saveAndClose event to button
        $('#saveAndClose_btn').click(options.saveAndClose);
        // Binds options:toggleSection to section headers
        $('.section h4').click(options.toggleSection);
        // Loads current option values
        options.load();
        var bg = chrome.extension.getBackgroundPage(), keyMods = '';
        if (bg.urlcopy.isThisPlatform('mac')) {
            keyMods = bg.urlcopy.shortcutMacModifiers;
        } else {
            keyMods = bg.urlcopy.shortcutModifiers;
        }
        // TODO: Remove ID selector
        $('#feature_shortcut_txt, .featureShortcutText').html(keyMods);
        // Initialize facebox
        $('a[rel*=facebox]').facebox();
        // TODO: Replace with extension detection
        // Displays IE Tab options if extension is detected
        // TODO: Verify data sent/received with IE Tab author and ammend below
        chrome.extension.sendRequest(bg.ietab.extensionId, {
            key: 'version',
            type: 'GETLS'
        }, function (response) {
            if (response) {
                $('#ieTabSettingDiv').show();
            }
        });
    },

    /**
     * <p>Returns whether or not the specified name is available for use as a
     * feature.</p>
     * @param {String} name The name to be queried.
     * @returns {Boolean} <code>true</code> if the name is not already in use;
     * otherwise <code>false</code>.
     * @requires jQuery
     * @since 0.1.0.0
     * @private
     */
    isNameAvailable: function (name) {
        var available = true;
        $('#features option').each(function () {
            if ($(this).val() === name) {
                available = false;
                return false;
            }
        });
        return available;
    },

    /**
     * <p>Returns whether or not the specified name is valid for use as a
     * feature.</p>
     * @param {String} name The name to be queried.
     * @returns {Boolean} <code>true</code> if the name is valid; otherwise
     * <code>false</code>.
     * @since 0.1.0.0
     * @private
     */
    isNameValid: function (name) {
        return name.search(options.rValidName) !== -1;
    },

    /**
     * <p>Updates the options page with the values of the current settings.</p>
     * @requires jQuery
     */
    load: function () {
        options.loadFeatures();
        options.loadNotifications();
        options.loadUrlShorteners();
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
     * provided. This is to be inserted in to the <code>&lt;select/&gt;</code>
     * managing features on the options page.</p>
     * @param {Object} feature The information of the feature to be used.
     * @returns {jQuery} The <code>&lt;option/&gt;</code> element in a jQuery
     * wrapper.
     * @requires jQuery
     * @since 0.1.0.0
     * @private
     */
    loadFeature: function (feature) {
        var opt = $('<option/>', {
            text: feature.title,
            value: feature.name
        }).appendTo('#features');
        opt.data('image', feature.image);
        opt.data('index', String(feature.index));
        opt.data('enabled', String(feature.enabled));
        opt.data('readOnly', String(feature.readOnly));
        opt.data('shortcut', feature.shortcut);
        opt.data('template', feature.template);
        return opt;
    },

    /**
     * <p>Updates the feature section of the options page with the current
     * settings.</p>
     * @requires jQuery
     * @private
     */
    loadFeatures: function () {
        var bg = chrome.extension.getBackgroundPage();
        // Ensures clean slate
        $('#features option').remove();
        // Creates and inserts options representing features
        for (var i = 0; i < bg.urlcopy.features.length; i++) {
            options.loadFeature(bg.urlcopy.features[i]);
        }
        /*
         * Whenever the selected option changes we want all the controls to
         * represent the current selection (where possible).
         */
        $('#features').change(function (event) {
            var $this = $(this),
                opt = $this.find('option:selected');
            // Disables all the controls as no option is selected
            if (opt.length === 0) {
                $('#moveUp_btn, #moveDown_btn, .toggle-feature')
                        .attr('disabled', 'disabled');
                $('#add_btn, #feature_name, #feature_title')
                        .removeAttr('disabled');
                $('#feature_name, #feature_title').removeAttr('readonly');
                $('#feature_enabled').removeAttr('checked');
                $('#feature_name').val('');
                $('#feature_shortcut').val('');
                $('#feature_template').val('');
                $('#feature_title').val('');
            } else {
                $('#add_btn, #feature_name').attr('disabled', 'disabled');
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
                // Updates feature index to ensure order is maintained
                opt.data('index', String($this.find('option').index(opt)));
                // Updates fields and controls to reflect selected feature
                $('#feature_name').val(opt.val());
                $('#feature_shortcut').val(opt.data('shortcut'));
                $('#feature_template').val(opt.data('template'));
                $('#feature_title').val(opt.text());
                if (opt.data('enabled') === 'true') {
                    $('#feature_enabled').attr('checked', 'checked');
                } else {
                    $('#feature_enabled').removeAttr('checked');
                }
                if (opt.data('readOnly') === 'true') {
                    $('#delete_btn, .read-only').attr('disabled', 'disabled');
                    $('.read-only').attr('readonly', 'readonly');
                } else {
                    $('#delete_btn, .read-only').removeAttr('disabled');
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
        // TODO
        $('#add_btn').click(function (event) {
            var name = $('#feature_name').val().trim(),
                title = $('#feature_title').val().trim();
            if (options.isNameValid(name)) {
                if (options.isNameAvailable(name)) {
                    var opt = options.loadFeature({
                        image: 'copy_url.png',
                        enabled: true,
                        name: name,
                        readOnly: false,
                        shortcut: '',
                        template: '',
                        title: title
                    });
                    opt.attr('selected', 'selected');
                    $('#features').change().focus();
                } else {
                    // TODO: Notify user of unavailable name
                }
            } else {
                // TODO: Notify user of invalid name
            }
        });
        // Removes selected unprotected feature
        $('#delete_btn').click(function (event) {
            var opt = $('#features option:selected');
            if (opt.data('readOnly') !== 'true') {
                opt.remove();
                $('#features').change();
            }
        });
        /*
         * Moves the selected option down one when the 'down' control is
         * clicked.
         */
        $('#moveDown_btn').click(function (event) {
            var opt = $('#features option:selected');
            opt.insertAfter(opt.next());
            $('#features').change();
        });
        // Moves the selected option up one when the 'up' control is clicked
        $('#moveUp_btn').click(function (event) {
            var opt = $('#features option:selected');
            opt.insertBefore(opt.prev());
            $('#features').change();
        });
        /*
         * Updates the 'enabled' data bound to the selected option when the
         * checkbox control is clicked.
         */
        $('#feature_enabled').click(function (event) {
            $('#features option:selected').data('enabled',
                    String($(this).is(':checked')));
        });
    },

    /**
     * <p>Updates the notification section of the options page with the current
     * settings.</p>
     * @requires jQuery
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
        // Ensures clean slate
        $('#notificationDuration option').remove();
        // Creates and inserts options for available auto-hide time in seconds
        for (var i = 0; i <= 30; i++) {
            var opt = $('<option/>', {
                text: i,
                value: i
            });
            if (i === timeInSecs) {
                opt.attr('selected', 'selected');
            }
            opt.appendTo('#notificationDuration');
        }
    },

    /**
     * <p>Updates the URL shorteners section of the options page with the
     * current settings.</p>
     * @requires jQuery
     * @private
     */
    loadUrlShorteners: function () {
        $('input[name="enabled_shortener"]').each(function () {
            var radio = $(this);
            if (utils.get(radio.attr('id'))) {
                radio.attr('checked', 'checked');
            }
        });
        $('#bitly_xapi_key').val(utils.get('bitly_xapi_key'));
        $('#bitly_xlogin').val(utils.get('bitly_xlogin'));
        if (utils.get('googl_oauth_enabled')) {
            $('#googl_oauth_enabled').attr('checked', 'checked');
        } else {
            $('#googl_oauth_enabled').removeAttr('checked');
        }
        $('#yourls_password').val(utils.get('yourls_password'));
        $('#yourls_signature').val(utils.get('yourls_signature'));
        $('#yourls_url').val(utils.get('yourls_url'));
        $('#yourls_username').val(utils.get('yourls_username'));
    },

    /**
     * <p>Updates the settings with the values from the options page.</p>
     * @requires jQuery
     */
    save: function () {
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
        options.save();
        chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.remove(tab.id);
        });
    },

    /**
     * <p>Updates the settings with the values from the feature section of the
     * options page.</p>
     * @requires jQuery
     * @private
     */
    saveFeatures: function () {
        var bg = chrome.extension.getBackgroundPage();
        /*
         * Updates each individual feature settings based on their
         * corresponding options.
         */
        $('#features option').each(function (index) {
            var opt = $(this);
            switch (opt.val()) {
                case bg.feature.anchor.name:
                    utils.set('copyAnchorEnabled',
                            opt.data('enabled') === 'true');
                    utils.set('copyAnchorOrder', index);
                    break;
                case bg.feature.bbcode.name:
                    utils.set('copyBBCodeEnabled',
                            opt.data('enabled') === 'true');
                    utils.set('copyBBCodeOrder', index);
                    break;
                case bg.feature.encoded.name:
                    utils.set('copyEncodedEnabled',
                            opt.data('enabled') === 'true');
                    utils.set('copyEncodedOrder', index);
                    break;
                case bg.feature.short.name:
                    utils.set('copyShortEnabled',
                            opt.data('enabled') === 'true');
                    utils.set('copyShortOrder', index);
                    break;
                case bg.feature.url.name:
                    utils.set('copyUrlEnabled',
                            opt.data('enabled') === 'true');
                    utils.set('copyUrlOrder', index);
                    break;
            }
        });
        // Ensures features data reflects the updated settings
        bg.urlcopy.updateFeatures();
    },

    /**
     * <p>Updates the settings with the values from the notification section of
     * the options page.</p>
     * @requires jQuery
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
     * @requires jQuery
     * @private
     */
    saveUrlShorteners: function () {
        $('input[name="enabled_shortener"]').each(function () {
            var radio = $(this);
            utils.set(radio.attr('id'), radio.is(':checked'));
        });
        utils.set('bitly_xapi_key', $('#bitly_xapi_key').val());
        utils.set('bitly_xlogin', $('#bitly_xlogin').val());
        utils.set('googl_oauth_enabled',
                $('#googl_oauth_enabled').is(':checked'));
        utils.set('yourls_password', $('#yourls_password').val());
        utils.set('yourls_signature', $('#yourls_signature').val());
        utils.set('yourls_url', $('#yourls_url').val());
        utils.set('yourls_username', $('#yourls_username').val());
    },

    /**
     * <p>Toggles the visibility of the content of the section that triggered
     * the event.</p>
     * @param {Event} [event] The event triggered.
     * @event
     * @requies jQuery
     * @private
     */
    toggleSection: function (event) {
        $(event.target).toggleClass('toggle-collapse toggle-expand')
                .next('.content').slideToggle();
    }

};