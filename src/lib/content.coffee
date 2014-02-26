# [Template](http://template-extension.org)  
# (c) 2014 Alasdair Mercer  
# Freely distributable under the MIT license:  
# <http://template-extension.org/license>

# Private variables
# -----------------

# Backups of relevant elements, each related to individual requests.
elementBackups = {}
# Details of the last relevant elements.
elements       =
  field: null
  link:  null
  other: null
# List of shortcuts used by enabled templates.  
# This list should be updated after any templates have been.
hotkeys        = []

# Helpers
# -------

# Create a clean copy of the specified web `storage`.  
# The returned copy should only be a key/value map of the items stored in `storage`.
copyStorage = (storage) ->
  copy = {}

  for i in [0...storage.length]
    key = storage.key i
    copy[key] = storage.getItem key

  copy

# Extract the value the specified `property` from all elements of `array`.  
# If an element does not have a valid `property` or its value has already been recorded it should
# be ignored from the results.
extractAll = (array, property) ->
  results = []

  for element in array when element[property] and element[property] not in results
    results.push element[property]

  results

# Extract the relevant content of `node` as defined by `output`.
getContent = (node, output) ->
  return '' unless node

  if output in ['html', 'markdown'] then node.innerHTML else node.textContent

# Attempt to derive the most relevant anchor element from those stored under the `id` provided.
getLink = (id, url) ->
  return unless elementBackups[id]?

  if elementBackups[id].link?.href is url then elementBackups[id].link
  else parentLink elementBackups[id].other

# Create a map of key/value pairs based on all of the pages meta elements.
getMetaMap = ->
  map   = {}
  nodes = document.querySelectorAll 'meta[content]'

  for node in nodes
    key   = node.name or node['http-equiv'] or node.property
    value = node.content

    map[key] = value if key and value

  map

# Determine whether or not `node` is editable.
isEditable = (node) ->
  node? and not node.disabled and not node.readOnly

# Determine whether or not `os` matches the user's operating system.
isThisPlatform = (os) ->
  /// #{os} ///i.test navigator.platform

# Traverse the parents of `node` in search of the first anchor element, if any.
parentLink = (node) ->
  return unless node?

  if node.nodeName is 'A' then node else parentLink node.parentNode

# Paste `value` in to the editable `node`.  
# This should simulate pasting as much as possible, so the current value of `node` should be
# manipulated in such a way instead of simply replacing it.
paste = (node, value) ->
  return unless node? or value

  str  = node.value.substr 0, node.selectionStart
  str += value
  str += node.value.substr node.selectionEnd, node.value.length

  node.value = str

# Evaluate the CSS selectors provided and extract their corresponding contents.  
# If an error occurs during the evaluation, it can be found at `info.error`.
runSelector = (info) ->
  {all, convertTo, expression} = info

  try
    info.result = if all
      nodes = document.querySelectorAll expression
      (getContent node, convertTo for node in nodes when node)
    else
      node = document.querySelector expression
      if node then getContent node, convertTo
  catch e
    info.error = e

# Evaluate the XPath expressions provided and extract their corresponding contents.  
# If an error occurs during the evaluation, it can be found at `info.error`.
runXPath = (info) ->
  {all, convertTo, expression} = info

  try
    info.result = xpath expression, convertTo, not all
  catch e
    info.error = e

# Evaluate a given XPath `expression` and derive the best value(s) from the result.
xpath = (expression, format, singular) ->
  result = document.evaluate expression, document, null, XPathResult.ANY_TYPE, null
  # Not sure if this would happen but let's guard against insanity.
  return unless result

  switch result.resultType
    # Simple *primitive* results are easy to extract from `result`.
    when XPathResult.BOOLEAN_TYPE then result.booleanValue
    when XPathResult.NUMBER_TYPE  then result.numberValue
    when XPathResult.STRING_TYPE  then result.stringValue

    # Single nodes probably won't be returned for `ANY_TYPE` but it's easy enough to handle.
    when XPathResult.ANY_UNORDERED_NODE_TYPE, XPathResult.FIRST_ORDERED_NODE_TYPE
      node = result.singleNodeValue
      if node then getContent node, format

    # Extract the contents of each snapshot. Again, it's unlikely these will be used by `ANY_TYPE`
    # but it's better to be safe than sorry.
    when XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE
      contents = []

      for i in [0...result.snapshotLength]
        node = result.snapshotItem i
        if node
          contents.push getContent node, format
          break if singular

      if singular then contents[0] else contents

    # Extract the contents of all nodes returned in `result`.
    when XPathResult.ORDERED_NODE_ITERATOR_TYPE, XPathResult.UNORDERED_NODE_ITERATOR_TYPE
      contents = []

      while node = result.iterateNext()
        if node
          contents.push getContent node, format
          break if singular

      if singular then contents[0] else contents

