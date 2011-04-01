/**
 * <p>Responsible for the popup page.</p>
 * @author <a href="http://github.com/neocotic">Alasdair Mercer</a>
 * @since 0.0.2.1
 */
var popup = {

    /**
     * <p>Creates a <code>&lt;li/&gt;</code> representing a feature to be
     * inserted in to the <code>&lt;ul/&gt;</code> in the popup.</p>
     * @param {String} id The identifier to be assigned to the element.
     * @param {String} name The name of the feature represented by the element.
     * @param {String} shortcut The keyboard shortcut displayed in this element.
     * @returns {jQuery} The newly created <code>&lt;li/&gt;</code> wrapped in
     * jQuery.
     * @requires jQuery
     * @private
     */
    createFeature: function (id, name, shortcut) {
        var item = $('<li/>', {
            'id': id + 'Item'
        }).click(function () {
            popup.service(name);
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
    },

    /**
     * <p>Initializes the popup page.</p>
     * <p>This involves inserting and configuring the UI elements as well as the
     * insertion of localized Strings.</p>
     * @constructs
     * @requires jQuery
     */
    init: function () {
        var bg = chrome.extension.getBackgroundPage();
        // Inserts list items created for all enabled features
        for (var i = 0; i < bg.clipboard.features.length; i++) {
            var feature = bg.clipboard.features[i];
            if (feature.isEnabled()) {
                // Derives the correct keyboard shortcut to display
                var shortcut = feature.getShortcut();
                if (bg.clipboard.isThisPlatform('mac')) {
                    shortcut = feature.getMacShortcut();
                }
                $('#item ul').append(popup.createFeature(feature.id,
                        feature.name, shortcut));
            }
        }
        // Inserts localized Strings
        utils.i18nReplace('#copyAnchorText', 'copy_anchor');
        utils.i18nReplace('#copyBBCodeText', 'copy_bbcode');
        utils.i18nReplace('#copyEncodedUrlText', 'copy_encoded');
        utils.i18nReplace('#copyShortUrlText', 'copy_short');
        utils.i18nReplace('#copyUrlText', 'copy_url');
        utils.i18nReplace('#ieTabText', 'ie_tab');
        utils.i18nReplace('#shortening', 'shortening');
        // Shows IE Tab indicator if extension is detected for the selected tab
        chrome.tabs.getSelected(null, function (tab) {
            if (bg.ietab.isActive(tab)) {
                $('#ieTabItem').show();
            }
        });
        // Shows all keyboard shortcuts if user enabled option
        if (utils.get('settingShortcut')) {
            $('.shortcut').show();
            // TODO: Change to improve L&F on Mac
            $('body').css('min-width', '190px');
        }
        // Ensures consistent widths keeping the popup tidy
        popup.resizeText();
    },

    /**
     * <p>Calculates the widest text <code>&lt;div/&gt;</code> in the popup and
     * assigns that width to all others.</p>
     * @requires jQuery
     * @private
     */
    resizeText: function () {
        var width = 0;
        $('li .text').each(function () {
            var scrollWidth = this.scrollWidth;
            if (scrollWidth > width) {
                width = scrollWidth;
            }
        });
        $('li .text').css('width', width + 'px');
    },

    /**
     * <p>Serves the request of the specified mode to the background page.</p>
     * @param {String} mode The mode to be served.
     * @see clipboard.service
     * @private
     */
    service: function (mode) {
        var bg = chrome.extension.getBackgroundPage();
        bg.clipboard.service(mode);
    }

};

popup.init();