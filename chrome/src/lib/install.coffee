# [Template](http://neocotic.com/template)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Functionality
# -------------

# Wrap the functionality in a message for Template's details in order to get
# the ID in use.
chrome.runtime.sendMessage type: 'info', (data) ->
  # Names of the classes to be added to the targeted elements.
  newClasses = ['disabled']
  # Names of the classes to be removed from the targeted elements.
  oldClasses = ['chrome_install_button']

  # Disable all "Install" links on the homepage for Template.
  for link in document.querySelectorAll "a.#{oldClasses[0]}[href$=#{data.id}]"
    link.innerHTML = link.innerHTML.replace 'Install', 'Installed'
    link.classList.add    cls for cls in newClasses
    link.classList.remove cls for cls in oldClasses