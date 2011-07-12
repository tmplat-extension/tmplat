/**
 * <p>Provides utility functions used throughout the extension.</p>
 * @author <a href="http://github.com/neocotic">Alasdair Mercer</a>
 * @since 0.0.2.1
 * @namespace
 */
var utils = {

    /**
     * <p>Retrieves the value associated with the specified key from
     * localStorage.</p>
     * <p>If the value is found it is parsed as JSON before being returned;
     * otherwise undefined is returned.</p>
     * @param {String} key The key of the value to be returned.
     * @returns The parsed value associated with the specified key or undefined
     * if none exists.
     * @see JSON.parse
     */
    'get': function (key) {
        var value = localStorage[key];
        if (typeof(value) !== 'undefined') {
            return JSON.parse(value);
        }
        return value;
    },

    /**
     * <p>Replaces the inner HTML of the selected element(s) with the localized
     * String looked up from Chrome.</p>
     * @param {String} selector A String containing a jQuery selector expression
     * to select the element(s) to be modified.
     * @param {String} name The name of the localized message to be retrieved.
     * @param {String|String[]} [sub] The String(s) to substituted in the
     * returned message (where applicable).
     * @returns {jQuery} The modified element(s) wrapped in jQuery.
     * @requires jQuery
     */
    i18nReplace: function (selector, name, sub) {
        if (typeof(sub) !== 'undefined') {
            return $(selector).html(chrome.i18n.getMessage(name, sub));
        }
        return $(selector).html(chrome.i18n.getMessage(name));
    },

    /**
     * <p>Initializes the value of the specified key in localStorage.</p>
     * <p>If the value is currently undefined the specified default value will
     * be assigned to it; otherwise it is reassigned to itself.</p>
     * @param {String} key The key whose value is to be initialized.
     * @param defaultValue The value to be assigned to the specified key if it
     * is currently undefined.
     * @returns The previous value associated with the specified key. This will
     * be undefined if not previously initialized.
     * @see utils.set
     */
    init: function (key, defaultValue) {
        var value = utils.get(key);
        if (typeof(value) === 'undefined') {
            value = defaultValue;
        }
        return utils.set(key, value);
    },

    /**
     * <p>Sets the value of the specified key in localStorage.</p>
     * <p>If the specified value is undefined it is assigned directly to the
     * key; otherwise it is transformed to a JSON String.</p>
     * @param {String} key The key whose value is to be set.
     * @param value The value to be assigned to the specified key.
     * @returns The previous value associated with the specified key or
     * undefined if there was none.
     * @see JSON.stringify
     */
    'set': function (key, value) {
        var oldValue = utils.get(key);
        if (typeof(value) !== 'undefined') {
            localStorage[key] = JSON.stringify(value);
        } else {
            localStorage[key] = value;
        }
        return oldValue;
    }

};