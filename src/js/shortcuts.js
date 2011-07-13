// Injects listener for extension keyboard shortcuts in to page context
(function () {
    // Only adds listener if previous injection isn't detected
    if (document.body.hasAttribute('url_copy_injected')) {
        return;
    }
    document.body.setAttribute('url_copy_injected', true);
    document.body.addEventListener('keyup', function (e) {
        var isMac = navigator.userAgent.toLowerCase().indexOf('mac') !== -1;
        if ((e.ctrlKey && e.altKey && !isMac) ||
                (e.metaKey && e.shiftKey && isMac)) {
            chrome.extension.sendRequest({
                data: {
                    event: e,
                    key: String.fromCharCode(e.keyCode).toUpperCase()
                },
                type: 'shortcut'
            });
        }
    }, false);
}());