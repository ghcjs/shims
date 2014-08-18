
// Used definitions: GHCJS_TRACE_PROF, GHCJS_ASSERT_PROF and GHCJS_PROF_GUI

#ifdef GHCJS_ASSERT_PROF
function assert(condition, message) {
    if (!condition) {
        console.trace(message || "Assertion failed");
    }
}
#define ASSERT(args...) assert(args)
#else
#define ASSERT(args...)
#endif

#ifdef GHCJS_TRACE_PROF
#define TRACE(args...) h$log(args)
#else
#define TRACE(args...)
#endif


var h$ccList  = [];
var h$ccsList = [];

var h$CCUnique = 0;
/** @constructor */
function h$CC(label, module, srcloc, isCaf) {
  //TRACE("h$CC(", label, ", ", module, ", ", srcloc, ", ", isCaf, ")");
  this.label     = label;
  this.module    = module;
  this.srcloc    = srcloc;
  this.isCaf     = isCaf;
  this._key      = ++h$CCUnique;
  this.memAlloc  = 0;
  this.timeTicks = 0;
  h$ccList.push(this);
}


var h$CCSUnique = 0;
/** @constructor */
function h$CCS(parent, cc) {
  //TRACE("h$mkCCS(", parent, cc, ")");
  if (parent !== null && parent.consed.has(cc)) {
    return (parent.consed.get(cc));
  }
  this.consed = new h$Map();
  this.cc     = cc;
  this._key   = ++h$CCSUnique;
  if (parent) {
    this.root      = parent.root;
    this.depth     = parent.depth + 1;
    this.prevStack = parent;
    parent.consed.put(cc,this);
  } else {
    this.root      = this;
    this.depth     = 0;
    this.prevStack = null;
  }
  this.prevStack      = parent;
  this.sccCount       = 0;
  this.timeTicks      = 0;
  this.memAlloc       = 0;
  this.retained       = 0; // retained object count, counted in last GC cycle
  this.inheritedRetain= 0; // inherited retained counts
  this.inheritedTicks = 0;
  this.inheritedAlloc = 0;

  h$ccsList.push(this);  /* we need all ccs for statistics, not just the root ones */
}


//
// Built-in cost-centres and stacks
//

var h$CC_MAIN       = new h$CC("MAIN", "MAIN", "<built-in>", false);
var h$CC_SYSTEM     = new h$CC("SYSTEM", "SYSTEM", "<built-in>", false);
var h$CC_GC         = new h$CC("GC", "GC", "<built-in>", false);
var h$CC_OVERHEAD   = new h$CC("OVERHEAD_of", "PROFILING", "<built-in>", false);
var h$CC_DONT_CARE  = new h$CC("DONT_CARE", "MAIN", "<built-in>", false);
var h$CC_PINNED     = new h$CC("PINNED", "SYSTEM", "<built-in>", false);
var h$CC_IDLE       = new h$CC("IDLE", "IDLE", "<built-in>", false);
var h$CAF_cc        = new h$CC("CAF", "CAF", "<built-in>", false);

var h$CCS_MAIN      = new h$CCS(null, h$CC_MAIN);

var h$CCS_SYSTEM    = new h$CCS(h$CCS_MAIN, h$CC_SYSTEM);
var h$CCS_GC        = new h$CCS(h$CCS_MAIN, h$CC_GC);
var h$CCS_OVERHEAD  = new h$CCS(h$CCS_MAIN, h$CC_OVERHEAD);
var h$CCS_DONT_CARE = new h$CCS(h$CCS_MAIN, h$CC_DONT_CARE);
var h$CCS_PINNED    = new h$CCS(h$CCS_MAIN, h$CC_PINNED);
var h$CCS_IDLE      = new h$CCS(h$CCS_MAIN, h$CC_IDLE);
var h$CAF           = new h$CCS(h$CCS_MAIN, h$CAF_cc);


//
// Cost-centre entries, SCC
//

#ifdef GHCJS_TRACE_PROF
function h$ccsString(ccs) {
  var labels = [];
  do {
    labels.push(ccs.cc.module+'.'+ccs.cc.label+' '+ccs.cc.srcloc);
    ccs = ccs.prevStack;
  } while (ccs !== null);
  return '[' + labels.reverse().join(', ') + ']';
}
#endif

function h$pushRestoreCCS() {
    TRACE("push restoreccs:" + h$ccsString(h$currentThread.ccs));
    if(h$stack[h$sp] !== h$setCcs_e) {
        h$sp += 2;
        h$stack[h$sp-1] = h$currentThread.ccs;
        h$stack[h$sp]   = h$setCcs_e;
    }
}

function h$restoreCCS(ccs) {
    TRACE("restoreccs from:", h$ccsString(h$currentThread.ccs));
    TRACE("             to:", h$ccsString(ccs));
    h$currentThread.ccs = ccs;
}

