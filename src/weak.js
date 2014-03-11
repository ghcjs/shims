// weak reference support

var h$weaks = new goog.structs.Set();

#ifdef GHCJS_TRACE_WEAK
function h$traceWeak() { h$log.apply(h$log, arguments) }
#define TRACE_WEAK(args...) h$traceWeak(args)
#else
#define TRACE_WEAK(args...)
#endif

// called by the GC with a set of still reachable
function h$finalizeWeaks() {
  TRACE_WEAK("finalizeWeaks: " + mark);
  var i, w;
  var toFinalize = [];
  var toRemove   = [];
  var iter = h$weaks.__iterator__();
  try {
    while(true) {
      w = iter.next();
      TRACE_WEAK("checking weak of: " + h$collectProps(w.key));
      TRACE_WEAK("key mark: " + w.key.m + " - " + mark);
      if(!h$isMarked(w.key)) {
        if(w.finalizer === null) {
          toRemove.push(w);
        } else {
          toFinalize.push(w);
        }
      } else if(!h$isMarked(w) && w.finalizer === null) {
        toRemove.push(w);
      }
    }
  } catch(e) { if(e !== goog.iter.StopIteration) { throw e; } }
  TRACE_WEAK("to remove: " + toRemove.length);
  for(i=0;i<toRemove.length;i++) {
    w = toRemove[i];
    w.key = null;
    w.val = null;
    h$weaks.remove(w);
  }
  TRACE_WEAK("to finalize: " + toFinalize.length);
  // start a finalizer thread if any finalizers need to be run
  if(toFinalize.length > 0) {
    var t = new h$Thread();
    for(i=0;i<toFinalize.length;i++) {
      w = toFinalize[i];
      t.sp += 6;
      t.stack[t.sp-5] = 0;      // mask
      t.stack[t.sp-4] = h$noop; // handler, dummy
      t.stack[t.sp-3] = h$catch_e;
      t.stack[t.sp-2] = h$ap_1_0;
      t.stack[t.sp-1] = w.finalizer;
      t.stack[t.sp]   = h$return;
      w.key = null;
      w.val = null;
      w.finalizer = null;
      h$weaks.remove(w);
    }
    h$wakeupThread(t);
  }
}

function h$Weak(key, val, finalizer) {
  TRACE_WEAK("making weak of: " + h$collectProps(key));
  if(key.f && key.f.n) { TRACE_WEAK("name: " + key.f.n); }
  this.key = key;
  this.val = val;
  this.finalizer = finalizer;
  h$weaks.add(this);
}

function h$makeWeak(key, val, fin) {
  TRACE_WEAK("h$makeWeak");
  return new h$Weak(key, val, fin)
}

function h$makeWeakNoFinalizer(key, val) {
  TRACE_WEAK("h$makeWeakNoFinalizer");
  return new h$Weak(key, val, null);
}

function h$finalizeWeak(w) {
  TRACE_WEAK("finalizing weak of: " + h$collectProps(w.key));
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

