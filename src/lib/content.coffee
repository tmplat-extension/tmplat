# [Template](http://neocotic.com/template)  
# (c) 2012 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Private variables
# -----------------

# Details of the last relevant right-clicked elements.
rightClicked =
  field: null
  link:  null
  other: null

# Backups of right-click records, each related to individual processes.
rightClickedBackups = {}

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
  return unless rightClickedBackups[id]?
  if rightClickedBackups[id].link?.href is url
    rightClickedBackups[id].link
  else
    parentLink rightClickedBackups[id].other

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
  # Record right-clicked links and input fields.
  window.addEventListener 'contextmenu', (e) ->
    switch e.target.nodeName
      when 'A' then rightClicked.link = e.target
      when 'INPUT', 'TEXTAREA' then rightClicked.field = e.target
      else rightClicked.other = e.target
  # Add a listener for extension keyboard shortcuts in to the page context.
  window.addEventListener 'keyup', (e) ->
    if (not isMac and e.ctrlKey and e.altKey) or
       (isMac and e.shiftKey and e.altKey)
      chrome.extension.sendRequest
        data: key: String.fromCharCode(e.keyCode).toUpperCase()
        type: 'shortcut'
  # Add a listener to provide the background page with information that is
  # extracted from the DOM when required.
  chrome.extension.onRequest.addListener (request, sender, sendResponse) ->
    return sendResponse() unless request.id?
    if request.type is 'paste'
      if request.contents? and
         isEditable rightClickedBackups[request.id]?.field
        paste rightClickedBackups[request.id].field, request.contents
      return sendResponse()
    # Create a backup of the relevant right-clicked elements.
    rightClickedBackups[request.id] =
      field: if request.editable then rightClicked.field
      link:  if request.link then rightClicked.link
      other: if request.link then rightClicked.other
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
      link:           link?.textContent
      linkHTML:       link?.innerHTML
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