# Functionality
# -------------

# Wrap the function functionality in a message for Template's extension ID and current version so
# that it can be used to detect previous injections.
chrome.extension.sendMessage type: 'info', (data) ->
  hotkeys = data.hotkeys
  isMac   = isThisPlatform 'mac'

  # Only add the listeners if a previous injection isn't detected for version
  # of Template that is currently running.
  return if document.body.getAttribute(data.id) is data.version
  document.body.setAttribute data.id, data.version

  # Record relevant links and input fields when using the right-click menu.
  addEventListener 'contextmenu', (e) ->
    switch e.target.nodeName
      when 'A' then elements.link = e.target
      when 'INPUT', 'TEXTAREA' then elements.field = e.target
      else elements.other = e.target

  # Add a listener for extension keyboard shortcuts in to the page context.
  addEventListener 'keydown', (e) ->
    if (not isMac and e.ctrlKey and e.altKey) or (isMac and e.shiftKey and e.altKey)
      key = String.fromCharCode(e.keyCode).toUpperCase()

      if key in hotkeys
        elements.field = if e.target.nodeName in ['INPUT', 'TEXTAREA'] then e.target else null

        chrome.extension.sendMessage
          data: key: key
          type: 'shortcut'
        e.preventDefault()

  # Add a listener to provide the background page with information that is extracted from the DOM
  # or perform auto-paste functionality.
  chrome.extension.onMessage.addListener (message, sender, sendResponse) ->
    # Safely handle callback functionality.
    callback = (args...) ->
      if typeof sendResponse is 'function'
        sendResponse args...
        true

    # Ensure local hotkeys are up-to-date.
    if message.hotkeys?
      hotkeys = message.hotkeys
      return do callback

    # Retrieve the contents of all evaluated elements.
    if message.expressions?
      for own key, info of message.expressions
        switch info.type
          when 'select' then runSelector info
          when 'xpath'  then runXPath    info

      return callback expressions: message.expressions

    # Message identifier is required past this point.
    return do callback unless message.id?

    # Paste the message contents into the targeted field.
    if message.type is 'paste'
      if message.contents? and isEditable elementBackups[message.id]?.field
        paste elementBackups[message.id].field, message.contents
      # Backups no longer required so might as well clean up a bit.
      delete elementBackups[message.id]
      return do callback

    # Create a backup of the relevant elements for this request.
    elementBackups[message.id] =
      field: if message.editable or message.shortcut then elements.field
      link:  if message.link then elements.link
      other: if message.link then elements.other

    # Extract any user-selected contents.
    selection = do getSelection
    unless selection.isCollapsed
      contents = selection.getRangeAt(0).cloneContents()
      if contents
        container = document.createElement 'div'
        container.appendChild contents

        # Convert relative addresses to absolute.
        href.href = href.href for href in container.querySelectorAll '[href]'
        src.src   = src.src   for src  in container.querySelectorAll '[src]'

        # Capture addresses for links and images.
        images = extractAll container.querySelectorAll('img[src]'), 'src'
        links  = extractAll container.querySelectorAll('a[href]'),  'href'

    link = getLink message.id, message.url
    meta = do getMetaMap

    # Build response with values derived from the DOM.
    callback
      characterSet:   document.characterSet
      html:           document.documentElement.outerHTML
      images:         extractAll document.images, 'src'
      lastModified:   document.lastModified
      linkHTML:       link?.innerHTML
      linkText:       link?.textContent
      links:          extractAll document.links, 'href'
      localStorage:   copyStorage localStorage
      metaMap:        meta
      pageHeight:     innerHeight
      pageWidth:      innerWidth
      referrer:       document.referrer
      scripts:        extractAll document.scripts, 'src'
      selectedImages: images
      selectedLinks:  links
      selection:      selection.toString()
      selectionHTML:  container?.innerHTML
      sessionStorage: copyStorage sessionStorage
      styleSheets:    extractAll document.styleSheets, 'href'