# [Template](http://neocotic.com/template)  
# (c) 2012 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Private variables
# -----------------

# Easily accessible reference to analytics and the extension controller.
{analytics, ext} = chrome.extension.getBackgroundPage()

# Popup page setup
# ----------------

popup = window.popup =

  # Public functions
  # ----------------

  # Initialize the popup page.
  init: ->
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

  # Send a request to the background page using the information provided.
  sendRequest: (item) ->
    chrome.extension.sendRequest
      data: key: item.getAttribute 'key'
      type: 'popup'