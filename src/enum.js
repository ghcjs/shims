// some Enum conversion things

// an array of generic enums
var $hs_enums = [];
function $hs_initEnums() {
  for(var i=0;i<32;i++) {
    var f = $hs_makeEnum(i);
    var h = alloc_static(1);
    heap[h] = f;
    $hs_enums[i] = h;
  }
}
initStatic.push($hs_initEnums);

function $hs_makeEnum(tag) {
  var f = function() {
    return stack[sp];
  }
  _setObjInfo(f, 2, "Enum", [], tag+1, 0, [1], null);
  return f;
}

function $hs_tagToEnum(tag) {
  if(tag <= 1) return tag;   // bools are enum, return them if in range
  if(tag > $hs_enums.length) {
    var f = $hs_makeEnum(tag);
    heap[hp] = f;
    return hp++;
  } else {
    return $hs_enums[tag];
  }
}

