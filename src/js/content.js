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

/*
 * Injects listener for extension keyboard shortcuts in to page context as well
 * as creating a listener for providing the background page with information
 * on the current selection.
 */
(function () {
    chrome.extension.sendRequest({type: 'version'}, function (versionData) {
        var isMac = navigator.userAgent.toLowerCase().indexOf('mac') !== -1,
            version = versionData.version.replace(/\./g, '');
        // Only adds listeners if previous injection isn't detected
        if (document.body.hasAttribute('template-v' + version)) {
            return;
        }
        document.body.setAttribute('template-v' + version, true);
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
        chrome.extension.onRequest.addListener(function (request, sender,
                sendResponse) {
            var anchors,
                data = {
                    text: '',
                    urls: []
                },
                contents,
                selection = window.getSelection();
            data.text = selection.toString();
            if (selection.rangeCount > 0) {
                contents = selection.getRangeAt(0).cloneContents();
                if (contents) {
                    anchors = contents.querySelectorAll('a[href]');
                    for (var i = 0; i < anchors.length; i++) {
                        data.urls.push(anchors[i].href);
                    }
                }
            }
            sendResponse(data);
        });
    });
})();