// software transactional memory

#ifdef GHCJS_TRACE_STM
function h$logStm() { if(arguments.length == 1) {
                         h$log("stm: " + arguments[0]);
                       } else {
                         h$log.apply(h$log,arguments);
                       }
                     }
#define TRACE_STM(args...) h$logStm(args)
#else
#define TRACE_STM(args...)
#endif


var h$stmTransactionActive = 0;
var h$stmTransactionWaiting = 4;

function h$Transaction(o, parent) {
  TRACE_STM("h$Transaction: " + o + " -> " + parent);
  this.action        = o;
  // h$TVar.id -> h$WrittenTVar, transaction-local changed values
  this.tvars         = new goog.structs.Map();
  // h$TVar.id -> h$LocalTVar, all local tvars accessed anywhere in the transaction
  this.accessed      = parent===null?new goog.structs.Map():parent.accessed;
  // nonnull while running a check, contains read variables in this part of the transaction
  this.checkRead     = parent===null?null:parent.checkRead;
  this.parent        = parent;
  this.state         = h$stmTransactionActive;
  this.invariants    = []; // invariants added in this transaction
}

function h$StmInvariant(a) {
  this.action = a;
}

function h$WrittenTVar(tv,v) {
  this.tvar = tv;
  this.val = v;
}

function h$TVar(v) {
  TRACE_STM("creating tvar, value: " + h$collectProps(v));
  this.val     = v;                         // current value
  this.blocked = new goog.structs.Set();    // threads that get woken up if this TVar is updated
  this.invariants = null;                   // invariants that use this tvar
}

function h$TVarsWaiting(s) {
  this.tvars = s;  // goog.structs.Set of TVars we're waiting on
}

function h$LocalInvariant(o) {
  this.action = o;
  this.dependencies = new goog.structs.Set();
}

// local view of a TVar
function h$LocalTVar(v) {
  TRACE_STM("creating tvar view for: " + h$collectProps(v));
  this.readVal = v.val;  // the value when read from environment
  this.val     = v.val;  // the current uncommitted value
  this.tvar    = v;
}

function h$atomically(o) {
  h$p3(o, h$atomically_e, h$checkInvariants_e);
  return h$stmStartTransaction(o);
}

function h$stmStartTransaction(o) {
  TRACE_STM("starting transaction: " + h$collectProps(o));
  var t = new h$Transaction(o, null);
  h$currentThread.transaction = t;
  h$r1 = o;
  return h$ap_1_0_fast();
}

function h$stmUpdateInvariantDependencies(inv) {
  var i = h$currentThread.transaction.checkRead.__iterator__();
  if(inv instanceof h$LocalInvariant) {
    try {
      while(true) {
        inv.dependencies.add(i.next());
      }
    } catch(e) { if(e !== goog.iter.StopIteration) { throw e; } }
  } else {
    try {
      while(true) {
        h$stmAddTVarInvariant(i.next(), inv);
      }
    } catch(e) { if(e !== goog.iter.StopIteration) { throw e; } }
  }
}

function h$stmAddTVarInvariant(tv, inv) {
  if(tv.invariants === null) {
    tv.invariants = new goog.structs.Set();
  }
  tv.invariants.add(inv);
}

// commit current transaction,
// if it's top-level, commit the tvars, otherwise commit to parent
function h$stmCommitTransaction() {
  var t = h$currentThread.transaction;
  var tvs = t.tvars;
  var i = tvs.getValueIterator();
  if(t.parent === null) { // real commit
    try {
      while(true) {
        var wtv = i.next();
        h$stmCommitTVar(wtv.tvar, wtv.val);
      }
    } catch(e) { if(e !== goog.iter.StopIteration) { throw e; } }
    for(var j=0;j<t.invariants.length;j++) {
      h$stmCommitInvariant(t.invariants[j]);
    }
  } else { // commit subtransaction
    var tpvs = t.parent.tvars;
    try {
      while(true) {
        var wtv = i.next();
        tpvs.set(goog.getUid(wtv.tvar), wtv);
      }
    } catch(e) { if(e !== goog.iter.StopIteration) { throw e; } }
    t.parent.invariants = t.parent.invariants.concat(t.invariants);
  }
  h$currentThread.transaction = t.parent;
}

function h$stmValidateTransaction() {
  var i = h$currentThread.transaction.accessed.getValueIterator();
  try {
    while(true) {
      var ltv = i.next();
      TRACE_STM("h$stmValidateTransaction: " + ltv);
      if(ltv.readVal !== ltv.tvar.val) return false;
    }
  } catch(e) { if(e !== goog.iter.StopIteration) { throw e; } }
  return true;
}

function h$stmAbortTransaction() {
  h$currentThread.transaction = h$currentThread.transaction.parent;
}


// add an invariant
function h$stmCheck(o) {
  h$currentThread.transaction.invariants.push(new h$LocalInvariant(o));
  return false;
}

function h$stmRetry() {
  // unwind stack to h$atomically_e or h$stmCatchRetry_e frame
  while(h$sp > 0) {
    var f = h$stack[h$sp];
    if(f === h$atomically_e || f === h$stmCatchRetry_e) {
      break;
    }
    var size;
    if(f === h$ap_gen) {
      size = ((h$stack[h$sp-1] >> 8) + 2);
    } else {
      var tag = f.gtag;
      if(tag < 0) { // dynamic size
        size = h$stack[h$sp-1];
      } else {
        size = (tag & 0xff) + 1;
      }
    }
    h$sp -= size;
  }
  // either h$sp == 0 or at a handler
  if(h$sp > 0) {
    if(f === h$atomically_e) {
      return h$stmSuspendRetry();
    } else { // h$stmCatchRetry_e
      var b = h$stack[h$sp-1];
      h$stmAbortTransaction();
      h$sp -= 2;
      h$r1 = b;
      return h$ap_1_0_fast();
    }
  } else {
    throw "h$stmRetry: STM retry outside a transaction";
  }
}

