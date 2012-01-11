# [Template](http://neocotic.com/template)  
# (c) 2012 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

#### Private variables

# Easily accessible reference to the extension controller.
{ext} = chrome.extension.getBackgroundPage()

#### Private functions

 # Calculate the widest text used by the `div` elements in the popup and assign
 # it to all the others.
resizePopupText = ->
  textItems   = document.getElementsByClassName 'text'
  width       = 0

  for textItem in textItems
    width = textItem.scrollWidth if textItem.scrollWidth > width
  for textItem in textItems
    textItem.style.width = "#{width}px"

#### Popup page setup

popup = window.popup =

  #### Public functions

  # Initialize the popup page.
  init: ->
    # Insert the prepared HTML in to the popup's body.
    document.body.innerHTML = ext.popupHTML
    # Fix dimensions of feature text
    resizePopupText()

  # Send a request to the background page using the information provided.
  sendRequest: (item) ->
    chrome.extension.sendRequest
      data: name: item.getAttribute 'name'
      type: 'popup'