function h$enterThunkCCS(ccsthunk) {
  ASSERT(ccsthunk !== null && ccsthunk !== undefined, "ccsthunk is null or undefined");
  TRACE("entering ccsthunk:", h$ccsString(ccsthunk));
  h$currentThread.ccs = ccsthunk;
}

function h$enterFunCCS(ccsapp, // stack at call site
                       ccsfn   // stack of function
                       ) {
  ASSERT(ccsapp !== null && ccsapp !== undefined, "ccsapp is null or undefined");
  ASSERT(ccsfn  !== null && ccsfn  !== undefined, "ccsfn is null or undefined");
  TRACE("ccsapp:", h$ccsString(ccsapp));
  TRACE("ccsfn:", h$ccsString(ccsfn));

  // common case 1: both stacks are the same
  if (ccsapp === ccsfn) {
    return;
  }

  // common case 2: the function stack is empty, or just CAF
  if (ccsfn.prevStack === h$CCS_MAIN) {
    return;
  }

  // FIXME: do we need this?
  h$currentThread.ccs = h$CCS_OVERHEAD;

  // common case 3: the stacks are completely different (e.g. one is a
  // descendent of MAIN and the other of a CAF): we append the whole
  // of the function stack to the current CCS.
  if (ccsfn.root !== ccsapp.root) {
    h$currentThread.ccs = h$appendCCS(ccsapp, ccsfn);
    return;
  }

  // uncommon case 4: ccsapp is deeper than ccsfn
  if (ccsapp.depth > ccsfn.depth) {
    var tmp = ccsapp;
    var dif = ccsapp.depth - ccsfn.depth;
    for (var i = 0; i < dif; i++) {
      tmp = tmp.prevStack;
    }
    h$currentThread.ccs = h$enterFunEqualStacks(ccsapp, tmp, ccsfn);
    return;
  }

  // uncommon case 5: ccsfn is deeper than CCCS
  if (ccsfn.depth > ccsapp.depth) {
    h$currentThread.ccs = h$enterFunCurShorter(ccsapp, ccsfn, ccsfn.depth - ccsapp.depth);
    return;
  }

  // uncommon case 6: stacks are equal depth, but different
  h$currentThread.ccs = h$enterFunEqualStacks(ccsapp, ccsapp, ccsfn);
}

function h$appendCCS(ccs1, ccs2) {
  if (ccs1 === ccs2) {
    return ccs1;
  }

  if (ccs2 === h$CCS_MAIN || ccs2.cc.isCaf) {
    // stop at a CAF element
    return ccs1;
  }

  return h$pushCostCentre(h$appendCCS(ccs1, ccs2.prevStack), ccs2.cc);
}

function h$enterFunCurShorter(ccsapp, ccsfn, n) {
  if (n === 0) {
    ASSERT(ccsapp.length === ccsfn.length, "ccsapp.length !== ccsfn.length");
    return h$enterFunEqualStacks(ccsapp, ccsapp, ccsfn);
  } else {
    ASSERT(ccsfn.depth > ccsapp.depth, "ccsfn.depth <= ccsapp.depth");
    return h$pushCostCentre(h$enterFunCurShorter(ccsapp, ccsfn.prevStack, n-1), ccsfn.cc);
  }
}

function h$enterFunEqualStacks(ccs0, ccsapp, ccsfn) {
  ASSERT(ccsapp.depth === ccsfn.depth, "ccsapp.depth !== ccsfn.depth");
  if (ccsapp === ccsfn) return ccs0;
  return h$pushCostCentre(h$enterFunEqualStacks(ccs0, ccsapp.prevStack, ccsfn.prevStack), ccsfn.cc);
}

function h$pushCostCentre(ccs, cc) {
  TRACE("pushing cost centre", cc.label, "to", h$ccsString(ccs));
  if (ccs === null) {
    // when is ccs null?
    return new h$CCS(ccs, cc);
  }

  if (ccs.cc === cc) {
    return ccs;
  } else {
    var temp_ccs = h$checkLoop(ccs, cc);
    if (temp_ccs !== null) {
      return temp_ccs;
    }
    return new h$CCS(ccs, cc);
  }
}

function h$checkLoop(ccs, cc) {
  while (ccs !== null) {
    if (ccs.cc === cc)
      return ccs;
    ccs = ccs.prevStack;
  }
  return null;
}

//
// Emulating pointers for cost-centres and cost-centre stacks
//

var h$ccsCC_offset       = 4;  // ccs->cc
var h$ccsPrevStackOffset = 8;  // ccs->prevStack

var h$ccLabel_offset     = 4;  // cc->label
var h$ccModule_offset    = 8;  // cc->module
var h$ccsrcloc_offset    = 12; // cc->srcloc

