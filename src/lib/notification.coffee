# [Template](http://neocotic.com/template)  
# (c) 2012 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Private variables
# -----------------

# Easily accessible reference to the extension controller.
{ext} = chrome.extension.getBackgroundPage()

# Notification page setup
# -----------------------

notification = window.notification =

  # Public functions
  # ----------------

  # Initialize the notification page.
  init: ->
    result = if ext.status then 'copy_success' else 'copy_fail'
    # Style the tip and insert a relevant internationalized string depending on
    # the outcome of the copy request or the existence of an override message.
    div = document.getElementById 'tip'
    div.className = result;
    div.innerHTML = ext.message or i18n.get result
    # Reset `ext` to avoid affecting copy other copy requests. If the user has
    # disabled the notifications option this should still be called for safety.
    ext.reset()
    # Set a timer to close the notification after a specified period of time,
    # if the user enabled the corresponding option; otherwise it should stay
    # open until it is closed manually by the user.
    duration = store.get 'notificationDuration'
    if duration > 0
      window.setTimeout ->
        window.close()
      , duration