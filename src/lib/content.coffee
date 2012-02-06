# [Template](http://neocotic.com/template)  
# (c) 2012 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Functionality
# -------------

# Wrap the function functionality in a request for Template's current version
# so that it can be used to detect previous injections.
chrome.extension.sendRequest type: 'info', (data) ->
  isMac   = navigator.userAgent.toLowerCase().indexOf('mac') isnt -1
  version = data.version.replace /\./g, ''
  # Only add the listeners if a previous injection isn't detected for running
  # version of Template.
  return if document.body.hasAttribute "template-v#{version}"
  document.body.setAttribute "template-v#{version}", yes
  # Add a listener for extension keyboard shortcuts in to the page context.
  window.addEventListener 'keyup', (e) ->
    if (not isMac and e.ctrlKey and e.altKey) or
       (isMac and e.shiftKey and e.altKey)
      chrome.extension.sendRequest
        data: key: String.fromCharCode(e.keyCode).toUpperCase()
        type: 'shortcut'
  # Add a listener to provide the background page with information on the
  # current selection when requested.
  chrome.extension.onRequest.addListener (request, sender, sendResponse) ->
    selection = window.getSelection()
    urls      = []
    if selection.rangeCount > 0
      contents = selection.getRangeAt(0).cloneContents()
      if contents
        urls.push anchor.href for anchor in contents.querySelectorAll 'a[href]'
    sendResponse
      pageHeight: window.innerHeight
      pageWidth:  window.innerWidth
      text:       selection.toString()
      urls:       urls