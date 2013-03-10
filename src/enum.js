// some Enum conversion things

// an array of generic enums
var h$enums = [];
function h$initEnums() {
  for(var i=0;i<64;i++) {
    h$enums[i] = h$makeEnum(i);
  }
}
h$initStatic.push(h$initEnums);

function h$makeEnum(tag) {
  var f = function() {
    return h$stack[h$sp];
  }
  h$setObjInfo(f, 2, "Enum", [], tag+1, 0, [1], null);
  return { f: f, d: null };
}

function h$tagToEnum(tag) {
  if(tag === 0) return h$f;
  if(tag === 1) return h$t;
  if(tag >= h$enums.length) {
    return h$makeEnum(tag);
  } else {
    return h$enums[tag];
  }
}

