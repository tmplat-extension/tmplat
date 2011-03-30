var shortcuts = {

    init: function() {
        if (document.body.hasAttribute('url_copy_injected')) {
            return;
        }
        document.body.setAttribute('url_copy_injected', true);
        document.body.addEventListener('keydown', shortcuts.service, false);
    },

    isThisPlatform: function(operationSystem) {
        return navigator.userAgent.toLowerCase().indexOf(operationSystem) !== -1;
    },

    sendMessage: function(message) {
        chrome.extension.sendRequest(message);
    },

    service: function(event) {
        var isMac = shortcuts.isThisPlatform('mac');
        if ((event.ctrlKey && event.altKey && !isMac) || (event.metaKey && event.altKey && isMac)) {
            switch (event.keyCode) {
                case 85: // 'U'
                    shortcuts.sendMessage({mode: 'copy_url'});
                    break;
                case 83: // 'S'
                    shortcuts.sendMessage({mode: 'copy_short'});
                    break;
                case 65: // 'A'
                    shortcuts.sendMessage({mode: 'copy_anchor'});
                    break;
                case 66: // 'B'
                    shortcuts.sendMessage({mode: 'copy_bbcode'});
                    break;
                case 69: // 'E'
                    shortcuts.sendMessage({mode: 'copy_encoded'});
                    break;
            }
        }
    }
};

shortcuts.init();