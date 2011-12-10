/* Copyright (C) 2011 Alasdair Mercer, http://neocotic.com/
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy  
 * of this software and associated documentation files (the "Software"), to deal  
 * in the Software without restriction, including without limitation the rights  
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell  
 * copies of the Software, and to permit persons to whom the Software is  
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all  
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR  
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE  
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER  
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,  
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE  
 * SOFTWARE.
 */

/**
 * <p>Responsible for the popup page.</p>
 * @author <a href="http://neocotic.com">Alasdair Mercer</a>
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