# [Template](http://neocotic.com/template)  
# (c) 2012 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Private variables
# -----------------

# Names of the classes to be removed from the targeted elements.
classes     = [
                'chrome_install_button'
                'primary'
              ]
# Extension ID of Template.
extensionId = 'dcjnfaoifoefmnbhhlbppaebgnccfddf'
# "Install" links to be modified.
links       = document.querySelectorAll "a.#{classes[0]}[href$=#{extensionId}]"

# Functionality
# -------------

# Disable all "Install" links on the homepage for Template.
for link in links
  link.className += ' disabled'
  link.innerText  = 'Installed'
  link.className  = link.className.replace cls, '' for cls in classes