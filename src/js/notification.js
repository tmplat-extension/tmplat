/**
 * <p>Responsible for the notification page.</p>
 * @author <a href="http://github.com/neocotic">Alasdair Mercer</a>
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