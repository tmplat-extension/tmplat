# [Template](http://neocotic.com/template)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Private functions
# -----------------

# Attempt to dig down in to the `root` object and stop on the parent of the target property.  
# Return the progress of the mining as an array in this structure;
# `[root-object, base-object, base-path, target-parent, target-property]`.
dig = (root, path, force, parseFirst = yes) ->
  result = [root]
  if path and '.' in path
    path   = path.split '.'
    object = base = root[basePath = path.shift()]
    object = base = tryParse object if parseFirst

    while object and path.length > 1
      object = object[path.shift()]
      object = {} if not object? and force

    result.push base, basePath, object, path.shift()
  else
    result.push root, path, root, path
  result

# Attempt to parse `value` as a JSON object if it's not `null`; otherwise just return `value`.
tryParse = (value) ->
  if value? then JSON.parse value else value

# Attempt to stringify `value` in to a JSON string if it's not `null`; otherwise just return
# `value`.
tryStringify = (value) ->
  if value? then JSON.stringify value else value

# Store setup
# -----------

store = window.store = new class Store extends utils.Class

  # Public functions
  # ----------------

  # Create a backup string containing all the information contained within `localStorage`.  
  # The data should be formatted as a JSON string and then encoded to ensure that it can easily be
  # copied from/pasted to the console.  
  # The string created may contain sensitive user data in plain text if they have provided any to
  # the extension.
  backup: ->
    data = {}
    data[key] = value for own key, value of localStorage
    encodeURIComponent JSON.stringify data

  # Clear all keys from `localStorage`.
  clear: ->
    delete localStorage[key] for own key of localStorage

  # Determine whether or not the specified `keys` exist in `localStorage`.
  exists: (keys...) ->
    return no for key in keys when not _.has localStorage, key
    yes

  # Retrieve the value associated with the specified `key` from `localStorage`.  
  # If the value is found, parse it as a JSON object before being returning it.
  get: (key) ->
    parts = dig localStorage, key
    if parts[3]
      value = parts[3][parts[4]]
      # Ensure that the value is parsed if retrieved directly from `localStorage`.
      value = tryParse value if parts[3] is parts[0]
    value

  # Initialize the value of the specified key(s) in `localStorage`.  
  # `keys` can either be a string for a single key (in which case `defaultValue` should also be
  # specified) or a map of key/default value pairs.  
  # If the value is currently `undefined`, assign the specified default value; otherwise reassign
  # itself.
  init: (keys, defaultValue) ->
    switch typeof keys
      when 'object'
        @init key, defaultValue for own key, defaultValue of keys
      when 'string' then @set keys, @get(keys) ? defaultValue

  # For each of the specified `keys`, retrieve their value in `localStorage` and pass it, along
  # with the key, to the `callback` function provided.  
  # This functionality is very useful when just manipulating existing values.
  modify: (keys..., callback) ->
    for key in keys
      value = @get key
      callback? value, key
      @set key, value

  # Remove the specified `keys` from `localStorage`.  
  # If only one key is specified then the current value of that key is returned after it has been
  # removed.
  remove: (keys...) ->
    if keys.length is 1
      value = @get keys[0]
      delete localStorage[keys[0]]
      return value
    delete localStorage[key] for key in keys

  # Copy the value of the existing key to that of the new key then remove the old key from
  # `localStorage`.  
  # If the old key doesn't exist in `localStorage`, assign the specified default value to it
  # instead.
  rename: (oldKey, newKey, defaultValue) ->
    if @exists oldKey
      @set newKey, @get oldKey
      @remove oldKey
    else
      @set newKey, defaultValue

  # Restore `localStorage` with data from the backup string provided.  
  # The string should be decoded and then parsed as a JSON string in order to process the data.
  restore: (str) ->
    data = JSON.parse decodeURIComponent str
    localStorage[key] = value for own key, value of data

  # Search `localStorage` for all keys that match the specified regular expression.
  search: (regex) ->
    key for own key of localStorage when regex.test key

  # Set the value of the specified key(s) in `localStorage`.  
  # `keys` can either be a string for a single key (in which case `value` should also be specified)
  # or a map of key/value pairs.  
  # If the specified value is `undefined`, assign that value directly to the key; otherwise
  # transform it to a JSON string beforehand.
  set: (keys, value) ->
    switch typeof keys
      when 'object'
        @set key, value for own key, value of keys
      when 'string'
        oldValue = @get keys
        localStorage[keys] = tryStringify value
        oldValue

# Public classes
# --------------

# `Updater` simplifies the process of updating settings between updates. Inlcuding, but not limited
# to, data transformations and migration.
class store.Updater extends utils.Class

  # Create a new instance of `Updater` for `namespace`.  
  # Also indicate whether or not `namespace` existed initially.
  constructor: (@namespace) ->
    @isNew = not @exists()

  # Determine whether or not this namespace exists.
  exists: ->
    store.get("updates.#{@namespace}")?

  # Remove this namespace.
  remove: ->
    store.modify 'updates', (updates) =>
      delete updates[@namespace]

  # Rename this namespace to `namespace`.
  rename: (namespace) ->
    store.modify 'updates', (updates) =>
      updates[namespace] = updates[@namespace] if updates[@namespace]?
      delete updates[@namespace]
      @namespace = namespace

  # Update this namespace to `version` using the `processor` provided when `version` is newer.
  update: (version, processor) ->
    store.modify 'updates', (updates) =>
      updates[@namespace] ?= ''
      if updates[@namespace] < version
        processor?()
        updates[@namespace] = version

# Configuration
# -------------

# Initialize updates.
store.init 'updates', {}