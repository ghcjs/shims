function assert(condition, message) {
    if (!condition) {
        console.trace(message || "Assertion failed");
    }
}

var h$ccList  = [];
var h$ccsList = [];

var h$CC_MAIN       = h$registerCC("MAIN1", "MAIN1", "<built-in>", false);
var h$CC_SYSTEM     = h$registerCC("SYSTEM", "SYSTEM", "<built-in>", false);
var h$CC_GC         = h$registerCC("GC", "GC", "<built-in>", false);
var h$CC_OVERHEAD   = h$registerCC("OVERHEAD_of", "PROFILING", "<built-in>", false);
var h$CC_DONT_CARE  = h$registerCC("DONT_CARE", "MAIN1", "<built-in>", false);
var h$CC_PINNED     = h$registerCC("PINNED", "SYSTEM", "<built-in>", false);
var h$CC_IDLE       = h$registerCC("IDLE", "IDLE", "<built-in>", false);
var h$CAF_cc        = h$registerCC("CAF", "CAF", "<built-in>", false);

var h$CCS_MAIN      = h$registerCCS(h$CC_MAIN);
h$CCS_MAIN.root     = h$CCS_MAIN;

var h$CCS_SYSTEM    = h$registerCCS1(h$actualPush(h$CCS_MAIN, h$CC_SYSTEM));
var h$CCS_GC        = h$registerCCS1(h$actualPush(h$CCS_MAIN, h$CC_GC));
var h$CCS_OVERHEAD  = h$registerCCS1(h$actualPush(h$CCS_MAIN, h$CC_OVERHEAD));
var h$CCS_DONT_CARE = h$registerCCS1(h$actualPush(h$CCS_MAIN, h$CC_DONT_CARE));
var h$CCS_PINNED    = h$registerCCS1(h$actualPush(h$CCS_MAIN, h$CC_PINNED));
var h$CCS_IDLE      = h$registerCCS1(h$actualPush(h$CCS_MAIN, h$CC_IDLE));
var h$CAF           = h$registerCCS1(h$actualPush(h$CCS_MAIN, h$CAF_cc));

var h$CCCS = h$CCS_MAIN;

function h$getCurrentCostCentre() {
  return h$CCCS;
}

function h$mkCC(label, module, srcloc, isCaf) {
  console.log("h$mkCC(", label, ", ", module, ", ", srcloc, ", ", isCaf, ")");
  return { label: label, module: module, srcloc: srcloc, isCaf: isCaf,
           memAlloc: 0, timeTicks: 0 };
}

function h$mkCCS(cc) {
  console.log("h$mkCCS(", cc, ")");
  return { cc: cc, sccCount: 0, timeTicks: 0, memAlloc: 0, inheritedTicks: 0,
           inheritedAlloc: 0, prevStack: null, root: null, depth: 0 };
}

function h$registerCC(label, module, srcloc, isCaf) {
  var cc = h$mkCC(label, module, srcloc, isCaf);
  h$ccList.push(cc);
  return cc;
}

function h$registerCCS(cc) {
  var ccs = h$mkCCS(cc);
  h$ccsList.push(ccs);
  return ccs;
}

function h$registerCCS1(ccs) {
  h$ccsList.push(ccs);
  return ccs;
}

