/* (c) 2011 Alasdair Mercer */
var utils={get:function(key){var value=localStorage[key];if(typeof(value)!=='undefined'){return JSON.parse(value);}
return value;},i18nReplace:function(selector,name,sub){if(typeof(sub)!=='undefined'){return $(selector).html(chrome.i18n.getMessage(name,sub));}
return $(selector).html(chrome.i18n.getMessage(name));},init:function(key,defaultValue){var value=utils.get(key);if(typeof(value)==='undefined'){value=defaultValue;}
return utils.set(key,value);},set:function(key,value){var oldValue=utils.get(key);if(typeof(value)!=='undefined'){localStorage[key]=JSON.stringify(value);}else{localStorage[key]=value;}
return oldValue;}};