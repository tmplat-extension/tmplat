/**
 * <p>Serves the request of the specified mode to the background page.</p>
 * @param {String} mode The mode to be served.
 * @see clipboard.service
 * @since 0.0.1.0
 */
function service(mode) {
    var bg = chrome.extension.getBackgroundPage();
    bg.clipboard.service(mode);
}

/**
 * <p>Creates a <code>&lt;li/&gt;</code> representing a feature (or "mode") to be inserted in to the <code>&lt;ul/&gt;</code> in the popup.</p>
 * @param {String} id The identifier to be assigned to the element.
 * @param {String} mode The mode represented by the element.
 * @param {String} shortcut The keyboard shortcut displayed in this element.
 * @returns {jQuery} The newly created <code>&lt;li/&gt;</code> wrapped in jQuery.
 * @requires jQuery
 * @since 0.0.2.0
 */
function createFeature(id, mode, shortcut) {
    var item = $('<li/>', {
        'id': id + 'Item'
    }).click(function() {
        service(mode);
    });
    var menu = $('<div/>', {
        'class': 'menu',
        'id': id
    });
    menu.append($('<span/>', {
        'class': 'text',
        'id': id + 'Text'
    }));
    menu.append($('<span/>', {
        'class': 'shortcut',
        'id': id + 'Shortcut',
        'text': shortcut
    }));
    item.append(menu);
    return item;
}

/**
 * <p>Replaces the inner HTML of the selected element(s) with the localized String looked up from Chrome.</p>
 * @param {String} selector A String containing a jQuery selector expression to select the element(s) to be modified.
 * @param {String} name The name of the localized message to be retrieved.
 * @param {String|String[]} [sub] The String(s) to substituted in the returned message (where applicable).
 * @returns {jQuery} The modified element(s) wrapped in jQuery.
 * @requires jQuery
 * @since 0.0.1.0
 */
function i18nReplace(selector, name, sub) {
    return $(selector).html(((typeof(sub) === 'undefined') ? chrome.i18n.getMessage(name) : chrome.i18n.getMessage(name, sub)));
}

/**
 * <p>Calculates the widest text <code>&lt;div/&gt;</code> in the popup and assigns that width to all others.</p>
 * @requires jQuery
 * @since 0.0.2.0
 */
function resizeText() {
    var width = 0;
    $('li .text').each(function() {
        var scrollWidth = this.scrollWidth;
        if (scrollWidth > width) {
            width = scrollWidth;
        }
    });
    $('li .text').css('width', width + 'px');
}

/**
 * <p>Initializes the popup page.</p>
 * <p>This involves inserting and configuring the UI elements as well as the insertion of localized Strings.</p>
 * @requires jQuery
 * @since 0.0.1.0
 */
function init() {
    var bg = chrome.extension.getBackgroundPage();
    // Inserts list items created for all enabled features
    for (i = 0; i < bg.clipboard.features.length; i++) {
        var feature = bg.clipboard.features[i];
        if (feature.enabled) {
            // Derives the correct keyboard shortcut to display
            var shortcut = feature.shortcut;
            if (bg.clipboard.isThisPlatform('mac')) {
                shortcut = feature.macShortcut;
            }
            $('#item ul').append(createFeature(feature.id, feature.name, shortcut));
        }
    }
    // Inserts localized Strings
    i18nReplace('#copyAnchorText', 'copy_anchor');
    i18nReplace('#copyBBCodeText', 'copy_bbcode');
    i18nReplace('#copyEncodedUrlText', 'copy_encoded');
    i18nReplace('#copyShortUrlText', 'copy_short');
    i18nReplace('#copyUrlText', 'copy_url');
    i18nReplace('#ieTabText', 'ie_tab');
    i18nReplace('#shortening', 'shortening');
    // Shows IE Tab indicator if extension is detected for the selected tab
    chrome.tabs.getSelected(null, function(tab) {
        if (bg.ietab.isActive(tab)) {
            $('#ieTabItem').show();
        }
    });
    // Shows all keyboard shortcuts if user enabled option
    if (getLocalStorage('settingShortcut')) {
        $('.shortcut').show();
        // TODO: Change to improve L&F on Mac
        $('body').css('min-width', '190px');
    }
    // Ensures consistent widths keeping the popup tidy
    resizeText();
}