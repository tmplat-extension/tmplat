// [Template](http://neocotic.com/template)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/template>
(function() {
  chrome.extension.sendMessage({
    type: 'info'
  }, function(data) {
    var cls, link, newClasses, oldClasses, _i, _j, _len, _len1, _ref, _results;

    newClasses = ['disabled'];
    oldClasses = ['chrome_install_button'];
    _ref = document.querySelectorAll("a." + oldClasses[0] + "[href$=" + data.id + "]");
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      link = _ref[_i];
      link.innerHTML = link.innerHTML.replace('Install', 'Installed');
      for (_j = 0, _len1 = newClasses.length; _j < _len1; _j++) {
        cls = newClasses[_j];
        link.classList.add(cls);
      }
      _results.push((function() {
        var _k, _len2, _results1;

        _results1 = [];
        for (_k = 0, _len2 = oldClasses.length; _k < _len2; _k++) {
          cls = oldClasses[_k];
          _results1.push(link.classList.remove(cls));
        }
        return _results1;
      })());
    }
    return _results;
  });

}).call(this);
