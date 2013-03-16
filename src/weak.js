// weak references
// a weak ref contains:
// [a]

// map: heap index -> finalizers
var h$weaks = []; // new Set();
// h$weaks.n = 1;

function h$makeWeak(obj, fin) {
  var a = [obj];
  h$weaks.push({ obj: a, finalizers: fin });
  return a;
}

function h$makeWeakNoFinalizer() {
  throw "h$makeWeakNoFinalizer not yet implemented";
}

