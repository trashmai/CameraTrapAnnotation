app.filter('v_filter', ['$sce', function($sce) {
  return function(items, di, toShow, scope, min_length) {

    var defaultNumOfOpts = 25;

    if (!toShow) return [];

    if (!min_length) min_length = 0;

    var filtered = [];
    var txt = scope.edit_token.data[di].value;
    var cell_id = scope.edit_token.token_id + '_' + scope.edit_token.data[di].key + '-di-' + di;

    if (txt == '?') txt = '';

    if (txt === undefined || txt.length === 0) {
      if (!!items)
      items.some(function(item, ii) {
        item.matched = $sce.trustAsHtml(item.vname + '(' + item.sciname + ')');
        filtered.push(item);
        return (ii == defaultNumOfOpts - 1);
      });
    }
    else {
      //if (txt.length <= min_length && false) {
      //  scope.found[cell_id] = false;
      //  return filtered;
      //}

      if (!!items)
      items.some(function(item) {
  
        var val = item.vname + ' (' + item.sciname + ')';
        var do_it = true;
  
        if (do_it) {
          if (txt && txt.length > 0 && val.toLowerCase().match(txt.toLowerCase().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))) {
            var pos = val.toLowerCase().indexOf(txt.toLowerCase());
            //var replaced = val.substr(0, pos) + '<span class="matched_part">' + val.substr(pos, txt.length) + '</span>' + val.substr(pos + txt.length) + ' (' + item.sciname + ')';
            var replaced = val.substr(0, pos) + '<span class="matched_part">' + val.substr(pos, txt.length) + '</span>' + val.substr(pos + txt.length);
            //item.sciname = item.sciname.replace(/\(.+\)/g, '').replace(/ +/g, ' ').trim();
            //item.vname = item.vname.replace(/\(.+\)/g, '').replace(/ +/g, ' ').trim();
            item.matched = $sce.trustAsHtml(replaced);
            filtered.push(item);
            return (filtered.length == defaultNumOfOpts - 1);
          }
        }
      });
    }

    if (filtered.length > 0) {
      scope.found[cell_id] = true && toShow;
    }
    else {
      scope.found[cell_id] = false;
    }
    // console.log(filtered);
    return filtered;
  }
}]);

