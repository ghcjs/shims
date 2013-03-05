// add exported things to global again, run this after all node modules
/*
var h$glbl = this;
for(p in exports) { 
//  console.log("exporting: " + p);
//  console.log("type: " + (typeof this[p]));
  if(typeof this[p] === 'undefined') {
    h$glbl[p] = exports[p];
  }
}
*/
if(typeof exports !== 'undefined') {
  var WeakMap = exports.WeakMap;
}

