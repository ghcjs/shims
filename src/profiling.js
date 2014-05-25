
var h$CC_MAIN       = h$mkCC("MAIN", "MAIN", "<built-in>", false);
var h$CC_SYSTEM     = h$mkCC("SYSTEM", "SYSTEM", "<built-in>", false);
var h$CC_GC         = h$mkCC("GC", "GC", "<built-in>", false);
var h$CC_OVERHEAD   = h$mkCC("OVERHEAD_of", "PROFILING", "<built-in>", false);
var h$CC_DONT_CARE  = h$mkCC("DONT_CARE", "MAIN", "<built-in>", false);
var h$CC_PINNED     = h$mkCC("PINNED", "SYSTEM", "<built-in>", false);
var h$CC_IDLE       = h$mkCC("IDLE", "IDLE", "<built-in>", false);

var h$CCS_MAIN      = h$mkCCS(h$CC_MAIN);
var h$CCS_SYSTEM    = h$mkCCS(h$CC_SYSTEM);
var h$CCS_GC        = h$mkCCS(h$CC_GC);
var h$CCS_OVERHEAD  = h$mkCCS(h$CC_OVERHEAD);
var h$CCS_DONT_CARE = h$mkCCS(h$CC_DONT_CARE);
var h$CCS_PINNED    = h$mkCCS(h$CC_PINNED);
var h$CCS_IDLE      = h$mkCCS(h$CC_IDLE);

var h$curCCS = h$CCS_MAIN;

function h$mkCC(label, module, srcloc, isCaf) {
  return { label: label, module: module, srcloc: srcloc, isCaf: isCaf,
           memAlloc: 0, timeTicks: 0 };
}

function h$mkCCS(cc) {
  return { cc: cc, sccCount: 0, timeTicks: 0, memAlloc: 0, inheritedTicks: 0, inheritedAlloc: 0, parent: null };
}

function h$setCC(label, tick, push) {
  console.log("setCC:", label, tick, push);
}

// ccs: cost-centre stack at call site
// cc: ??
function h$pushCostCentre(ccs, cc) {
  console.log("pushCostCentre");

  var ret = h$mkCCS(cc);

  /*
  ret.prevStack = ccs;
  ret.root = ccs.root;
  ret.depth = ccs.depth + 1;
  */

  return ret;
}

function h$tickCCS(ccs) {
  console.log("ticking cost-centre stack");
}

var h$ccsCC_offset     = 8;  // ccs->cc
var h$ccsParent_offset = 16; // ccs->prevStack

var h$ccLabel_offset   = 8;  // cc->label
var h$ccModule_offset  = 16; // cc->module
var h$ccsrcloc_offset  = 24; // cc->srcloc

function h$buildCCPtr(o) {
  console.log("buildCCPtr called");
  // last used offset is 24, so we need to allocate 32 bytes
  var cc = h$newByteArray(32);
  cc.arr = [];
  cc.arr[h$ccLabel_offset]  = [h$encodeUtf8(o.label),   0];
  cc.arr[h$ccModule_offset] = [h$encodeUtf8(o.module),  0];
  cc.arr[h$ccsrcloc_offset] = [h$encodeUtf8(o.srcloc),  0];
  console.log("returning cc:", cc);
  return cc;
}

function h$buildCCSPtr(o) {
  console.log("buildCCSPtr called");
  // last used offset is 16, allocate 24 bytes
  var ccs = h$newByteArray(24);
  ccs.arr = [];
  if (o.parent !== null) {
    ccs.arr[h$ccsParent_offset] = h$buildCCSPtr(o.parent);
  }
  ccs.arr[h$ccsCC_offset] = h$buildCCPtr(o.cc);
  console.log("returning ccs:", ccs);
  return ccs;
}
