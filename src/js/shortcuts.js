// Injects listener for extension keyboard shortcuts in to page context
(function () {
    // Only adds listener if previous injection isn't detected
    if (document.body.hasAttribute('template_hotkeys_active')) {
        return;
    }
    var isMac = navigator.userAgent.toLowerCase().indexOf('mac') !== -1;
    document.body.setAttribute('template_hotkeys_active', true);
    window.addEventListener('keyup', function (e) {
        if ((!isMac && e.ctrlKey && e.altKey) ||
                (isMac && e.shiftKey && e.altKey)) {
            chrome.extension.sendRequest({
                data: {
                    key: String.fromCharCode(e.keyCode).toUpperCase()
                },
                type: 'shortcut'
            });
        }
    });
})();