function h$buildCCPtr(o) {
  // last used offset is 12, so we need to allocate 20 bytes
  ASSERT(o !== null);
  var cc = h$newByteArray(20);
#ifdef GHCJS_TRACE_PROF
  cc.myTag = "cc pointer";
#endif
  cc.arr = [];
  cc.arr[h$ccLabel_offset]  = [h$encodeUtf8(o.label),   0];
  cc.arr[h$ccModule_offset] = [h$encodeUtf8(o.module),  0];
  cc.arr[h$ccsrcloc_offset] = [h$encodeUtf8(o.srcloc),  0];
  return cc;
}

function h$buildCCSPtr(o) {
  ASSERT(o !== null);
  // last used offset is 8, allocate 16 bytes
  var ccs = h$newByteArray(16);
#ifdef GHCJS_TRACE_PROF
  ccs.myTag = "ccs pointer";
#endif
  ccs.arr = [];
  if (o.prevStack !== null) {
    ccs.arr[h$ccsPrevStackOffset] = [h$buildCCSPtr(o.prevStack), 0];
  }
  // FIXME: we may need this part:
  // else {
  //   ccs.arr[h$ccsPrevStackOffset] = [null, 0];
  // }
  ccs.arr[h$ccsCC_offset] = [h$buildCCPtr(o.cc), 0];
  return ccs;
}

//
// Updating and printing retained obj count of stacks, to be used in GC scan
//

// reset retained object counts
function h$resetRetained() {
  for (var i = 0; i < h$ccsList.length; i++) {
    var ccs = h$ccsList[i];
    ccs.retained = 0;
    ccs.inheritedRetain = 0;
  }
}

function h$updRetained(obj) {
  // h$gc visits all kinds of objects, not just heap objects
  // so we're checking if the object has cc field
  // assuming we added cc field to every heap object, this should work correctly
  if (obj.cc !== undefined) {
    ASSERT(obj.cc.retained !== null && obj.cc.retained !== undefined);
    obj.cc.retained++;
  }
}

function h$inheritRetained(ccs) {
  var consedCCS = ccs.consed.values();
  for (var i = 0; i < consedCCS.length; i++) {
    h$inheritRetained(consedCCS[i]);
    ccs.inheritedRetain += consedCCS[i].inheritedRetain;
  }
  ccs.inheritedRetain += ccs.retained;
}

function h$printRetainedInfo() {
  h$inheritRetained(h$CCS_MAIN);

  for (var i = 0; i < h$ccsList.length; i++) {
    var ccs = h$ccsList[i];
    if (ccs.inheritedRetain !== 0) {
      console.log(h$ccsString(ccs));
    }
  }
  console.log("END");
}

// Profiling GUI

var h$ghcjsGui = null;

function h$loadResource(elem, props, f) {
    var e = document.createElement(elem);
    for(var p in props) e[p] = props[p];
    if(typeof document.attachEvent === "object") {
        e.onreadystatechange = function() {
            if(e.readyState === 'loaded') f();
        }
    } else e.onload = function() { f(); }
    var elems = document.getElementsByTagName('head');
    if(elems.length) elems[0].appendChild(e);
    else document.addEventListener('DOMContentLoaded', function() {
             document.getElementsByTagName('head')[0].appendChild(e);
         });
}

function h$loadGui() {
    h$loadResource('script', {'src': 'polymer-components/platform/platform.js'}, function() {
        h$loadResource('link', {'rel': 'import', 'href': 'ghcjs-gui/ghcjs-gui.html'}, function() {
            h$ghcjsGui = document.createElement('ghcjs-gui');
            document.body.appendChild(h$ghcjsGui);
        });
    });
}

function h$mkCCSLabel(ccs) {
  return ccs.cc.module + '.' + ccs.cc.label + ' ('  + ccs.cc.srcloc + ')';
}

var h$profDataMax = 50; // before we start rotating out old sample sets
var h$profData    = { samples: []
                    , latest: null
                    }
var h$noProfUpd = false;
function h$updateProfData() {
    if(h$noProfUpd || !h$ghcjsGui) return;
    var maxRetained = 0;
    var maxInherit  = 0;
    var s = {time: Date.now(), values: [], maxRetained: 0, maxInherit: 0, index: []};
    for(var i=0;i<h$ccsList.length;i++) {
        var ccs = h$ccsList[i];
        h$inheritRetained(ccs);
        s.values.push({i:i, ccs: ccs, inherited: ccs.inheritedRetain, sample: s});
        maxRetained = Math.max(maxRetained, ccs.retained);
        maxInherit  = Math.max(maxInherit, ccs.inheritedRetain);
    }
    s.maxRetained = maxRetained;
    s.maxInherit  = maxInherit;
    s.values.sort(function(a,b) { return b.inherited - a.inherited });
    for(i=0;i<h$ccsList.length;i++) s.index[s.values[i].i] = i;
    h$profData.samples.push(s);
    h$profData.latest = s;
    if(h$profData.samples.length > h$profDataMax) h$profData.samples.shift();
}

#ifdef GHCJS_PROF_GUI
h$loadGui();
#endif
