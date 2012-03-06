# [Template](http://neocotic.com/template)  
# (c) 2012 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

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
    selection = window.getSelection()
    unless selection.isCollapsed
      if contents = selection.getRangeAt(0).cloneContents()
        container = document.createElement 'div'
        container.appendChild contents
        # Convert relative addresses to absolute.
        href.href = href.href for href in container.querySelectorAll '[href]'
        src.src   = src.src for src in container.querySelectorAll '[src]'
        # Capture addresses for links and images.
        images = extractAll container.querySelectorAll('img[src]'), 'src'
        links  = extractAll container.querySelectorAll('a[href]'),  'href'
    # Build response with values derived from the DOM.
    sendResponse
      author:         getMeta 'author'
      characterSet:   document.characterSet
      description:    getMeta 'description'
      images:         extractAll document.images, 'src'
      keywords:       getMeta('keywords', yes)
      lastModified:   document.lastModified
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