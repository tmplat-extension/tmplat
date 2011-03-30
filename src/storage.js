/**
 * <p>Retrieves the value associated with the specified key from localStorage.</p>
 * <p>If the value is found it is parsed as JSON before being returned; otherwise undefined is returned.</p>
 * @param {String} key The key of the value to be returned.
 * @returns The parsed value associated with the specified key or undefined if none exists.
 * @see JSON#parse
 * @since 0.0.2.0
 */
function getLocalStorage(key) {
    var value = localStorage[key];
    if (typeof(value) !== 'undefined') {
        return JSON.parse(value);
    }
    return value;
}

/**
 * <p>Sets the value of the specified key in localStorage.</p>
 * <p>If the specified value is undefined it is assigned directly to the key; otherwise it is transformed to a JSON String.</p>
 * @param {String} key The key whose value is to be set.
 * @param value The value to be assigned to the specified key.
 * @returns The previous value associated with the specified key or undefined if there was none.
 * @see JSON#stringify
 * @since 0.0.2.0
 */
function setLocalStorage(key, value) {
    var oldValue = getLocalStorage(key);
    if (typeof(value) !== 'undefined') {
        localStorage[key] = JSON.stringify(value);
    } else {
        localStorage[key] = value;
    }
    return oldValue;
}

/**
 * <p>Initializes the value of the specified key in localStorage.</p>
 * <p>If the value is currently undefined the specified default value will be assigned to it; otherwise it is reassigned to itself.</p>
 * @param {String} key The key whose value is to be initialized.
 * @param defaultValue The value to be assigned to the specified key if it is currently undefined.
 * @returns The previous value associated with the specified key. This will be undefined if not previously initialized.
 * @see setLocalStorage
 * @since 0.0.2.0
 */
function initLocalStorage(key, defaultValue) {
    var value = getLocalStorage(key);
    if (typeof(value) === 'undefined') {
        value = defaultValue;
    }
    return setLocalStorage(key, value);
}