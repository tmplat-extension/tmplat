function getLocalStorage(key) {
    var value = localStorage[key];
    if (typeof(value) !== 'undefined') {
        return JSON.parse(value);
    }
    return value;
}

function initLocalStorage(key, defaultValue) {
    var value = getLocalStorage(key);
    if (typeof(value) === 'undefined') {
        value = defaultValue;
    }
    localStorage[key] = JSON.stringify(value);
}

function setLocalStorage(key, value) {
    localStorage[key] = JSON.stringify(value);
}