/**
 * <p>Responsible for the popup page.</p>
 * @author <a href="http://github.com/neocotic">Alasdair Mercer</a>
 * @since 0.0.2.1
 * @namespace
 */
var popup = {

    /**
     * <p>Initializes the popup page.</p>
     * <p>This involves inserting the HTML prepared by the background page and
     * configuring the display of some elements based on certain conditions
     * being met.</p>
     */
    init: function () {
        var bg = chrome.extension.getBackgroundPage();
        // Inserts prepared HTML in to body element
        document.body.innerHTML = bg.clipboard.popupHTML;
        // Shows IE Tab indicator if extension is detected for the selected tab
        chrome.tabs.getSelected(null, function (tab) {
            if (bg.ietab.isActive(tab)) {
                document.getElementById('ieTabItem').style = 'display: block';
            }
        });
        // Fix dimensions if shortcuts are enabled
        if (utils.get('settingShortcut')) {
            document.body.style = 'min-width: 190px';
        }
    },

    /**
     * <p>Sends the request to the background page for the clicked feature
     * item.</p>
     * @event
     * @param {Element} item The calling feature item clicked.
     */
    sendRequest: function (item) {
        chrome.extension.sendRequest({
            data: {
                feature: item.getAttribute('name')
            },
            type: 'popup'
        });
    }

};