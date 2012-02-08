# [Template](http://neocotic.com/template)  
# (c) 2012 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Private constants
# -----------------

# Code for Templates analytics account.
ANALYTICS_ACCOUNT = 'UA-28812528-1'
# Source URL of the analytics script.
ANALYTICS_SOURCE  = 'https://ssl.google-analytics.com/ga.js'

# Analytics setup
# ---------------

analytics = window.analytics =

  # Public functions
  # ----------------

  # Add analytics to the current page.
  add: ->
    # Setup tracking details for analytics.
    _gaq = window._gaq ?= []
    _gaq.push ['_setAccount', ANALYTICS_ACCOUNT]
    _gaq.push ['_trackPageview']
    # Inject script to capture analytics.
    ga = document.createElement 'script'
    ga.async = 'async'
    ga.src   = ANALYTICS_SOURCE
    script = document.getElementsByTagName('script')[0]
    script.parentNode.insertBefore ga, script

  # Determine whether or not analytics are enabled.
  enabled: ->
    not store? or store.get 'analytics'

  # Remove analytics from the current page.
  remove: ->
    # Delete scripts used to capture analytics.
    scripts = document.querySelectorAll "script[src='#{ANALYTICS_SOURCE}']"
    script.parentNode.removeChild script for script in scripts
    # Remove tracking details for analytics.
    delete window._gaq

  # Create an event with the information provided and track it in analytics.
  track: (category, action, label, value, nonInteraction) ->
    if @enabled()
      event = ['_trackEvent']
      # Add the required information.
      event.push category
      event.push action
      # Add the optional information where possible.
      event.push label          if label?
      event.push value          if value?
      event.push nonInteraction if nonInteraction?
      # Add the event to analytics.
      _gaq = window._gaq ?= []
      _gaq.push event

# Initialize analytics.
store?.init 'analytics', yes