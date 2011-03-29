function service(mode) {
    var bg = chrome.extension.getBackgroundPage();
    bg.clipboard.service(mode);
}

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

function i18nReplace(selector, name, sub) {
    return $(selector).html(((typeof(sub) === 'undefined') ? chrome.i18n.getMessage(name) : chrome.i18n.getMessage(name, sub)));
}

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

function init() {
    var bg = chrome.extension.getBackgroundPage();
    for (i = 0; i < bg.clipboard.features.length; i++) {
        var feature = bg.clipboard.features[i];
        if (feature.enabled) {
            var shortcut = feature.shortcut;
            if (bg.clipboard.isThisPlatform('mac')) {
                shortcut = feature.macShortcut;
            }
            $('#item ul').append(createFeature(feature.id, feature.name, shortcut));
        }
    }
    i18nReplace('#copyAnchorText', 'copy_anchor');
    i18nReplace('#copyBBCodeText', 'copy_bbcode');
    i18nReplace('#copyEncodedUrlText', 'copy_encoded');
    i18nReplace('#copyShortUrlText', 'copy_short');
    i18nReplace('#copyUrlText', 'copy_url');
    i18nReplace('#ieTabText', 'ie_tab');
    i18nReplace('#shortening', 'shortening');
    chrome.tabs.getSelected(null, function(tab) {
        if (bg.ietab.isActive(tab)) {
            $('#ieTabItem').show();
        }
    });
    if (getLocalStorage('settingShortcut')) {
        $('.shortcut').show();
        $('body').css('min-width', '190px');
    }
    resizeText();
}