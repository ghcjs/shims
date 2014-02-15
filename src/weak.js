// weak reference support

// h$Weak objects that still have finalizers
var h$weaks = new goog.structs.Set();

// var traceWeak = log;
function traceWeak() { return; }

// called by the GC with a set of still reachable
function h$finalizeWeaks() {
  var mark = h$gcMark;
  traceWeak("finalizeWeaks: " + mark);
  var iter = h$weaks.__iterator__();
  var toFinalize = [];
  var needFinalizeThread = false;
  var checked = 0;
  try {
    while(true) {
      checked++;
      var w = iter.next();
      traceWeak("key mark: " + w.key.m + " - " + mark);
      if(w.key.m === undefined || w.key.m & 3 !== mark) {
        if(w.finalizer !== null) needFinalizeThread = true; 
        toFinalize.push(w);
      }
    }
  } catch(e) { if(e !== goog.iter.StopIteration) { throw e; } }
  traceWeak("to finalize: " + toFinalize.length + " checked: " + checked);
  // start a finalizer thread if any finalizers need to be run
  if(toFinalize.length > 0) {
    var t = needFinalizeThread ? new h$Thread() : null;
    for(var i=0;i<toFinalize.length;i++) {
      var w = toFinalize[i];
      if(w.finalizer !== null) {
        t.sp += 6;
        t.stack[t.sp-5] = 0;      // mask
        t.stack[t.sp-4] = h$noop; // handler, dummy
        t.stack[t.sp-3] = h$catch_e;
        t.stack[t.sp-2] = h$ap_1_0;
        t.stack[t.sp-1] = w.finalizer;
        t.stack[t.sp]   = h$return;
      }
      h$weaks.remove(w);
      w.key = null;
      w.val = null;
      w.finalizer = null;
    }
    if(needFinalizeThread) h$wakeupThread(t);
  }
}

function h$Weak(key, val, finalizer) {
  traceWeak("making weak of: " + h$collectProps(key));
  if(key.f && key.f.n) { traceWeak("name: " + key.f.n); }
  this.key = key;
  this.val = val;
  this.finalizer = finalizer;
  h$weaks.add(this);
}

function h$makeWeak(key, val, fin) {
  return new h$Weak(key, val, fin)
}

function h$makeWeakNoFinalizer(key, val) {
  return new h$Weak(key, val, null);
}

function h$finalizeWeak(w) {
  h$weaks.remove(w);
  w.key = null;
  w.val = null;
  if(w.finalizer === null) {
    return 0;
  } else {
    h$ret1 = w.finalizer;
    w.finalizer = null;
    return 1;
  }
}

