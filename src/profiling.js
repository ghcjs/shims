
var h$CC_MAIN       = h$mkCC("MAIN", "MAIN", "<built-in>", false);
var h$CC_SYSTEM     = h$mkCC("SYSTEM", "SYSTEM", "<built-in>", false);
var h$CC_GC         = h$mkCC("GC", "GC", "<built-in>", false);
var h$CC_OVERHEAD   = h$mkCC("OVERHEAD_of", "PROFILING", "<built-in>", false);
var h$CC_DONT_CARE  = h$mkCC("DONT_CARE", "MAIN", "<built-in>", false);
var h$CC_PINNED     = h$mkCC("PINNED", "SYSTEM", "<built-in>", false);
var h$CC_IDLE       = h$mkCC("IDLE", "IDLE", "<built-in>", false);

var h$CCS_MAIN      = h$mkCCS(CC_MAIN);
var h$CCS_SYSTEM    = h$mkCCS(CC_SYSTEM);
var h$CCS_GC        = h$mkCCS(CC_GC);
var h$CCS_OVERHEAD  = h$mkCCS(CC_OVERHEAD);
var h$CCS_DONT_CARE = h$mkCCS(CC_DONT_CARE);
var h$CCS_PINNED    = h$mkCCS(CC_PINNED);
var h$CCS_IDLE      = h$mkCCS(CC_IDLE);

function h$mkCC(label, module, srcloc, isCaf) {
  return { label: label, module: module, srcloc: srcloc, isCaf: isCaf,
           memAlloc: 0, timeTicks: 0 };
}

function h$mkCCS(cc) {
  return { cc: cc, sccCount: 0, timeTicks: 0, memAlloc: 0, inheritedTicks: 0, inheritedAlloc: 0 };
}

// ccs: cost-centre stack at call site
// cc: ??
function h$pushCostCentre(ccs, cc) {
  var ret = mkCCS(cc);

  ret.prevStack = ccs;
  ret.root = ccs.root;
  ret.depth = ccs.depth + 1;

  return ret;
}
