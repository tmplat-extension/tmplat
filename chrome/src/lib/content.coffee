# [Template](http://neocotic.com/template)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

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

# Extract the value the specified `property` from all elements of `array`.  
# If an element does not have a valid `property` or its value has already been recorded it should
# be ignored from the results.
extractAll = (array, property) ->
  results = []
  for element in array when element[property]?
    results.push element[property] if element[property] not in results
  results

# Extract the relevant content of `node` as is required by `info`.
getContent = (info, node) ->
  return '' unless node

  if info?.convertTo in ['html', 'markdown'] then node.innerHTML
  else node.textContent

# Attempt to derive the most relevant anchor element from those stored under the `id` provided.
getLink = (id, url) ->
  return unless elementBackups[id]?

  if elementBackups[id].link?.href is url then elementBackups[id].link
  else parentLink elementBackups[id].other

# Attempt to extract the contents of the meta element with the specified `name`.  
# If `csv` is enabled, separate the contents by commas and return each unique value in an array.
getMeta = (name, csv) ->
  content = document.querySelector("meta[name='#{name}']")?.content?.trim()

  if csv and content?
    results = []
    for value in content.split /\s*,\s*/ when value.length
      results.push value if value not in results
    results
  else
    content

# Determine whether or not `node` is editable.
isEditable = (node) ->
  node? and not node.disabled and not node.readOnly

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

# Functionality
# -------------

# Wrap the function functionality in a message for Template's extension ID and current version so
# that it can be used to detect previous injections.
chrome.runtime.sendMessage type: 'info', (data) ->
  hotkeys = data.hotkeys
  isMac   = navigator.userAgent.toLowerCase().indexOf('mac') isnt -1

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

        chrome.runtime.sendMessage
          data: key: key
          type: 'shortcut'
        e.preventDefault()

  # Add a listener to provide the background page with information that is extracted from the DOM
  # or perform auto-paste functionality.
  chrome.runtime.onMessage.addListener (message, sender, sendResponse) ->
    # Safely handle callback functionality.
    callback = (args...) ->
      if typeof sendResponse is 'function'
        sendResponse args...
        true

    # Ensure local hotkeys are up-to-date.
    if message.hotkeys?
      hotkeys = message.hotkeys
      return do callback

    # Retrieve the contents of all selected elements.
    if message.selectors?
      for own key, info of message.selectors
        if info.all
          nodes  = document.querySelectorAll info.selector
          result = []
          if nodes
            result.push getContent info, node for node in nodes when node
        else
          node   = document.querySelector info.selector
          result = getContent info, node if node
        info.result = result
      return callback selectors: message.selectors

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

    # Build response with values derived from the DOM.
    callback
      author:         getMeta 'author'
      characterSet:   document.characterSet
      description:    getMeta 'description'
      images:         extractAll document.images, 'src'
      keywords:       getMeta 'keywords', yes
      lastModified:   document.lastModified
      linkHTML:       link?.innerHTML
      linkText:       link?.textContent
      links:          extractAll document.links, 'href'
      pageHeight:     innerHeight
      pageWidth:      innerWidth
      referrer:       document.referrer
      scripts:        extractAll document.scripts, 'src'
      selectedImages: images
      selectedLinks:  links
      selection:      selection.toString()
      selectionHTML:  container?.innerHTML
      styleSheets:    extractAll document.styleSheets, 'href'