# [Template](http://neocotic.com/template)  
# (c) 2012 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

#### Private variables

# Mapping for internationalization handlers.  
# Each handler represents an attribute (based on the property name) and is
# called for each attribute found in the current `document`.
i18nHandlers   =

  # Replace the HTML content of `element` with the message looked up for
  # `value`.
  'i18n-content': (element, value, subMap) ->
    subs = i18nSubs element, value, subMap
    element.innerHTML = utils.i18n value, subs

  # Replace the value of the properties and/or attributes of `element` with the
  # messages looked up for their corresponding values.
  'i18n-values':  (element, value, subMap) ->
    subs  = i18nSubs element, value, subMap
    parts = value.replace(/\s/g, '').split ';'
    for part in parts
      prop = part.match /^([^:]+):(.+)$/
      if prop
        propName = prop[1]
        propExpr = prop[2]
        if propName.indexOf('.') is 0
          path = propName.slice(1).split '.'
          obj = element
          obj = obj[path.shift()] while obj and path.length > 1
          if obj
            obj[path] = utils.i18n value, subs
            i18nProcess element, subMap if path is 'innerHTML'
        else
          element.setAttribute propName, utils.i18n propExpr, subs
# List of internationalization attributes/handlers available.
i18nAttributes = []
i18nAttributes.push key for key of i18nHandlers
# Selector containing the available internationalization attributes/handlers
# which is used by `i18nProcess` to query all elements.
i18nSelector   = "[#{i18nAttributes.join '],['}]"

#### Private functions

# Find all elements to be internationalized and call their corresponding
# handler(s).
i18nProcess = (node, subMap) ->
  for element in node.querySelectorAll i18nSelector
    for name in i18nAttributes
      attribute = element.getAttribute name
      i18nHandlers[name] element, attribute, subMap if attribute?

# Find an array of substitution strings using the element's ID and the message
# key as the mapping.
i18nSubs = (element, value, subMap) ->
  if subMap
    for prop of subMap when subMap.hasOwnProperty(prop) and prop is element.id
      for subProp of subMap[prop] when subMap[prop].hasOwnProperty subProp
        if subProp is value
          subs = subMap[prop][subProp]
          break
      break
  return subs

#### Utilities setup

utils = window.utils =

  #### Data functions

  # Determine whether or not the specified key exists in `localStorage`.
  exists: (key) ->
    return localStorage.hasOwnProperty key

  # Retrieve the value associated with the specified key from `localStorage`.  
  # If the value is found, parse it as JSON before being returning it; otherwise
  # return `undefined`.
  get: (key) ->
    value = localStorage[key]
    return if value? then JSON.parse value else value

  # Initialize the value of the specified key in `localStorage`.  
  # If the value is currently `undefined`, assign the specified default value;
  # otherwise reassign itself.
  init: (key, defaultValue) ->
    value = utils.get key
    return utils.set key, value ? defaultValue

  # Remove the specified key from `localStorage`.
  remove: (key) ->
    exists = utils.exists key
    delete localStorage[key]
    return exists

  # Copy the value of the existing key to that of the new key then remove the
  # old key from `localStorage`.  
  # If the old key doesn't exist in `localStorage`, assign the specified default
  # value to it instead.
  rename: (oldKey, newKey, defaultValue) ->
    if utils.exists oldKey
      utils.init newKey, utils.get oldKey
      utils.remove oldKey
    else
      utils.init newKey, defaultValue

  # Set the value of the specified key in `localStorage`.  
  # If the specified value is `undefined`, assign that value directly to the
  # key; otherwise transform it to a JSON string beforehand.
  set: (key, value) ->
    oldValue = utils.get key
    localStorage[key] = if value? then JSON.stringify value else value
    return oldValue

  #### Internationalization functions

  # Convenient shorthand for `chrome.i18n.getMessage`.
  i18n: ->
    chrome.i18n.getMessage.apply chrome.i18n, arguments

  # Internationalize the specified attribute of all the selected elements.
  i18nAttribute: (selector, attribute, value, subs) ->
    elements = document.querySelectorAll selector
    # Ensure the substitution string(s) are in an array.
    subs = [subs] if typeof subs is 'string'
    for element in elements
      element.setAttribute attribute, utils.i18n value, subs

  # Internationalize the contents of all the selected elements.
  i18nContent: (selector, value, subs) ->
    elements = document.querySelectorAll selector
    # Ensure the substitution string(s) are in an array.
    subs = [subs] if typeof subs is 'string'
    element.innerHTML = utils.i18n value, subs for element in elements

  # Perform all internationalization setup required for the current page.
  i18nSetup: (subMap) ->
    i18nProcess document, subMap