function h$stmSuspendRetry() {
  var i = h$currentThread.transaction.accessed.__iterator__();
  var tvs = new goog.structs.Set();
  try {
    while(true) {
      var tv = i.next().tvar;
      TRACE_STM("h$stmSuspendRetry, accessed: " + h$collectProps(tv));
      tv.blocked.add(h$currentThread);
      tvs.add(tv);
    }
  } catch(e) { if(e !== goog.iter.StopIteration) { throw e; } }
  waiting = new h$TVarsWaiting(tvs);
  h$blockThread(h$currentThread, waiting);
  h$p2(waiting, h$stmResumeRetry_e);
  return h$reschedule;
}

function h$stmCatchRetry(a,b) {
  h$currentThread.transaction = new h$Transaction(b, h$currentThread.transaction);
  h$p2(b, h$stmCatchRetry_e);
  h$r1 = a;
  return h$ap_1_0_fast();
}

function h$catchStm(a,handler) {
  h$p4(h$currentThread.transaction, h$currentThread.mask, handler, h$catchStm_e);
  h$r1 = a;
  return h$ap_1_0_fast();
}

var h$catchSTM = h$catchStm; // fixme remove after reboot

function h$newTVar(v) {
  return new h$TVar(v);
}

function h$readTVar(tv) {
  return h$readLocalTVar(h$currentThread.transaction,tv);
}

function h$readTVarIO(tv) {
  return tv.val;
}

function h$writeTVar(tv, v) {
  h$setLocalTVar(h$currentThread.transaction, tv, v);
}

function h$sameTVar(tv1, tv2) {
  return tv1 === tv2;
}

// get the local value of the TVar in the transaction t
// tvar is added to the read set
function h$readLocalTVar(t, tv) {
  if(t.checkRead !== null) {
    t.checkRead.add(tv);
  }
  var t0 = t;
  var tvi = goog.getUid(tv);
  while(t0 !== null) {
    var v = t0.tvars.get(tvi);
    if(v !== undefined) {
      TRACE_STM("h$readLocalTVar: found locally modified value: " + h$collectProps(v));
      return v.val;
    }
    t0 = t0.parent;
  }
  var lv = t.accessed.get(tvi);
  if(lv !== undefined) {
    TRACE_STM("h$readLocalTVar: found tvar value: " + h$collectProps(lv));
    return lv.val;
  } else {
    TRACE_STM("h$readLocalTVar: tvar value not found, adding: " + h$collectProps(tv));
    t.accessed.set(tvi, new h$LocalTVar(tv));
    return tv.val;
  }
}

function h$setLocalTVar(t, tv, v) {
  var tvi = goog.getUid(tv);
  if(!t.accessed.containsKey(tvi)) {
    t.accessed.set(tvi, new h$LocalTVar(tv));
  }
  if(t.tvars.containsKey(tvi)) {
    t.tvars.get(tvi).val = v;
  } else {
    t.tvars.set(tvi, new h$WrittenTVar(tv, v))
  }
}

function h$stmCheckInvariants() {
  var t = h$currentThread.transaction;
  function addCheck(inv) {
    h$p5(inv, h$stmCheckInvariantResult_e, t, inv, h$stmCheckInvariantStart_e);
  }
  h$p2(h$r1, h$return);
  var i = t.tvars.getValueIterator();
  try {
    while(true) {
      var wtv = i.next();
      TRACE_STM("h$stmCheckInvariants: checking: " + h$collectProps(wtv));
      var ii = wtv.tvar.invariants;
      if(ii) {
        var iii = ii.__iterator__();
        try {
          while(true) {
            addCheck(iii.next());
          }
        } catch(e) { if (e !== goog.iter.StopIteration) { throw e; } }
      }
    }
  } catch(e) { if(e !== goog.iter.StopIteration) { throw e; } }
  for(j=0;j<t.invariants.length;j++) {
    addCheck(t.invariants[j]);
  }
  return h$stack[h$sp];
}

function h$stmCommitTVar(tv, v) {
  if(v !== tv.val) {
    var iter = tv.blocked.__iterator__();
    try {
      while(true) {
        var thr = iter.next();
        if(thr.status === h$threadBlocked) {
          TRACE_STM("h$stmCommitTVar: waking up thread: " + h$threadString(thr));
          h$wakeupThread(thr);
        }
      }
    } catch(e) { if(e !== goog.iter.StopIteration) { throw e; } }
    tv.val = v;
  }
}

// remove the thread from the queues of the TVars in s
function h$stmRemoveBlockedThread(s, thread) {
  var i = s.tvars.__iterator__();
  try {
    while(true) {
      i.next().blocked.remove(thread);
    }
  } catch (e) { if(e !== goog.iter.StopIteration) { throw e; } }
}

function h$stmCommitInvariant(localInv) {
  var inv = new h$StmInvariant(localInv.action);
  var i = localInv.dependencies.__iterator__();
  try {
    while(true) {
      h$stmAddTVarInvariant(i.next(), inv);
    }
  } catch (e) { if(e !== goog.iter.StopIteration) { throw e; } }
}
