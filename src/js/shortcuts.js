// Injects listener for extension keyboard shortcuts in to page context
(function () {
    var isMac = navigator.userAgent.toLowerCase().indexOf('mac') !== -1;
    // Only adds listener if previous injection isn't detected
    if (document.body.hasAttribute('url_copy_injected')) {
        return;
    }
    /**
     * <p>Returns whether or not the event provided was fired by either of the
     * meta keys.</p>
     * @param {Event} e The event triggered.
     * @return {Boolean} <code>true</code> if the event was fired by a meta key;
     * otherwise <code>false</code>.
     * @since 0.1.0.0
     * @private
     */
    function isMetaKey(e) {
        return e.keyCode === 91 || e.keyCode === 93;
    }
    /**
     * <p>Extracts and sends the data required by the background page to handle
     * the fired event.</p>
     * @param {Event} e The event triggered.
     * @since 0.1.0.0
     * @private
     */
    function sendRequest(e) {
        chrome.extension.sendRequest({
            data: {
                key: String.fromCharCode(e.keyCode).toUpperCase()
            },
            type: 'shortcut'
        });
    }
    document.body.setAttribute('url_copy_injected', true);
    if (isMac) {
        var metaKey = false, shiftKey = false;
        document.body.addEventListener('keydown', function (e) {
            if (isMetaKey(e)) {
                metaKey = true;
            } else if (e.keyCode === 16) {
                shiftKey = true;
            }
        }, false);
        document.body.addEventListener('keyup', function (e) {
            if (isMetaKey(e)) {
                metaKey = false;
            } else if (e.keyCode === 16) {
                shiftKey = false;
            } else if (metaKey && shiftKey) {
                sendRequest(e);
            }
        }, false);
    } else {
        document.body.addEventListener('keyup', function (e) {
            if (e.ctrlKey && e.altKey) {
                sendRequest(e);
            }
        }, false);
    }
})();