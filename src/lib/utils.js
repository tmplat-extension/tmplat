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
 * <p>Provides utility functions used throughout the extension.</p>
 * @author <a href="http://neocotic.com">Alasdair Mercer</a>
 * @since 0.0.2.1
 * @namespace
 */
var utils = {

    /**
     * <p>Returns whether or not the specified key exists in localStorage.</p>
     * @param {String} key The key whose existence is to be checked.
     * @returns {Boolean} <code>true</code> if the key exists in localStorage;
     * otherwise <code>false</code>.
     * @since 0.1.0.0
     */
    exists: function (key) {
        return localStorage.hasOwnProperty(key);
    },

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
    get: function (key) {
        var value = localStorage[key];
        if (typeof value !== 'undefined') {
            return JSON.parse(value);
        }
        return value;
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
        if (typeof value === 'undefined') {
            value = defaultValue;
        }
        return utils.set(key, value);
    },

    /**
     * <p>Removes the specified key from localStorage.</p>
     * @param {String} key The key to be removed.
     * @returns {Boolean} <code>true</code> if a key was removed from
     * localStorage; otherwise <code>false</code>.
     * @since 0.1.0.0
     */
    remove: function (key) {
        var exists = utils.exists(key);
        delete localStorage[key];
        return exists;
    },

    /**
     * <p>Copies the value of the existing key to that of the new key then
     * removes the old key from localStorage.</p>
     * <p>If the old key doesn't exist in localStorage the specified default
     * value will be assigned to it instead.</p>
     * @param {String} oldKey The key whose value is to be copied and then
     * removed.
     * @param {String} newKey The key whose value is to be set.
     * @param defaultValue The value to be assigned to the new key if the old
     * key didn't exist.
     * @since 0.1.0.0
     */
    rename: function (oldKey, newKey, defaultValue) {
        if (utils.exists(oldKey)) {
            utils.init(newKey, utils.get(oldKey));
            utils.remove(oldKey);
        } else {
            utils.init(newKey, defaultValue);
        }
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
    set: function (key, value) {
        var oldValue = utils.get(key);
        if (typeof value !== 'undefined') {
            localStorage[key] = JSON.stringify(value);
        } else {
            localStorage[key] = value;
        }
        return oldValue;
    }

};