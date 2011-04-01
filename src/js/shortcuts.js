// Injects listener for extension keyboard shortcuts in to page context
(function () {
    // Only adds listener if previous injection isn't detected
    if (document.body.hasAttribute('url_copy_injected')) {
        return;
    }
    document.body.setAttribute('url_copy_injected', true);
    /*
     * TODO: Confirm 'keydown' is best choice (e.g. 'keyup').
     * Verify keyCodes are still correct if 'keyup' is used instead.
     */
    document.body.addEventListener('keydown', function (event) {
        var isMac = navigator.userAgent.toLowerCase().indexOf('mac') !== -1;
        if ((event.ctrlKey && event.altKey && !isMac) ||
            (event.metaKey && event.altKey && isMac)) {
            /*
             * Determines the requested feature before serving it to extension's
             * request handler.
             */
            switch (event.keyCode) {
                case 85: // 'U'
                    chrome.extension.sendRequest({'feature': 'copy_url'});
                    break;
                case 83: // 'S'
                    chrome.extension.sendRequest({'feature': 'copy_short'});
                    break;
                case 65: // 'A'
                    chrome.extension.sendRequest({'feature': 'copy_anchor'});
                    break;
                case 66: // 'B'
                    chrome.extension.sendRequest({'feature': 'copy_bbcode'});
                    break;
                case 69: // 'E'
                    chrome.extension.sendRequest({'feature': 'copy_encoded'});
                    break;
            }
        }
    }, false);
}());