// Injects listener for extension keyboard shortcuts in to page context
(function () {
    // Only adds listener if previous injection isn't detected
    if (document.body.hasAttribute('url_copy_injected')) {
        return;
    }
    document.body.setAttribute('url_copy_injected', true);
    document.body.addEventListener('keyup', function (event) {
        var isMac = navigator.userAgent.toLowerCase().indexOf('mac') !== -1;
        if ((event.ctrlKey && event.altKey && !isMac) ||
            (event.metaKey && event.altKey && isMac)) {
            var data = {'shortcut': true};
            /*
             * Determines the requested feature before serving it to extension's
             * request handler.
             */
            switch (event.keyCode) {
                case 85: // 'U'
                    data.feature = 'copy_url';
                    break;
                case 83: // 'S'
                    data.feature = 'copy_short';
                    break;
                case 65: // 'A'
                    data.feature = 'copy_anchor';
                    break;
                case 66: // 'B'
                    data.feature = 'copy_bbcode';
                    break;
                case 69: // 'E'
                    data.feature = 'copy_encoded';
                    break;
            }
            if (data.feature) {
                 chrome.extension.sendRequest(data);
            }
        }
    }, false);
}());