# [Template](http://template-extension.org)  
# (c) 2014 Alasdair Mercer  
# Freely distributable under the MIT license:  
# <http://template-extension.org/license>

# Private variables
# -----------------

# Easily accessible reference to analytics, logging, utilities, and the extension controller.
{analytics, ext, log, utils} = chrome.extension.getBackgroundPage()

# Private functions
# -----------------

# Calculate the *widest* of the specified `elements`.
getMaxWidth = (elements) ->
  log.trace()

  width = 0
  width = element.scrollWidth for element in elements when element.scrollWidth > width
  width

# Send a message to the background page using the information provided.
sendMessage = ->
  log.trace()

  message =
    data: key: @getAttribute 'data-key'
    type: @getAttribute 'data-type'

  log.debug 'Sending the following message to the extension controller', message
  chrome.extension.sendMessage message

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
    document.getElementById('templates').innerHTML = ext.templatesHtml

    # Find the required elements.
    items     = document.querySelectorAll '#templates li > a'
    shortcuts = document.querySelectorAll '#templates li > a .shortcut'

    # Determine the maximum width for items.
    maxItemWidth     = getMaxWidth items
    maxShortcutWidth = getMaxWidth shortcuts
    maxWidth         = maxItemWidth + maxShortcutWidth

    # Bind click event and apply maximum width to all items.
    for item in items
      item.addEventListener 'click', sendMessage

      item.style.width = "#{maxWidth}px"

    log.debug "Widest textual item in popup is #{maxWidth}px"

    # Ensure that the loading bar matches the preferred width.
    width = document.querySelector('#templates li').scrollWidth
    document.getElementById('loading').style.width = "#{width + 2}px"

# Initialize `popup` when the DOM is ready.
utils.ready this, -> popup.init()