// [Template](http://neocotic.com/template)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/template>
(function() {
  var ext, load, loadAccounts, loadControlEvents, loadSaveEvents;

  ext = chrome.extension.getBackgroundPage().ext;

  load = function() {
    var yourls;
    log.trace();
    $('input[name="enabled_shortener"]').each(function() {
      var $this;
      $this = $(this);
      if (store.get("" + ($this.attr('id')) + ".enabled")) {
        $this.attr('checked', 'checked');
      }
      return true;
    });
    yourls = store.get('yourls');
    $('#yourlsAuthentication' + ((function() {
      switch (yourls.authentication) {
        case 'advanced':
          return 'Advanced';
        case 'basic':
          return 'Basic';
        default:
          return 'None';
      }
    })())).addClass('active');
    $('#yourlsPassword').val(yourls.password);
    $('#yourlsSignature').val(yourls.signature);
    $('#yourlsUrl').val(yourls.url);
    $('#yourlsUsername').val(yourls.username);
    loadAccounts();
    loadControlEvents();
    return loadSaveEvents();
  };

  loadAccounts = function() {
    var shortener, _i, _len, _ref, _results;
    log.trace();
    _ref = ext.queryUrlShorteners(function(shortener) {
      return shortener.oauth != null;
    });
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      shortener = _ref[_i];
      _results.push((function(shortener) {
        var button;
        button = $("#" + shortener.name + "Account");
        button.click(function() {
          var $this;
          $this = $(this).blur();
          if ($this.data('oauth') !== 'true') {
            $this.tooltip('hide');
            log.debug("Attempting to authorize " + shortener.name);
            return shortener.oauth.authorize(function() {
              var success;
              log.debug("Authorization response for " + shortener.name + "...", arguments);
              if (success = shortener.oauth.hasAccessToken()) {
                $this.addClass('btn-danger').removeClass('btn-success');
                $this.data('oauth', 'true');
                $this.html(i18n.get('opt_url_shortener_logout_button'));
              }
              return analytics.track('Shorteners', 'Login', shortener.title, Number(success));
            });
          } else {
            log.debug("Removing authorization for " + shortener.name);
            shortener.oauth.clearAccessToken();
            if ($this.attr('id') === 'bitlyAccount') {
              shortener.oauth.clear('apiKey');
              shortener.oauth.clear('login');
            }
            $this.addClass('btn-success').removeClass('btn-danger');
            $this.data('oauth', 'false');
            $this.html(i18n.get('opt_url_shortener_login_button'));
            return analytics.track('Shorteners', 'Logout', shortener.title);
          }
        });
        if (shortener.oauth.hasAccessToken()) {
          button.addClass('btn-danger').removeClass('btn-success');
          button.data('oauth', 'true');
          return button.html(i18n.get('opt_url_shortener_logout_button'));
        } else {
          button.addClass('btn-success').removeClass('btn-danger');
          button.data('oauth', 'false');
          return button.html(i18n.get('opt_url_shortener_login_button'));
        }
      })(shortener));
    }
    return _results;
  };

  loadControlEvents = function() {
    log.trace();
    return $('#yourlsAuthentication button').click(function() {
      return $("." + ($(this).attr('id'))).show().siblings().hide();
    }).filter('.active').click();
  };

  loadSaveEvents = function() {
    log.trace();
    $('input[name="enabled_shortener"]').change(function() {
      return store.modify('bitly', 'googl', 'yourls', function(data, key) {
        var shortener;
        if (data.enabled = $("#" + key).is(':checked')) {
          shortener = ext.queryUrlShortener(function(shortener) {
            return shortener.name === key;
          });
          log.debug("Enabling " + shortener.title + " URL shortener");
          return analytics.track('Shorteners', 'Enabled', shortener.title);
        }
      });
    });
    $('#yourlsAuthentication button').click(function() {
      var $this, auth;
      $this = $(this);
      auth = $this.attr('id').match(/yourlsAuthentication(.*)/)[1];
      store.modify('yourls', function(yourls) {
        return yourls.authentication = auth === 'None' ? '' : auth.toLowerCase();
      });
      log.debug("YOURLS authentication changed: " + auth);
      return analytics.track('Shorteners', 'Changed', 'YOURLS Authentication', $this.index());
    });
    return options.bindSaveEvent("#yourlsPassword, #yourlsSignature, #yourlsUrl, #yourlsUsername", 'input', 'yourls', function() {
      return this.val().trim();
    });
  };

  options.tab('shorteners', function() {
    log.trace();
    log.info('Initializing the shorteners tab');
    $.extend(options.i18nMap, {
      bitlyAccount: {
        opt_url_shortener_account_title: i18n.get('shortener_bitly')
      },
      googlAccount: {
        opt_url_shortener_account_title: i18n.get('shortener_googl')
      }
    });
    return load();
  });

}).call(this);
