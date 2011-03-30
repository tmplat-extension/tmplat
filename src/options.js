function i18nReplace(selector, name, sub) {
    return $(selector).html(((typeof(sub) === 'undefined') ? chrome.i18n.getMessage(name) : chrome.i18n.getMessage(name, sub)));
}

function load() {
    var bg = chrome.extension.getBackgroundPage();
    for (i = 0; i < bg.clipboard.features.length; i++) {
        var feature = bg.clipboard.features[i];
        var opt = $('<option/>', {
            'text': chrome.i18n.getMessage(feature.name),
            'value': feature.name
        }).appendTo('#settingFeatures');
        opt.data('enabled', String(feature.enabled));
    }
    $('#settingFeatures').change(function(event) {
        var opt = $(this).find('option:selected');
        if (opt.length === 0) {
            $('#moveDownButton, #moveUpButton, #settingFeatureEnabled').attr('disabled', 'disabled');
        } else {
            if (opt.is(':first-child')) {
                $('#moveUpButton').attr('disabled', 'disabled');
            } else {
                $('#moveUpButton').removeAttr('disabled');
            }
            if (opt.is(':last-child')) {
                $('#moveDownButton').attr('disabled', 'disabled');
            } else {
                $('#moveDownButton').removeAttr('disabled');
            }
            if (opt.data('enabled') === 'true') {
                $('#settingFeatureEnabled').attr('checked', 'checked');
            } else {
                $('#settingFeatureEnabled').removeAttr('checked');
            }
            if (bg.clipboard.URL_MODE === opt.val()) {
                $('#settingFeatureEnabled').attr('disabled', 'disabled');
            } else {
                $('#settingFeatureEnabled').removeAttr('disabled');
            }
        }
        $('#moveDownButton:not([disabled]) img').attr('src', 'images/move_down.gif');
        $('#moveUpButton:not([disabled]) img').attr('src', 'images/move_up.gif');
        $('#moveDownButton[disabled] img').attr('src', 'images/move_down_disabled.gif');
        $('#moveUpButton[disabled] img').attr('src', 'images/move_up_disabled.gif');
    }).change();
    $('#moveDownButton').click(function(event) {
        var opt = $('#settingFeatures option:selected');
        opt.insertAfter(opt.next());
        $('#settingFeatures').change();
    });
    $('#moveUpButton').click(function(event) {
        var opt = $('#settingFeatures option:selected');
        opt.insertBefore(opt.prev());
        $('#settingFeatures').change();
    });
    $('#settingFeatureEnabled').click(function(event) {
        if ($(this).is(':checked')) {
            $('#settingFeatures option:selected').data('enabled', 'true');
        } else {
            $('#settingFeatures option:selected').data('enabled', 'false');
        }
    });
    if (getLocalStorage('settingNotification')) {
        $('#settingNotification').attr('checked', 'checked');
    } else {
        $('#settingNotification').removeAttr('checked');
    }
    var timeInSecs = (getLocalStorage('settingNotificationTimer') > 0) ? getLocalStorage('settingNotificationTimer') / 1000 : 0;
    for (i = 0; i <= 30; i++) {
        var timeOpt = $('<option/>', {
            'text': i,
            'value': i
        });
        if (i === timeInSecs) {
            timeOpt.attr('selected', 'selected');
        }
        timeOpt.appendTo('#settingNotificationTimer');
    }
    if (getLocalStorage('settingShortcut')) {
        $('#settingShortcut').attr('checked', 'checked');
    } else {
        $('#settingShortcut').removeAttr('checked');
    }
    if (getLocalStorage('settingTitleAttr')) {
        $('#settingTitleAttr').attr('checked', 'checked');
    } else {
        $('#settingTitleAttr').removeAttr('checked');
    }
    if (getLocalStorage('settingIeTabExtract')) {
        $('#settingIeTabExtract').removeAttr('checked');
    } else {
        $('#settingIeTabExtract').attr('checked', 'checked');
    }
    if (getLocalStorage('settingIeTabTitle')) {
        $('#settingIeTabTitle').attr('checked', 'checked');
    } else {
        $('#settingIeTabTitle').removeAttr('checked');
    }
}

