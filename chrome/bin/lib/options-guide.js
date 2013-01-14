// [Template](http://neocotic.com/template)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/template>
(function() {
  var ext;

  ext = chrome.extension.getBackgroundPage().ext;

  options.tab('guide', function() {
    log.trace();
    log.info('Initializing the guide tab');
    return $.extend(options.i18nMap, {
      bitlyAccount: {
        opt_url_shortener_account_title: i18n.get('shortener_bitly')
      },
      googlAccount: {
        opt_url_shortener_account_title: i18n.get('shortener_googl')
      }
    });
  });

}).call(this);
