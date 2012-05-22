# [Template](http://neocotic.com/template)  
# (c) 2012 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Private variables
# -----------------

# Backups of relevant elements, each related to individual requests.
elementBackups = {}

# Details of the last relevant elements.
elements =
  field: null
  link:  null
  other: null

# List of shortcuts used by enabled templates.  
# This list should be updated after any templates have been.
hotkeys = []

# Helpers
# -------

# Extract the value the specified `property` from all elements of `array`.  
# If an element does not have a valid `property` or its value has already been
# recorded it should be ignored from the results.
extractAll = (array, property) ->
  results = []
  for element in array when element[property]?
    results.push element[property] if element[property] not in results
  results

# Attempt to derive the most relevant anchor element from those stored under
# the `id` provided.
getLink = (id, url) ->
  return unless elementBackups[id]?
  if elementBackups[id].link?.href is url
    elementBackups[id].link
  else
    parentLink elementBackups[id].other

# Attempt to extract the contents of the meta element with the specified
# `name`.  
# If `csv` is enabled, separate the contents by commas and return each unique
# value in an array.
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
# This should simulate pasting as much as possible, so the current value of
# `node` should be manipulated in such a way instead of simply replacing it.
paste = (node, value) ->
  return unless node? or value
  str  = node.value.substr 0, node.selectionStart
  str += value
  str += node.value.substr node.selectionEnd, node.value.length
  node.value = str

# Functionality
# -------------

# Wrap the function functionality in a request for Template's extension ID and
# current version so that it can be used to detect previous injections.
chrome.extension.sendRequest type: 'info', (data) ->
  isMac = navigator.userAgent.toLowerCase().indexOf('mac') isnt -1
  # Only add the listeners if a previous injection isn't detected for version
  # of Template that is currently running.
  return if document.body.getAttribute(data.id) is data.version
  document.body.setAttribute data.id, data.version
  # Record relevant links and input fields when using the right-click menu.
  window.addEventListener 'contextmenu', (e) ->
    switch e.target.nodeName
      when 'A' then elements.link = e.target
      when 'INPUT', 'TEXTAREA' then elements.field = e.target
      else elements.other = e.target
  # Add a listener for extension keyboard shortcuts in to the page context.
  window.addEventListener 'keydown', (e) ->
    if (not isMac and e.ctrlKey and e.altKey) or
       (isMac and e.shiftKey and e.altKey)
      key = String.fromCharCode(e.keyCode).toUpperCase()
      if key in hotkeys
        if e.target.nodeName in ['INPUT', 'TEXTAREA']
          elements.field = e.target
        else
          elements.field = null
        chrome.extension.sendRequest
          data: key: key
          type: 'shortcut'
        e.preventDefault()
  # Add a listener to provide the background page with information that is
  # extracted from the DOM or perform auto-paste functionality.
  chrome.extension.onRequest.addListener (request, sender, sendResponse) ->
    # Ensure local hotkeys are up-to-date.
    if request.hotkeys?
      hotkeys = request.hotkeys
      return sendResponse()
    return sendResponse() unless request.id?
    if request.type is 'paste'
      if request.contents? and
         isEditable elementBackups[request.id]?.field
        paste elementBackups[request.id].field, request.contents
      # Backups no longer required so might as well clean up a bit.
      delete elementBackups[request.id]
      return sendResponse()
    # Create a backup of the relevant elements for this request.
    elementBackups[request.id] =
      field: if request.editable or request.shortcut then elements.field
      link:  if request.link then elements.link
      other: if request.link then elements.other
    selection = window.getSelection()
    unless selection.isCollapsed
      if contents = selection.getRangeAt(0).cloneContents()
        container = document.createElement 'div'
        container.appendChild contents
        # Convert relative addresses to absolute.
        href.href = href.href for href in container.querySelectorAll '[href]'
        src.src   = src.src   for src  in container.querySelectorAll '[src]'
        # Capture addresses for links and images.
        images = extractAll container.querySelectorAll('img[src]'), 'src'
        links  = extractAll container.querySelectorAll('a[href]'),  'href'
    link = getLink request.id, request.url
    # Build response with values derived from the DOM.
    sendResponse
      author:         getMeta 'author'
      characterSet:   document.characterSet
      description:    getMeta 'description'
      images:         extractAll document.images, 'src'
      keywords:       getMeta('keywords', yes)
      lastModified:   document.lastModified
      linkHTML:       link?.innerHTML
      linkText:       link?.textContent
      links:          extractAll document.links, 'href'
      pageHeight:     window.innerHeight
      pageWidth:      window.innerWidth
      referrer:       document.referrer
      scripts:        extractAll document.scripts, 'src'
      selectedImages: images
      selectedLinks:  links
      selection:      selection.toString()
      selectionHTML:  container?.innerHTML
      styleSheets:    extractAll document.styleSheets, 'href'