function save() {
    setLocalStorage('settingNotification', $('#settingNotification').is(':checked'));
    var timeInSecs = parseInt($('#settingNotificationTimer').val(), 10);
    setLocalStorage('settingNotificationTimer', ((timeInSecs) ? timeInSecs * 1000 : 0));
    setLocalStorage('settingShortcut', $('#settingShortcut').is(':checked'));
    setLocalStorage('settingTitleAttr', $('#settingTitleAttr').is(':checked'));
    setLocalStorage('settingIeTabExtract', !$('#settingIeTabExtract').is(':checked'));
    setLocalStorage('settingIeTabTitle', $('#settingIeTabTitle').is(':checked'));
    var bg = chrome.extension.getBackgroundPage();
    $('#settingFeatures option').each(function(index) {
        var opt = $(this);
        switch (opt.val()) {
            case bg.clipboard.ANCHOR_MODE:
                setLocalStorage('copyAnchorEnabled', opt.data('enabled') === 'true');
                setLocalStorage('copyAnchorOrder', index);
                break;
            case bg.clipboard.BBCODE_MODE:
                setLocalStorage('copyBBCodeEnabled', opt.data('enabled') === 'true');
                setLocalStorage('copyBBCodeOrder', index);
                break;
            case bg.clipboard.ENCODED_MODE:
                setLocalStorage('copyEncodedEnabled', opt.data('enabled') === 'true');
                setLocalStorage('copyEncodedOrder', index);
                break;
            case bg.clipboard.SHORT_MODE:
                setLocalStorage('copyShortEnabled', opt.data('enabled') === 'true');
                setLocalStorage('copyShortOrder', index);
                break;
            case bg.clipboard.URL_MODE:
                setLocalStorage('copyUrlEnabled', opt.data('enabled') === 'true');
                setLocalStorage('copyUrlOrder', index);
                break;
        }
    });
    bg.clipboard.updateFeatures();
}

function saveAndClose() {
    save();
    chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.remove(tab.id);
    });
}

function init() {
    document.title = chrome.i18n.getMessage('opt_title');
    i18nReplace('#optionTitle', 'opt_title');
    i18nReplace('#featureSetting', 'opt_feature_header');
    i18nReplace('#settingFeatureEnabledText', 'opt_feature_enabled_text');
    i18nReplace('#anchorSetting', 'opt_anchor_header');
    i18nReplace('#settingTitleAttrText', 'opt_anchor_title_text');
    i18nReplace('#notificationSetting', 'opt_notification_header');
    i18nReplace('#settingNotificationText', 'opt_notification_text');
    i18nReplace('#settingNotificationTimerText1', 'opt_notification_timer_text1');
    i18nReplace('#settingNotificationTimerText2', 'opt_notification_timer_text2');
    i18nReplace('#shorcutSetting', 'opt_shortcut_header');
    i18nReplace('#settingShortcutText', 'opt_shortcut_text');
    i18nReplace('#ieTabSetting', 'opt_ie_tab_header');
    i18nReplace('#settingIeTabExtractText', 'opt_ie_tab_extract_text');
    i18nReplace('#settingIeTabTitleText', 'opt_ie_tab_title_text');
    i18nReplace('#ieTabFooter', 'opt_ie_tab_footer');
    i18nReplace('#ieTabExtension', 'extension');
    i18nReplace('#ieTabWebsite', 'website');
    i18nReplace('#saveAndClose', 'opt_save_button');
    i18nReplace('#footer', 'opt_footer', String(new Date().getFullYear()));
    load();
    var bg = chrome.extension.getBackgroundPage();
    // TODO: Verify data sent/received with IE Tab author and ammend below
    chrome.extension.sendRequest(bg.ietab.EXTENSION_ID, {
        'key': 'version',
        'type': 'GETLS'
    }, function(response) {
        $('#ieTabSettingDiv').show();
    });
}