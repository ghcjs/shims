// weak reference support

// contains all pending finalizers
var h$finalizers = new h$Set();

// filled at scan time, weak refs with possible work to do
var h$scannedWeaks = [];

#ifdef GHCJS_TRACE_WEAK
function h$traceWeak() { h$log.apply(h$log, arguments) }
#define TRACE_WEAK(args...) h$traceWeak(args)
#else
#define TRACE_WEAK(args...)
#endif

// called by the GC after marking the heap
function h$finalizeWeaks() {
    var mark = h$gcMark;
    TRACE_WEAK("finalizeWeaks: " + mark + " " + h$finalizers.size());
    var i, w, toFinalize = [];
    var iter = h$finalizers.iter();
    while((w = iter.next()) !== null) {
        TRACE_WEAK("checking weak with finalizer: " + h$stableNameInt(w.m));
        TRACE_WEAK("finalizer mark: " + w.m.m + " - " + mark);
        if((w.m.m&3) !== mark) {
            iter.remove();
            toFinalize.push(w);
            TRACE_WEAK("finalizer scheduled");
        }
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
            w.finalizer = null;
        }
        h$wakeupThread(t);
    }
    return toFinalize;

}

// clear references for reachable weak refs with unreachable keys
function h$clearWeaks() {
    var mark = h$gcMark;
    TRACE_WEAK("clearing weak refs, to check: " + h$scannedWeaks.length);
    for(var i=h$scannedWeaks.length-1;i>=0;i--) {
        var w = h$scannedWeaks[i];
        if(w.keym.m !== mark && w.val !== null) {
            TRACE_WEAK("clearing weak ref of: " + h$stableNameInt(w.keym));
            w.val = null;
        }
    }
}

var h$weakFinalizerN = 0;
/** @constructor */
function h$Weak(key, val, finalizer) {
    if(typeof key !== 'object') {
        // can't attach a StableName to objects with unboxed storage
        // our weak ref will be finalized soon.
        TRACE_WEAK("WARNING: making weak for object with unboxed storage");
        this.keym = new h$StableName(0);
    } else {
        if(typeof key.m !== 'object') key.m = new h$StableName(key.m);
        this.keym = key.m;
    }
    TRACE_WEAK("making weak of: " + h$stableNameInt(this.keym));
    this.keym      = key.m;
    this.val       = val;
    this.finalizer = null;
    if(finalizer !== null) {
        var fin = { m: this.keym, finalizer: finalizer, _key: ++h$weakFinalizerN };
        h$finalizers.add(fin);
        this.finalizer = fin;
    }
    this.m = 0;
//    h$scannedWeaks.push(this); // fixme debug
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
    TRACE_WEAK("finalizing weak of " + h$stableNameInt(w.keym));
    w.val  = null;
    if(w.finalizer === null || w.finalizer.finalizer === null) {
        RETURN_UBX_TUP2(null, 0);
    } else {
        var r = w.finalizer.finalizer;
        h$finalizers.remove(w.finalizer);
        w.finalizer = null;
        RETURN_UBX_TUP2(r, 1);
    }
}


