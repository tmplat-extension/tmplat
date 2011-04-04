/**
 * <p>Responsible for the notification page.</p>
 * @author <a href="http://github.com/neocotic">Alasdair Mercer</a>
 * @since 0.0.2.1
 */
var notification = {

    /**
     * <p>Initializes the notification page.</p>
     * <p>This involves inserting and configuring the UI elements as well as the
     * insertion of localized Strings based on the result of the copy request.
     * </p>
     * @constructs
     * @requires jQuery
     * @see clipboard.showNotification
     */
    init: function () {
        var bg = chrome.extension.getBackgroundPage();
        var result = (bg.clipboard.status) ? 'copy_success' : 'copy_fail';
        var sub = chrome.i18n.getMessage(bg.clipboard.feature + '_notification');
        /*
         * Styles the tip and inserts relevant localized String depending on the
         * result of the copy request.
         */
        $('#tip').addClass(result).html(chrome.i18n.getMessage(result, sub));
        /*
         * Important: Resets the clipboard to avoid affecting copy requests.
         * If user disabled the notifications option this is still called in
         * clipboard.showNotification for safety.
         */
        bg.clipboard.reset();
        /*
         * Sets a timer to close the notification after if user enabled option;
         * otherwise stays open until closed manually by user.
         */
        if (utils.get('settingNotificationTimer') > 0) {
            window.setTimeout(function () {
                window.close();
            }, utils.get('settingNotificationTimer'));
        }
    }

};