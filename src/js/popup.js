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
        document.body.innerHTML = bg.ext.popupHTML;
        // Fix dimensions of feature text
        popup.resizePopupText();
        // Fix dimensions if shortcuts are enabled
        if (utils.get('shortcuts')) {
            document.body.style.minWidth = '190px';
        }
    },

    
    /**
     * <p>Calculates the widest text <code>&lt;div/&gt;</code> in the popup
     * and assigns that width to all others.</p>
     * @since 0.1.0.0
     * @private
     */
    resizePopupText: function () {
        var itemList = document.getElementById('itemList'),
            textItems = document.getElementsByClassName('text'),
            scrollWidth = 0,
            width = 0;
        for (var i = 0; i < textItems.length; i++) {
            scrollWidth = textItems[i].scrollWidth;
            if (scrollWidth > width) {
                width = scrollWidth;
            }
        }
        for (var j = 0; j < textItems.length; j++) {
            textItems[j].style.width = width + 'px';
        }
    },

    /**
     * <p>Sends the request to the background page for the clicked feature
     * item.</p>
     * @event
     * @param {Element} item The calling feature item clicked.
     * @since 0.1.0.0
     */
    sendRequest: function (item) {
        chrome.extension.sendRequest({
            data: {
                name: item.getAttribute('name')
            },
            type: 'popup'
        });
    }

};