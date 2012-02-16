# [Template](http://neocotic.com/template)  
# (c) 2012 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Private variables
# -----------------

# Easily accessible reference to analytics, logging, utilities, and the
# extension controller.
{analytics, ext, log, utils} = chrome.extension.getBackgroundPage()

# Popup page setup
# ----------------

popup = window.popup = new class Popup extends utils.Class

  # Public functions
  # ----------------

  # Initialize the popup page.
  init: ->
    log.trace()
    log.info 'Initializing the popup'
    analytics.track 'Frames', 'Displayed', 'Popup'
    # Insert the prepared HTML in to the popup's body.
    document.body.innerHTML = ext.popupHtml
    # Calculate the widest text used by the `div` elements in the popup and
    # assign it to all of the others.
    textItems = document.querySelectorAll '.text'
    width     = 0
    for textItem in textItems when textItem.scrollWidth > width
      width = textItem.scrollWidth
    textItem.style.width = "#{width}px" for textItem in textItems
    log.debug "Widest textual item in popup is #{width}px"
    width = document.querySelector('#itemList li').scrollWidth
    document.querySelector('#loadDiv .progress').style.width = "#{width + 2}px"

  # Send a request to the background page using the information provided.
  sendRequest: (item) ->
    log.trace()
    request =
      data: key: item.getAttribute 'data-key'
      type: item.getAttribute 'data-type'
    log.debug 'Sending the following request to the extension controller',
      request
    chrome.extension.sendRequest request