function h$enterFunCCS(ccsapp, ccsfn) {
  assert (ccsapp !== null, "ccsapp is null");
  assert (ccsfn  !== null, "ccsfn is null");

  // common case 1: both stacks are the same
  if (ccsapp === ccsfn) {
    return;
  }

  // common case 2: the function stack is empty, or just CAF
  if (ccsfn.prevStack === h$CCS_MAIN) {
    return;
  }

  // FIXME: do we need this?
  h$CCCS = h$CC_OVERHEAD;

  // common case 3: the stacks are completely different (e.g. one is a
  // descendent of MAIN and the other of a CAF): we append the whole
  // of the function stack to the current CCS.
  if (ccsfn.root !== ccsapp.root) {
    h$CCCS = h$appendCCS(ccsapp, ccsfn);
    return;
  }

  // uncommon case 4: ccsapp is deeper than ccsfn
  if (ccsapp.depth > ccsfn.depth) {
    var tmp = ccsapp;
    var dif = ccsapp.depth - ccsfn.depth;
    for (var i = 0; i < dif; i++) {
      tmp = tmp.prevStack;
    }
    h$CCCS = h$enterFunEqualStacks(ccsapp, tmp, ccsfn);
    return;
  }

  // uncommon case 5: ccsfn is deeper than CCCS
  if (ccsfn.depth > ccsapp.depth) {
    h$CCCS = h$enterFunCurShorter(ccsapp, ccsfn, ccsfn.depth - ccsapp.depth);
    return;
  }

  // uncommon case 6: stacks are equal depth, but different
  h$CCCS = h$enterFunEqualStacks(ccsapp, ccsapp, ccsfn);
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
    assert(ccsapp.length === ccsfn.length, "ccsapp.length !== ccsfn.length");
    return h$enterFunEqualStacks(ccsapp, ccsapp, ccsfn);
  } else {
    assert(ccsfn.depth > ccsapp.depth, "ccsfn.depth <= ccsapp.depth");
    return h$pushCostCentre(h$enterFunCurShorter(ccsapp, ccsfn.prevStack, n-1), ccsfn.cc);
  }
}

function h$enterFunEqualStacks(ccs0, ccsapp, ccsfn) {
  assert(ccsapp.depth === ccsfn.depth, "ccsapp.depth !== ccsfn.depth");
  if (ccsapp === ccsfn) return ccs0;
  return h$pushCostCentre(h$enterFunEqualStacks(ccs0, ccsapp.prevStack, ccsfn.prevStack), ccsfn.cc);
}

function h$pushCostCentre(ccs, cc) {
  if (ccs.cc === cc) {
    return ccs;
  } else {
    var temp_ccs = h$checkLoop(ccs, cc);
    if (temp_ccs !== null) {
      return temp_ccs;
    }
    return h$actualPush(ccs, cc);
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

function h$actualPush(ccs, cc) {
  var new_ccs = {};

  new_ccs.cc = cc;
  new_ccs.prevStack = ccs;
  new_ccs.root = ccs.root;
  new_ccs.depth = ccs.depth + 1;
  new_ccs.sccCount = 0;
  new_ccs.timeTicks = 0;
  new_ccs.memAlloc = 0;
  new_ccs.inheritedTicks = 0;
  new_ccs.inheritedAlloc = 0;

  return new_ccs;
}

//
// Emulating pointers for cost-centres and cost-centre stacks
//

var h$ccsCC_offset     = 8;  // ccs->cc
var h$ccsPrevStackOffset = 16; // ccs->prevStack

var h$ccLabel_offset   = 8;  // cc->label
var h$ccModule_offset  = 16; // cc->module
var h$ccsrcloc_offset  = 24; // cc->srcloc

function h$buildCCPtr(o) {
  console.log("buildCCPtr called");
  // last used offset is 24, so we need to allocate 32 bytes
  var cc = h$newByteArray(32);
  cc.myTag = "cc pointer";
  cc.arr = [];
  cc.arr[h$ccLabel_offset]  = [h$encodeUtf8(o.label),   0];
  cc.arr[h$ccModule_offset] = [h$encodeUtf8(o.module),  0];
  cc.arr[h$ccsrcloc_offset] = [h$encodeUtf8(o.srcloc),  0];
  console.log("returning cc:", cc);
  return cc;
}

function h$buildCCSPtr(o) {
  if (o === null)
    // `o` may be null when:
    //   * f.ccs is null, which means either we have a bug in code generator,
    //     or profiling is disabled and CCS field of ClosureInfo is left Nothing
    // TODO: are there any other cases?
    return null;
  console.log("buildCCSPtr called", o);
  // last used offset is 16, allocate 24 bytes
  var ccs = h$newByteArray(24);
  ccs.myTag = "ccs pointer";
  ccs.arr = [];
  if (o.prevStack !== null) {
    ccs.arr[h$ccsPrevStackOffset] = [h$buildCCSPtr(o.prevStack), 0];
  }
  ccs.arr[h$ccsCC_offset] = [h$buildCCPtr(o.cc), 0];
  console.log("returning ccs:", ccs);
  return ccs;
}
