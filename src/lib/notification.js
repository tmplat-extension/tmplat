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
 * <p>Responsible for the notification page.</p>
 * @author <a href="http://neocotic.com">Alasdair Mercer</a>
 * @since 0.0.2.1
 * @namespace
 */
var notification = {

    /**
     * <p>Initializes the notification page.</p>
     * <p>This involves inserting and configuring the UI elements as well as
     * the insertion of localized Strings based on the result of the copy
     * request.</p>
     * @see ext.showNotification
     */
    init: function () {
        var bg = chrome.extension.getBackgroundPage(),
            div = document.getElementById('tip'),
            result = (bg.ext.status) ? 'copy_success' : 'copy_fail';
        /*
         * Styles the tip and inserts relevant localized String depending on
         * the result of the copy request or the existence of an override
         * message.
         */
        div.className = result;
        if (bg.ext.message) {
            div.innerHTML = bg.ext.message;
        } else {
            div.innerHTML = chrome.i18n.getMessage(result);
        }
        /*
         * Important: Resets ext to avoid affecting copy requests. If user
         * disabled the notifications option this is still called in
         * ext.showNotification for safety.
         */
        bg.ext.reset();
        /*
         * Sets a timer to close the notification after if user enabled option;
         * otherwise stays open until closed manually by user.
         */
        if (utils.get('notificationDuration') > 0) {
            window.setTimeout(function () {
                window.close();
            }, utils.get('notificationDuration'));
        }
    }

};